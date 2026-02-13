// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArenaV2 — Community-governed Arena (no admin dependency)
/// @notice Anyone can create rounds, advance phases, and the winning topic proposer selects the winner.
contract ArenaV2 is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Types ────────────────────────────────────────────
    enum RoundStatus {
        Proposing,
        Voting,
        Active,
        Judging,
        Completed
    }

    struct Round {
        uint256 roundNumber;
        uint256 prize;
        address winner;
        RoundStatus status;
        uint256 selectedTopicId;
    }

    struct Topic {
        uint256 roundId;
        address proposer;
        string title;
        string description;
        uint256 totalVotes;
    }

    struct Entry {
        uint256 roundId;
        address agent;
        string repoUrl;
        string description;
    }

    // ── State ────────────────────────────────────────────
    IERC20 public forgeToken;

    uint256 public roundCount;
    uint256 public topicCount;
    uint256 public entryCount;

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Topic) public topics;
    mapping(uint256 => Entry) public entries;

    mapping(uint256 => uint256[]) public roundTopics;   // roundId → topicId[]
    mapping(uint256 => uint256[]) public roundEntries;  // roundId → entryId[]

    mapping(uint256 => mapping(address => bool)) public hasVoted;     // roundId → voter → voted?
    mapping(uint256 => mapping(address => bool)) public hasSubmitted; // roundId → agent → submitted?

    // ── V2 New State ────────────────────────────────────
    mapping(uint256 => address) public roundCreator;          // roundId → creator
    mapping(uint256 => address) public winningTopicProposer;  // roundId → proposer of winning topic
    mapping(uint256 => uint256) public totalVoteWeight;       // roundId → cumulative vote weight

    uint256 public minTopicsToAdvance;      // min topics to go Proposing→Voting
    uint256 public minVoteWeightToAdvance;  // min total vote weight to go Voting→Active

    // ── Events ───────────────────────────────────────────
    event RoundCreated(uint256 indexed roundId, uint256 roundNumber, uint256 prize, address creator);
    event PrizeContributed(uint256 indexed roundId, address contributor, uint256 amount);
    event RoundAdvanced(uint256 indexed roundId, RoundStatus newStatus);
    event TopicProposed(uint256 indexed roundId, uint256 topicId, address proposer, string title);
    event TopicVoted(uint256 indexed topicId, address voter, uint256 weight);
    event EntrySubmitted(uint256 indexed roundId, uint256 entryId, address agent);
    event WinnerSelected(uint256 indexed roundId, address winner, uint256 prize);

    // ── Constructor ──────────────────────────────────────
    constructor(address _token, uint256 _minTopics, uint256 _minVoteWeight) {
        require(_token != address(0), "Invalid token");
        require(_minTopics > 0, "Min topics must be > 0");
        forgeToken = IERC20(_token);
        minTopicsToAdvance = _minTopics;
        minVoteWeightToAdvance = _minVoteWeight;
    }

    // ── Round Management (Anyone) ────────────────────────

    /// @notice Anyone can create a round by depositing FORGE as prize
    function createRound(uint256 _prize) external nonReentrant {
        uint256 roundId = roundCount++;
        rounds[roundId] = Round({
            roundNumber: roundId + 1,
            prize: _prize,
            winner: address(0),
            status: RoundStatus.Proposing,
            selectedTopicId: 0
        });
        roundCreator[roundId] = msg.sender;

        if (_prize > 0) {
            forgeToken.safeTransferFrom(msg.sender, address(this), _prize);
        }

        emit RoundCreated(roundId, roundId + 1, _prize, msg.sender);
    }

    function contributePrize(uint256 _roundId, uint256 _amount) external nonReentrant {
        Round storage round = rounds[_roundId];
        require(_roundId < roundCount, "Round not found");
        require(round.status != RoundStatus.Completed, "Round ended");
        require(_amount > 0, "Zero amount");

        round.prize += _amount;
        forgeToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit PrizeContributed(_roundId, msg.sender, _amount);
    }

    /// @notice Anyone can advance a round when conditions are met
    function advanceRound(uint256 _roundId) external {
        Round storage round = rounds[_roundId];
        require(_roundId < roundCount, "Round not found");

        if (round.status == RoundStatus.Proposing) {
            require(
                roundTopics[_roundId].length >= minTopicsToAdvance,
                "Not enough topics"
            );
            round.status = RoundStatus.Voting;
        } else if (round.status == RoundStatus.Voting) {
            require(
                totalVoteWeight[_roundId] >= minVoteWeightToAdvance,
                "Not enough vote weight"
            );
            // Select top voted topic — ties broken by lower topicId
            uint256 topTopicId = _getTopVotedTopic(_roundId);
            round.selectedTopicId = topTopicId;
            winningTopicProposer[_roundId] = topics[topTopicId].proposer;
            round.status = RoundStatus.Active;
        } else if (round.status == RoundStatus.Active) {
            require(roundEntries[_roundId].length >= 1, "No entries");
            round.status = RoundStatus.Judging;
        } else {
            revert("Cannot advance");
        }

        emit RoundAdvanced(_roundId, round.status);
    }

    /// @notice Only the winning topic proposer can select the winner
    function selectWinner(uint256 _roundId, address _winner) external nonReentrant {
        Round storage round = rounds[_roundId];
        require(_roundId < roundCount, "Round not found");
        require(round.status == RoundStatus.Judging, "Not judging");
        require(round.winner == address(0), "Already selected");
        require(_winner != address(0), "Invalid winner");
        require(
            msg.sender == winningTopicProposer[_roundId],
            "Only winning topic proposer"
        );
        require(hasSubmitted[_roundId][_winner], "No entry from winner");

        round.winner = _winner;
        round.status = RoundStatus.Completed;
        uint256 prize = round.prize;
        round.prize = 0;

        if (prize > 0) {
            forgeToken.safeTransfer(_winner, prize);
        }

        emit WinnerSelected(_roundId, _winner, prize);
    }

    // ── Topic Proposals (Anyone) ─────────────────────────

    function proposeTopic(
        uint256 _roundId,
        string calldata _title,
        string calldata _description
    ) external {
        require(_roundId < roundCount, "Round not found");
        require(rounds[_roundId].status == RoundStatus.Proposing, "Not proposing");
        require(bytes(_title).length > 0, "Empty title");

        uint256 topicId = topicCount++;
        topics[topicId] = Topic({
            roundId: _roundId,
            proposer: msg.sender,
            title: _title,
            description: _description,
            totalVotes: 0
        });

        roundTopics[_roundId].push(topicId);

        emit TopicProposed(_roundId, topicId, msg.sender, _title);
    }

    // ── Voting (Token Holders) ───────────────────────────

    function voteForTopic(uint256 _topicId) external {
        require(_topicId < topicCount, "Topic not found");
        Topic storage topic = topics[_topicId];
        uint256 roundId = topic.roundId;

        require(rounds[roundId].status == RoundStatus.Voting, "Not voting");
        require(!hasVoted[roundId][msg.sender], "Already voted");

        uint256 weight = forgeToken.balanceOf(msg.sender);
        require(weight > 0, "No tokens");

        topic.totalVotes += weight;
        totalVoteWeight[roundId] += weight;
        hasVoted[roundId][msg.sender] = true;

        emit TopicVoted(_topicId, msg.sender, weight);
    }

    // ── Entry Submission (Agents) ────────────────────────

    function submitEntry(
        uint256 _roundId,
        string calldata _repoUrl,
        string calldata _description
    ) external {
        require(_roundId < roundCount, "Round not found");
        require(rounds[_roundId].status == RoundStatus.Active, "Not active");
        require(!hasSubmitted[_roundId][msg.sender], "Already submitted");
        require(bytes(_repoUrl).length > 0, "Empty repo URL");
        require(bytes(_description).length > 0, "Empty description");

        uint256 entryId = entryCount++;
        entries[entryId] = Entry({
            roundId: _roundId,
            agent: msg.sender,
            repoUrl: _repoUrl,
            description: _description
        });

        roundEntries[_roundId].push(entryId);
        hasSubmitted[_roundId][msg.sender] = true;

        emit EntrySubmitted(_roundId, entryId, msg.sender);
    }

    // ── View Functions ───────────────────────────────────

    function getRoundTopics(uint256 _roundId) external view returns (uint256[] memory) {
        return roundTopics[_roundId];
    }

    function getRoundEntries(uint256 _roundId) external view returns (uint256[] memory) {
        return roundEntries[_roundId];
    }

    // ── Internal ─────────────────────────────────────────

    /// @dev Returns topicId with highest totalVotes. Ties broken by lower topicId.
    function _getTopVotedTopic(uint256 _roundId) internal view returns (uint256) {
        uint256[] storage topicIds = roundTopics[_roundId];
        require(topicIds.length > 0, "No topics");

        uint256 topId = topicIds[0];
        uint256 topVotes = topics[topId].totalVotes;

        for (uint256 i = 1; i < topicIds.length; i++) {
            // strictly greater — ties keep the earlier (lower) topicId
            if (topics[topicIds[i]].totalVotes > topVotes) {
                topId = topicIds[i];
                topVotes = topics[topId].totalVotes;
            }
        }

        return topId;
    }
}
