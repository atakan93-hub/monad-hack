// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Arena.sol";
import "./MockToken.sol";

contract ArenaTest is Test {
    Arena public arena;
    MockToken public token;

    address public admin = address(this);
    address public alice = address(0x1);  // topic proposer / voter
    address public bob = address(0x2);    // voter
    address public agent1 = address(0x3); // entry submitter
    address public agent2 = address(0x4); // entry submitter
    address public stranger = address(0x5);

    uint256 public constant PRIZE = 5000 ether;

    function setUp() public {
        token = new MockToken();
        arena = new Arena(address(token), admin);

        // Give admin tokens for prize
        token.mint(admin, 50000 ether);
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

    // ── 1. createRound ───────────────────────────────────

    function test_createRound_success() public {
        arena.createRound(PRIZE);

        (uint256 num, uint256 prize, address winner, Arena.RoundStatus status, uint256 topicId) = arena.rounds(0);
        assertEq(num, 1);
        assertEq(prize, PRIZE);
        assertEq(winner, address(0));
        assertEq(uint8(status), uint8(Arena.RoundStatus.Proposing));
        assertEq(topicId, 0);
        assertEq(token.balanceOf(address(arena)), PRIZE);
    }

    // ── 2. createRound non-admin ─────────────────────────

    function test_createRound_notAdmin_reverts() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", stranger));
        arena.createRound(PRIZE);
    }

    // ── 3. contributePrize ───────────────────────────────

    function test_contributePrize_success() public {
        arena.createRound(PRIZE);

        vm.prank(alice);
        arena.contributePrize(0, 500 ether);

        (, uint256 prize, , , ) = arena.rounds(0);
        assertEq(prize, PRIZE + 500 ether);
    }

    function test_contributePrize_completed_reverts() public {
        _completedRound();

        vm.prank(alice);
        vm.expectRevert("Round ended");
        arena.contributePrize(0, 500 ether);
    }

    // ── 4. proposeTopic ──────────────────────────────────

    function test_proposeTopic_success() public {
        arena.createRound(PRIZE);

        vm.prank(alice);
        arena.proposeTopic(0, "Twitter Bot", "Auto summarize tweets");

        (uint256 roundId, address proposer, , , uint256 votes) = arena.topics(0);
        assertEq(roundId, 0);
        assertEq(proposer, alice);
        assertEq(votes, 0);

        uint256[] memory topicIds = arena.getRoundTopics(0);
        assertEq(topicIds.length, 1);
        assertEq(topicIds[0], 0);
    }

    // ── 5. proposeTopic wrong status ─────────────────────

    function test_proposeTopic_notProposing_reverts() public {
        arena.createRound(PRIZE);
        _addTopicAndAdvanceToVoting(0);

        vm.prank(alice);
        vm.expectRevert("Not proposing");
        arena.proposeTopic(0, "Late Topic", "Too late");
    }

    // ── 6. voteForTopic ──────────────────────────────────

    function test_voteForTopic_success() public {
        arena.createRound(PRIZE);
        _addTopicAndAdvanceToVoting(0);

        vm.prank(alice);
        arena.voteForTopic(0);

        (, , , , uint256 votes) = arena.topics(0);
        assertEq(votes, 1000 ether); // alice's balance
    }

    // ── 7. voteForTopic duplicate ────────────────────────

    function test_voteForTopic_duplicate_reverts() public {
        arena.createRound(PRIZE);
        _addTopicAndAdvanceToVoting(0);

        vm.prank(alice);
        arena.voteForTopic(0);

        vm.prank(alice);
        vm.expectRevert("Already voted");
        arena.voteForTopic(0);
    }

    // ── 8. advanceRound full cycle ───────────────────────

    function test_advanceRound_fullCycle() public {
        arena.createRound(PRIZE);

        // Proposing → Voting
        vm.prank(alice);
        arena.proposeTopic(0, "Topic A", "Desc A");
        arena.advanceRound(0);
        (, , , Arena.RoundStatus s1, ) = arena.rounds(0);
        assertEq(uint8(s1), uint8(Arena.RoundStatus.Voting));

        // Voting → Active
        vm.prank(alice);
        arena.voteForTopic(0);
        arena.advanceRound(0);
        (, , , Arena.RoundStatus s2, ) = arena.rounds(0);
        assertEq(uint8(s2), uint8(Arena.RoundStatus.Active));

        // Active → Completed
        arena.advanceRound(0);
        (, , , Arena.RoundStatus s3, ) = arena.rounds(0);
        assertEq(uint8(s3), uint8(Arena.RoundStatus.Completed));
    }

    // ── 9. advanceRound V→A selects top topic ────────────

    function test_advanceRound_selectsTopTopic() public {
        arena.createRound(PRIZE);

        // Two topics
        vm.prank(alice);
        arena.proposeTopic(0, "Topic A", "Desc A");
        vm.prank(bob);
        arena.proposeTopic(0, "Topic B", "Desc B");

        // Advance to Voting
        arena.advanceRound(0);

        // Alice votes for Topic A (1000), Bob votes for Topic B (3000)
        vm.prank(alice);
        arena.voteForTopic(0); // topicId 0
        vm.prank(bob);
        arena.voteForTopic(1); // topicId 1

        // Advance to Active → Topic B should win
        arena.advanceRound(0);

        (, , , , uint256 selectedTopicId) = arena.rounds(0);
        assertEq(selectedTopicId, 1); // Topic B (3000 votes)
    }

    // ── 10. submitEntry ──────────────────────────────────

    function test_submitEntry_success() public {
        _activeRound();

        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/repo", "My approach");

        (uint256 roundId, address a, , ) = arena.entries(0);
        assertEq(roundId, 0);
        assertEq(a, agent1);

        uint256[] memory entryIds = arena.getRoundEntries(0);
        assertEq(entryIds.length, 1);
    }

    function test_submitEntry_duplicate_reverts() public {
        _activeRound();

        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/repo", "First try");

        vm.prank(agent1);
        vm.expectRevert("Already submitted");
        arena.submitEntry(0, "https://github.com/agent1/repo2", "Second try");
    }

    function test_submitEntry_notActive_reverts() public {
        arena.createRound(PRIZE);

        vm.prank(agent1);
        vm.expectRevert("Not active");
        arena.submitEntry(0, "https://github.com/agent1/repo", "Too early");
    }

    // ── 11. selectWinner ─────────────────────────────────

    function test_selectWinner_success() public {
        _completedRound();

        arena.selectWinner(0, agent1);

        (, , address winner, , ) = arena.rounds(0);
        assertEq(winner, agent1);
        assertEq(token.balanceOf(agent1), PRIZE);
        assertEq(token.balanceOf(address(arena)), 0);
    }

    function test_selectWinner_noEntry_reverts() public {
        _completedRound();

        vm.expectRevert("No entry from winner");
        arena.selectWinner(0, stranger);
    }

    function test_selectWinner_notAdmin_reverts() public {
        _completedRound();

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", stranger));
        arena.selectWinner(0, agent1);
    }

    function test_selectWinner_alreadySelected_reverts() public {
        _completedRound();

        arena.selectWinner(0, agent1);

        vm.expectRevert("Already selected");
        arena.selectWinner(0, agent2);
    }

    // ── 12. Full flow ────────────────────────────────────

    function test_fullFlow() public {
        // 1. Create round
        arena.createRound(PRIZE);

        // 2. Propose topics
        vm.prank(alice);
        arena.proposeTopic(0, "Build a DEX", "Simple AMM");
        vm.prank(bob);
        arena.proposeTopic(0, "Build a Bridge", "Cross-chain bridge");

        // 3. Advance to Voting
        arena.advanceRound(0);

        // 4. Vote
        vm.prank(alice);
        arena.voteForTopic(0);
        vm.prank(bob);
        arena.voteForTopic(1);

        // 5. Advance to Active (Topic B wins: 3000 > 1000)
        arena.advanceRound(0);
        (, , , , uint256 selectedTopic) = arena.rounds(0);
        assertEq(selectedTopic, 1);

        // 6. Submit entries
        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/bridge", "My bridge impl");
        vm.prank(agent2);
        arena.submitEntry(0, "https://github.com/agent2/bridge", "Alt bridge impl");

        // 7. Advance to Completed
        arena.advanceRound(0);

        // 8. Select winner
        arena.selectWinner(0, agent1);

        (, , address winner, Arena.RoundStatus finalStatus, ) = arena.rounds(0);
        assertEq(winner, agent1);
        assertEq(uint8(finalStatus), uint8(Arena.RoundStatus.Completed));
        assertEq(token.balanceOf(agent1), PRIZE);
    }

    // ── 13. createRound with zero prize ──────────────────

    function test_createRound_zeroPrize() public {
        arena.createRound(0);

        (, uint256 prize, , , ) = arena.rounds(0);
        assertEq(prize, 0);

        // Community contributes
        vm.prank(alice);
        arena.contributePrize(0, 500 ether);

        (, uint256 newPrize, , , ) = arena.rounds(0);
        assertEq(newPrize, 500 ether);
    }

    // ── Helpers ──────────────────────────────────────────

    function _addTopicAndAdvanceToVoting(uint256 roundId) internal {
        vm.prank(alice);
        arena.proposeTopic(roundId, "Default Topic", "Default Desc");
        arena.advanceRound(roundId); // P → V
    }

    function _activeRound() internal {
        arena.createRound(PRIZE);
        vm.prank(alice);
        arena.proposeTopic(0, "Topic", "Desc");
        arena.advanceRound(0); // P → V
        vm.prank(alice);
        arena.voteForTopic(0);
        arena.advanceRound(0); // V → A
    }

    function _completedRound() internal {
        _activeRound();
        vm.prank(agent1);
        arena.submitEntry(0, "https://github.com/agent1/repo", "Desc");
        vm.prank(agent2);
        arena.submitEntry(0, "https://github.com/agent2/repo", "Desc");
        arena.advanceRound(0); // A → C
    }
}
