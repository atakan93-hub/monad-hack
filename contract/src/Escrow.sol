// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    // ── Types ────────────────────────────────────────────
    enum DealStatus {
        Created,
        Funded,
        Completed,
        Disputed,
        Refunded
    }

    struct Deal {
        address client;
        address agent;
        uint256 amount;
        uint256 deadline;
        DealStatus status;
    }

    // ── State ────────────────────────────────────────────
    IERC20 public forgeToken;
    uint256 public feeRate; // basis points (250 = 2.5%)
    address public treasury;
    uint256 public dealCount;

    uint256 public constant MAX_FEE_RATE = 1000; // 10% cap

    mapping(uint256 => Deal) public deals;

    // ── Events ───────────────────────────────────────────
    event DealCreated(uint256 indexed dealId, address client, address agent, uint256 amount, uint256 deadline);
    event DealFunded(uint256 indexed dealId);
    event DealCompleted(uint256 indexed dealId);
    event FundsReleased(uint256 indexed dealId, address agent, uint256 payout, uint256 fee);
    event DealRefunded(uint256 indexed dealId, address client, uint256 amount);
    event DealDisputed(uint256 indexed dealId, address disputedBy);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ── Constructor ──────────────────────────────────────
    constructor(address _token, uint256 _feeRate, address _treasury) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_feeRate <= MAX_FEE_RATE, "Fee too high");

        forgeToken = IERC20(_token);
        feeRate = _feeRate;
        treasury = _treasury;
    }

    // ── Deal Lifecycle ───────────────────────────────────

    function createDeal(
        address _agent,
        uint256 _amount,
        uint256 _deadline
    ) external returns (uint256 dealId) {
        require(_agent != address(0), "Invalid agent");
        require(_agent != msg.sender, "Cannot self-deal");
        require(_amount > 0, "Zero amount");
        require(_deadline > block.timestamp, "Deadline passed");

        dealId = dealCount++;
        deals[dealId] = Deal({
            client: msg.sender,
            agent: _agent,
            amount: _amount,
            deadline: _deadline,
            status: DealStatus.Created
        });

        emit DealCreated(dealId, msg.sender, _agent, _amount, _deadline);
    }

    function fundDeal(uint256 _dealId) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(msg.sender == deal.client, "Only client");
        require(deal.status == DealStatus.Created, "Invalid status");

        deal.status = DealStatus.Funded;
        forgeToken.safeTransferFrom(msg.sender, address(this), deal.amount);

        emit DealFunded(_dealId);
    }

    function completeDeal(uint256 _dealId) external {
        Deal storage deal = deals[_dealId];
        require(msg.sender == deal.client, "Only client");
        require(deal.status == DealStatus.Funded, "Not funded");

        deal.status = DealStatus.Completed;

        emit DealCompleted(_dealId);
    }

    function releaseFunds(uint256 _dealId) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(deal.status == DealStatus.Completed, "Not completed");

        uint256 fee = (deal.amount * feeRate) / 10000;
        uint256 payout = deal.amount - fee;

        // Clear amount before transfer (CEI)
        deal.amount = 0;

        if (fee > 0) {
            forgeToken.safeTransfer(treasury, fee);
        }
        forgeToken.safeTransfer(deal.agent, payout);

        emit FundsReleased(_dealId, deal.agent, payout, fee);
    }

    function dispute(uint256 _dealId) external {
        Deal storage deal = deals[_dealId];
        require(
            msg.sender == deal.client || msg.sender == deal.agent,
            "Not party"
        );
        require(deal.status == DealStatus.Funded, "Not funded");

        deal.status = DealStatus.Disputed;

        emit DealDisputed(_dealId, msg.sender);
    }

    function refund(uint256 _dealId) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(msg.sender == deal.client, "Only client");

        bool isCreated = deal.status == DealStatus.Created;
        bool isDisputed = deal.status == DealStatus.Disputed;
        bool isExpired = deal.status == DealStatus.Funded
            && block.timestamp > deal.deadline;

        require(isCreated || isDisputed || isExpired, "Cannot refund");

        uint256 refundAmount = deal.amount;
        deal.status = DealStatus.Refunded;
        deal.amount = 0;

        // Only transfer if tokens were deposited (Funded or Disputed)
        if (!isCreated && refundAmount > 0) {
            forgeToken.safeTransfer(deal.client, refundAmount);
        }

        emit DealRefunded(_dealId, deal.client, refundAmount);
    }

    // ── Admin Config ─────────────────────────────────────

    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= MAX_FEE_RATE, "Fee too high");
        uint256 oldRate = feeRate;
        feeRate = _feeRate;
        emit FeeRateUpdated(oldRate, _feeRate);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
}
