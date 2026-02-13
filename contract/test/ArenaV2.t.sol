// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ArenaV2.sol";
import "./MockToken.sol";

contract ArenaV2Test is Test {
    ArenaV2 public arena;
    MockToken public token;

    address public creator = address(0x10);   // round creator
    address public alice = address(0x1);      // topic proposer / voter
    address public bob = address(0x2);        // topic proposer / voter
    address public carol = address(0x6);      // topic proposer
    address public agent1 = address(0x3);     // entry submitter
    address public agent2 = address(0x4);     // entry submitter
    address public stranger = address(0x5);

    uint256 public constant PRIZE = 5000 ether;
    uint256 public constant MIN_TOPICS = 3;
    uint256 public constant MIN_VOTE_WEIGHT = 100 ether;

    function setUp() public {
        token = new MockToken();
        arena = new ArenaV2(address(token), MIN_TOPICS, MIN_VOTE_WEIGHT);

        // Give creator tokens for prize
        token.mint(creator, 50000 ether);
        vm.prank(creator);
        token.approve(address(arena), type(uint256).max);

        // Give voters tokens
        token.mint(alice, 1000 ether);
        token.mint(bob, 3000 ether);

        // Approve for contributePrize
        vm.prank(alice);
        token.approve(address(arena), type(uint256).max);
        vm.prank(bob);
        token.approve(address(arena), type(uint256).max);
    }

    // ── 1. Anyone can create round ──────────────────────

    function test_createRound_anyoneCanCreate() public {
        vm.prank(creator);
        arena.createRound(PRIZE);

        (uint256 num, uint256 prize, address winner, ArenaV2.RoundStatus status, uint256 topicId) = arena.rounds(0);
        assertEq(num, 1);
        assertEq(prize, PRIZE);
        assertEq(winner, address(0));
        assertEq(uint8(status), uint8(ArenaV2.RoundStatus.Proposing));
        assertEq(topicId, 0);
        assertEq(arena.roundCreator(0), creator);
        assertEq(token.balanceOf(address(arena)), PRIZE);
    }

    function test_createRound_strangerCanCreate() public {
        token.mint(stranger, 1000 ether);
        vm.startPrank(stranger);
        token.approve(address(arena), type(uint256).max);
        arena.createRound(500 ether);
        vm.stopPrank();

        assertEq(arena.roundCreator(0), stranger);
        (, uint256 prize, , , ) = arena.rounds(0);
        assertEq(prize, 500 ether);
    }

    function test_createRound_zeroPrize() public {
        vm.prank(stranger);
        arena.createRound(0);

        assertEq(arena.roundCreator(0), stranger);
        (, uint256 prize, , , ) = arena.rounds(0);
        assertEq(prize, 0);
    }

    // ── 2. contributePrize ──────────────────────────────

    function test_contributePrize_success() public {
        vm.prank(creator);
        arena.createRound(PRIZE);

        vm.prank(alice);
        arena.contributePrize(0, 500 ether);

        (, uint256 prize, , , ) = arena.rounds(0);
        assertEq(prize, PRIZE + 500 ether);
    }

    // ── 3. advanceRound: Proposing → Voting ─────────────

    function test_advanceRound_proposingToVoting_needsMinTopics() public {
        vm.prank(creator);
        arena.createRound(PRIZE);

        // Only 1 topic — should fail (need 3)
        vm.prank(alice);
        arena.proposeTopic(0, "Topic A", "Desc");

        vm.expectRevert("Not enough topics");
        arena.advanceRound(0);
    }

    function test_advanceRound_proposingToVoting_success() public {
        vm.prank(creator);
        arena.createRound(PRIZE);

        _addMinTopics(0);

        // Anyone can advance
        vm.prank(stranger);
        arena.advanceRound(0);

        (, , , ArenaV2.RoundStatus status, ) = arena.rounds(0);
        assertEq(uint8(status), uint8(ArenaV2.RoundStatus.Voting));
    }

    // ── 4. advanceRound: Voting → Active ────────────────

    function test_advanceRound_votingToActive_needsMinWeight() public {
        _votingRound();

        // Vote with alice only (1000 ether < 100 ether min? no, 1000 > 100)
        // Actually 1000 > 100, so let's make a test where it fails
        // We'll use a fresh arena with high min weight
        MockToken t2 = new MockToken();
        ArenaV2 a2 = new ArenaV2(address(t2), 1, 10000 ether);

        t2.mint(address(this), 50000 ether);
        t2.approve(address(a2), type(uint256).max);
        t2.mint(alice, 100 ether);
        vm.prank(alice);
        t2.approve(address(a2), type(uint256).max);

        a2.createRound(0);
        vm.prank(alice);
        a2.proposeTopic(0, "T", "D");
        a2.advanceRound(0); // P → V (min topics = 1)

        vm.prank(alice);
        a2.voteForTopic(0); // 100 ether weight < 10000 ether min

        vm.expectRevert("Not enough vote weight");
        a2.advanceRound(0);
    }

    function test_advanceRound_votingToActive_setsWinningProposer() public {
        _votingRound();

        // alice votes topic 0 (1000), bob votes topic 1 (3000) → topic 1 wins
        vm.prank(alice);
        arena.voteForTopic(0);
        vm.prank(bob);
        arena.voteForTopic(1);

        arena.advanceRound(0);

        (, , , ArenaV2.RoundStatus status, uint256 selectedTopic) = arena.rounds(0);
        assertEq(uint8(status), uint8(ArenaV2.RoundStatus.Active));
        assertEq(selectedTopic, 1); // Topic B wins
        assertEq(arena.winningTopicProposer(0), bob); // bob proposed topic 1
        assertEq(arena.totalVoteWeight(0), 4000 ether);
    }

    function test_advanceRound_votingToActive_tieBreaksLowerTopicId() public {
        _votingRound();

        // Give alice same weight as bob
        token.mint(alice, 2000 ether); // alice now has 3000

        vm.prank(alice);
        arena.voteForTopic(0); // 3000 for topic 0
        vm.prank(bob);
        arena.voteForTopic(1); // 3000 for topic 1

        arena.advanceRound(0);

        (, , , , uint256 selectedTopic) = arena.rounds(0);
        assertEq(selectedTopic, 0); // lower topicId wins on tie
        assertEq(arena.winningTopicProposer(0), alice);
    }

    // ── 5. advanceRound: Active → Judging ───────────────

    function test_advanceRound_activeToJudging_needsEntries() public {
        _activeRound();

        vm.expectRevert("No entries");
        arena.advanceRound(0);
    }

    function test_advanceRound_activeToJudging_success() public {
        _activeRound();

        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/repo", "My impl");

        arena.advanceRound(0);

        (, , , ArenaV2.RoundStatus status, ) = arena.rounds(0);
        assertEq(uint8(status), uint8(ArenaV2.RoundStatus.Judging));
    }

    // ── 6. selectWinner — only winning topic proposer ───

    function test_selectWinner_byProposer() public {
        _judgingRound();

        // bob is winningTopicProposer
        vm.prank(bob);
        arena.selectWinner(0, agent1);

        (, , address winner, ArenaV2.RoundStatus status, ) = arena.rounds(0);
        assertEq(winner, agent1);
        assertEq(uint8(status), uint8(ArenaV2.RoundStatus.Completed));
        assertEq(token.balanceOf(agent1), PRIZE);
    }

    function test_selectWinner_notProposer_reverts() public {
        _judgingRound();

        vm.prank(stranger);
        vm.expectRevert("Only winning topic proposer");
        arena.selectWinner(0, agent1);
    }

    function test_selectWinner_noEntry_reverts() public {
        _judgingRound();

        vm.prank(bob);
        vm.expectRevert("No entry from winner");
        arena.selectWinner(0, stranger);
    }

    function test_selectWinner_alreadySelected_reverts() public {
        _judgingRound();

        vm.prank(bob);
        arena.selectWinner(0, agent1);

        // After selectWinner, status is Completed → reverts with "Not judging"
        vm.prank(bob);
        vm.expectRevert("Not judging");
        arena.selectWinner(0, agent2);
    }

    // ── 7. totalVoteWeight tracked correctly ────────────

    function test_totalVoteWeight_accumulates() public {
        _votingRound();

        vm.prank(alice);
        arena.voteForTopic(0);
        assertEq(arena.totalVoteWeight(0), 1000 ether);

        vm.prank(bob);
        arena.voteForTopic(1);
        assertEq(arena.totalVoteWeight(0), 4000 ether);
    }

    // ── 8. Full flow E2E ────────────────────────────────

    function test_fullFlow() public {
        // 1. Create round (anyone)
        vm.prank(creator);
        arena.createRound(PRIZE);

        // 2. Propose 3 topics
        vm.prank(alice);
        arena.proposeTopic(0, "Build a DEX", "Simple AMM");
        vm.prank(bob);
        arena.proposeTopic(0, "Build a Bridge", "Cross-chain bridge");
        vm.prank(carol);
        arena.proposeTopic(0, "Build a Wallet", "Smart wallet");

        // 3. Anyone advances Proposing → Voting
        vm.prank(stranger);
        arena.advanceRound(0);
        (, , , ArenaV2.RoundStatus s1, ) = arena.rounds(0);
        assertEq(uint8(s1), uint8(ArenaV2.RoundStatus.Voting));

        // 4. Vote — bob votes for his own topic (3000 weight)
        vm.prank(alice);
        arena.voteForTopic(0); // 1000 for topic 0
        vm.prank(bob);
        arena.voteForTopic(1); // 3000 for topic 1

        // 5. Anyone advances Voting → Active
        arena.advanceRound(0);
        (, , , ArenaV2.RoundStatus s2, uint256 selectedTopic) = arena.rounds(0);
        assertEq(uint8(s2), uint8(ArenaV2.RoundStatus.Active));
        assertEq(selectedTopic, 1); // Topic B wins
        assertEq(arena.winningTopicProposer(0), bob);

        // 6. Submit entries
        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/bridge", "My bridge impl");
        vm.prank(agent2);
        arena.submitEntry(0, "https://github.com/agent2/bridge", "Alt bridge impl");

        // 7. Anyone advances Active → Judging
        arena.advanceRound(0);
        (, , , ArenaV2.RoundStatus s3, ) = arena.rounds(0);
        assertEq(uint8(s3), uint8(ArenaV2.RoundStatus.Judging));

        // 8. Winning topic proposer (bob) selects winner
        vm.prank(bob);
        arena.selectWinner(0, agent1);

        (, , address winner, ArenaV2.RoundStatus finalStatus, ) = arena.rounds(0);
        assertEq(winner, agent1);
        assertEq(uint8(finalStatus), uint8(ArenaV2.RoundStatus.Completed));
        assertEq(token.balanceOf(agent1), PRIZE);
    }

    // ── 9. advanceRound from Completed reverts ──────────

    function test_advanceRound_completed_reverts() public {
        _judgingRound();
        vm.prank(bob);
        arena.selectWinner(0, agent1);

        vm.expectRevert("Cannot advance");
        arena.advanceRound(0);
    }

    // ── Helpers ──────────────────────────────────────────

    function _addMinTopics(uint256 roundId) internal {
        vm.prank(alice);
        arena.proposeTopic(roundId, "Topic A", "Desc A");
        vm.prank(bob);
        arena.proposeTopic(roundId, "Topic B", "Desc B");
        vm.prank(carol);
        arena.proposeTopic(roundId, "Topic C", "Desc C");
    }

    /// @dev Creates round + 3 topics + advances to Voting
    function _votingRound() internal {
        vm.prank(creator);
        arena.createRound(PRIZE);
        _addMinTopics(0);
        arena.advanceRound(0); // P → V
    }

    /// @dev Creates round + topics + votes + advances to Active
    function _activeRound() internal {
        _votingRound();
        vm.prank(alice);
        arena.voteForTopic(0); // 1000
        vm.prank(bob);
        arena.voteForTopic(1); // 3000
        arena.advanceRound(0); // V → A (bob's topic wins)
    }

    /// @dev Creates round through Active + entries + advances to Judging
    function _judgingRound() internal {
        _activeRound();
        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/repo", "Desc");
        vm.prank(agent2);
        arena.submitEntry(0, "https://github.com/agent2/repo", "Desc");
        arena.advanceRound(0); // A → J
    }
}
