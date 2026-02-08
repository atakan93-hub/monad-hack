// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "./MockToken.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    MockToken public token;

    address public owner = address(this);
    address public client = address(0x1);
    address public agent = address(0x2);
    address public treasury = address(0x3);
    address public stranger = address(0x4);

    uint256 public constant FEE_RATE = 250; // 2.5%
    uint256 public constant DEAL_AMOUNT = 10000 ether;
    uint256 public constant DEADLINE = 7 days;

    function setUp() public {
        token = new MockToken();
        escrow = new Escrow(address(token), FEE_RATE, treasury);

        // Give client tokens
        token.mint(client, 100000 ether);

        // Client approves escrow
        vm.prank(client);
        token.approve(address(escrow), type(uint256).max);
    }

    // ── 1. createDeal ────────────────────────────────────

    function test_createDeal_success() public {
        vm.prank(client);
        uint256 dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);

        (address c, address a, uint256 amt, uint256 dl, Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(c, client);
        assertEq(a, agent);
        assertEq(amt, DEAL_AMOUNT);
        assertEq(dl, block.timestamp + DEADLINE);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Created));
    }

    // ── 2. fundDeal ──────────────────────────────────────

    function test_fundDeal_success() public {
        vm.prank(client);
        uint256 dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);

        vm.prank(client);
        escrow.fundDeal(dealId);

        (, , , , Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Funded));
        assertEq(token.balanceOf(address(escrow)), DEAL_AMOUNT);
    }

    // ── 3. fundDeal unauthorized ─────────────────────────

    function test_fundDeal_notClient_reverts() public {
        vm.prank(client);
        uint256 dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);

        vm.prank(stranger);
        vm.expectRevert("Only client");
        escrow.fundDeal(dealId);
    }

    // ── 4. completeDeal ──────────────────────────────────

    function test_completeDeal_success() public {
        uint256 dealId = _fundedDeal();

        vm.prank(client);
        escrow.completeDeal(dealId);

        (, , , , Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Completed));
    }

    // ── 5. completeDeal wrong status ─────────────────────

    function test_completeDeal_notFunded_reverts() public {
        vm.prank(client);
        uint256 dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);

        vm.prank(client);
        vm.expectRevert("Not funded");
        escrow.completeDeal(dealId);
    }

    // ── 6. releaseFunds with fee ─────────────────────────

    function test_releaseFunds_success_withFee() public {
        uint256 dealId = _completedDeal();

        uint256 expectedFee = (DEAL_AMOUNT * FEE_RATE) / 10000;
        uint256 expectedPayout = DEAL_AMOUNT - expectedFee;

        escrow.releaseFunds(dealId);

        assertEq(token.balanceOf(agent), expectedPayout);
        assertEq(token.balanceOf(treasury), expectedFee);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    // ── 7. releaseFunds not completed ────────────────────

    function test_releaseFunds_notCompleted_reverts() public {
        uint256 dealId = _fundedDeal();

        vm.expectRevert("Not completed");
        escrow.releaseFunds(dealId);
    }

    // ── 8. refund Created ────────────────────────────────

    function test_refund_created() public {
        vm.prank(client);
        uint256 dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);

        uint256 balBefore = token.balanceOf(client);

        vm.prank(client);
        escrow.refund(dealId);

        (, , , , Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Refunded));
        // No token transfer for Created (not yet funded)
        assertEq(token.balanceOf(client), balBefore);
    }

    // ── 9. dispute ───────────────────────────────────────

    function test_dispute_success() public {
        uint256 dealId = _fundedDeal();

        vm.prank(client);
        escrow.dispute(dealId);

        (, , , , Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Disputed));
    }

    // ── 10. refund Disputed ──────────────────────────────

    function test_refund_disputed() public {
        uint256 dealId = _fundedDeal();

        vm.prank(client);
        escrow.dispute(dealId);

        uint256 balBefore = token.balanceOf(client);

        vm.prank(client);
        escrow.refund(dealId);

        (, , , , Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Refunded));
        assertEq(token.balanceOf(client), balBefore + DEAL_AMOUNT);
    }

    // ── 11. setFeeRate / setTreasury ─────────────────────

    function test_setFeeRate_owner() public {
        escrow.setFeeRate(500);
        assertEq(escrow.feeRate(), 500);
    }

    function test_setFeeRate_tooHigh_reverts() public {
        vm.expectRevert("Fee too high");
        escrow.setFeeRate(1001);
    }

    function test_setFeeRate_notOwner_reverts() public {
        vm.prank(stranger);
        vm.expectRevert();
        escrow.setFeeRate(500);
    }

    function test_setTreasury_owner() public {
        escrow.setTreasury(address(0x99));
        assertEq(escrow.treasury(), address(0x99));
    }

    function test_setTreasury_notOwner_reverts() public {
        vm.prank(stranger);
        vm.expectRevert();
        escrow.setTreasury(address(0x99));
    }

    // ── 12. Full flow ────────────────────────────────────

    function test_fullFlow_createFundCompleteRelease() public {
        // Create
        vm.prank(client);
        uint256 dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);

        // Fund
        vm.prank(client);
        escrow.fundDeal(dealId);

        // Complete
        vm.prank(client);
        escrow.completeDeal(dealId);

        // Release
        uint256 expectedFee = (DEAL_AMOUNT * FEE_RATE) / 10000;
        uint256 expectedPayout = DEAL_AMOUNT - expectedFee;

        vm.prank(agent); // anyone can call
        escrow.releaseFunds(dealId);

        assertEq(token.balanceOf(agent), expectedPayout);
        assertEq(token.balanceOf(treasury), expectedFee);
    }

    // ── 13. refund expired Funded deal ───────────────────

    function test_refund_expired_funded() public {
        uint256 dealId = _fundedDeal();

        // Warp past deadline
        vm.warp(block.timestamp + DEADLINE + 1);

        uint256 balBefore = token.balanceOf(client);

        vm.prank(client);
        escrow.refund(dealId);

        (, , , , Escrow.DealStatus status) = escrow.deals(dealId);
        assertEq(uint8(status), uint8(Escrow.DealStatus.Refunded));
        assertEq(token.balanceOf(client), balBefore + DEAL_AMOUNT);
    }

    // ── Helpers ──────────────────────────────────────────

    function _fundedDeal() internal returns (uint256 dealId) {
        vm.prank(client);
        dealId = escrow.createDeal(agent, DEAL_AMOUNT, block.timestamp + DEADLINE);
        vm.prank(client);
        escrow.fundDeal(dealId);
    }

    function _completedDeal() internal returns (uint256 dealId) {
        dealId = _fundedDeal();
        vm.prank(client);
        escrow.completeDeal(dealId);
    }
}
