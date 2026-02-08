# Phase 6: Smart Contracts

> Escrow (Escrow) + Arena (Round System) Implementation + Testing
> ForgeToken uses externally deployed ERC20 (meme bonding curve issuance)

---

## Additional Planning (Discussion Results)

> Decisions made in discussion before Phase 6 implementation. Clarification of sections differing from existing specs.

### Change 1: Removal of ForgeToken Self-Deployment
- **Previous**: Directly deploy ForgeToken.sol
- **Changed**: Use ERC20 tokens already issued from meme bonding curves (Nadafund, etc.)
- **Impact**: Constructor references external token address via `IERC20(_token)`. Address injected via environment variable at deployment.

### Change 2: Arena — From Bounty-based → Round-based
- **Previous**: Anyone creates Bounty, token-locked voting, automatic winner
- **Changed**: Admin creates Round, balanceOf voting (no lock), Admin manually selects winner
- **Status**: 3 stages → 4 stages (`Proposing → Voting → Active → Completed`)

### Change 3: Escrow — Added Fee System
- **Previous**: No fee, completeDeal called by agent
- **Changed**: Add `feeRate` (basis points) + `treasury` address. completeDeal called by client.
- **Admin Settings**: Add `setFeeRate()`, `setTreasury()` functions

### Change 4: Arena — Anyone Can Contribute Prize
- **Previous**: Only round creator (Admin) can deposit prize
- **Changed**: `contributePrize(roundId, amount)` — Anyone can add to prize pool (until Completed)
- **Reason**: Topic proposer can add their own prize, or community contributes to interested rounds

### Change 5: Voting — One Vote Per Round
- **Decision**: One address can only vote for one topic in one round
- **Reason**: Prevent duplicate balanceOf application (no lock)
- **Implementation**: `hasVoted[roundId][voter] → bool`

### Change 6: Token Address — Fixed at Platform Level
- **Decision**: Set once at deployment, all rounds/deals use same token
- **MVP**: Token change function not implemented (redeploy if needed)

### Change 7: Escrow — releaseFunds Callable by Anyone
- **Decision**: Since completeDeal (client approval) already verifies, release can be triggered by anyone
- **Reason**: Agent can directly call release and receive payment, improving UX

### Change 8: Escrow — Allow Refund After Deadline Passes
- **Decision**: In Funded state, after deadline passes, client can refund immediately without dispute
- **Implementation**: Add condition to `refund()`: `block.timestamp > deal.deadline && status == Funded`

### Change 9: Arena — createRound Allows Zero Prize
- **Decision**: Admin can create round without prize, community fills it via contributePrize
- **Reason**: Flexible operations

### Change 10: Arena — Prevent Duplicate Agent Entries
- **Decision**: One agent can only submit once per round
- **Implementation**: `hasSubmitted[roundId][agent] → bool`

### Change 11: Arena — Strengthen selectWinner Validation
- **Decision**: Validate that winner is an agent who submitted entry to that round
- **Reason**: Prevent admin mistakes, ensure integrity

### Change 12: Arena — Unlimited Topic Proposals
- **Decision**: No limit in MVP
- **Reason**: Gas cost naturally deters spam

---

## Work Order (Dependency Order)

```
6.1 Escrow.sol (external IERC20 reference)
6.2 Arena.sol (external IERC20 reference)
6.3 test/MockToken.sol (test ERC20)
6.4 Escrow.t.sol
6.5 Arena.t.sol
6.6 Deploy.s.sol (deployment script)
```

---

## 6.1 Escrow.sol

**File:** `contract/src/Escrow.sol`

### DealStatus enum
```solidity
enum DealStatus {
    Created,    // Deal created (unfunded)
    Funded,     // Token deposit complete
    Completed,  // Client confirmed work complete
    Disputed,   // Dispute raised
    Refunded    // Refund complete
}
```

### Deal struct
```solidity
struct Deal {
    address client;         // Client
    address agent;          // Agent (performer)
    uint256 amount;         // Escrow amount (FORGE)
    uint256 deadline;       // Deadline
    DealStatus status;
}
```

### State Variables
```solidity
IERC20 public forgeToken;       // External FORGE token
uint256 public feeRate;          // Fee rate (basis points, 250 = 2.5%)
address public treasury;         // Fee recipient address
uint256 public dealCount;        // Deal ID counter
mapping(uint256 => Deal) public deals;
```

### Function Specs

| Function | Caller | Action | Status Transition |
|----------|--------|--------|-------------------|
| `constructor(token, feeRate, treasury)` | deployer | Set token + fee | - |
| `createDeal(agent, amount, deadline)` | client | Create deal | → Created |
| `fundDeal(dealId)` | client | Escrow token deposit (approve required) | Created → Funded |
| `completeDeal(dealId)` | client | Confirm work complete | Funded → Completed |
| `releaseFunds(dealId)` | anyone | Deduct fee and pay agent | Completed → (final) |
| `dispute(dealId)` | client or agent | Raise dispute | Funded → Disputed |
| `refund(dealId)` | client | Refund (Created/Disputed, or Funded+deadline expired) | Created/Disputed/Funded(expired) → Refunded |
| `setFeeRate(feeRate)` | owner | Change fee rate | - |
| `setTreasury(treasury)` | owner | Change fee recipient address | - |

### State Transition Diagram
```
Created ──(fundDeal)──→ Funded ──(completeDeal)──→ Completed ──(releaseFunds)──→ [Payment Complete]
   │                      │                                         ↑ anyone can call
   │                      ├──(dispute)──→ Disputed ──(refund)──→ Refunded
   │                      └──(deadline expired + refund)───────────→ Refunded
   └──(refund)──→ Refunded
```

### Fee Logic (releaseFunds)
```solidity
uint256 fee = deal.amount * feeRate / 10000;
uint256 payout = deal.amount - fee;
forgeToken.transfer(treasury, fee);
forgeToken.transfer(deal.agent, payout);
```

### Events
```solidity
event DealCreated(uint256 indexed dealId, address client, address agent, uint256 amount);
event DealFunded(uint256 indexed dealId);
event DealCompleted(uint256 indexed dealId);
event FundsReleased(uint256 indexed dealId, address agent, uint256 payout, uint256 fee);
event DealRefunded(uint256 indexed dealId, address client, uint256 amount);
event DealDisputed(uint256 indexed dealId, address disputedBy);
event FeeRateUpdated(uint256 oldRate, uint256 newRate);
event TreasuryUpdated(address oldTreasury, address newTreasury);
```

### Security
- `Ownable` — setFeeRate, setTreasury owner-only
- `ReentrancyGuard` — all token transfer functions
- CEI pattern (state change → token transfer)
- feeRate upper bound validation (e.g. <= 1000 = 10%)

---

## 6.2 Arena.sol

**File:** `contract/src/Arena.sol`

### RoundStatus enum
```solidity
enum RoundStatus {
    Proposing,  // Topic proposal acceptance
    Voting,     // Topic voting in progress
    Active,     // Competition in progress (entry submission)
    Completed   // Completed (waiting/completed winner selection)
}
```

### Structs
```solidity
struct Round {
    uint256 roundNumber;
    uint256 prize;              // Total prize pool (cumulative)
    address winner;             // Winning agent
    RoundStatus status;
    uint256 selectedTopicId;    // Top-voted topic
}

struct Topic {
    uint256 roundId;
    address proposer;
    string title;
    string description;
    uint256 totalVotes;         // Cumulative vote weight
}

struct Entry {
    uint256 roundId;
    address agent;
    string repoUrl;             // GitHub repo (required)
    string description;         // Approach description (required)
}
```

### State Variables
```solidity
IERC20 public forgeToken;
address public admin;
uint256 public roundCount;
uint256 public topicCount;
uint256 public entryCount;

mapping(uint256 => Round) public rounds;
mapping(uint256 => Topic) public topics;
mapping(uint256 => Entry) public entries;
mapping(uint256 => uint256[]) public roundTopics;       // roundId → topicId[]
mapping(uint256 => uint256[]) public roundEntries;      // roundId → entryId[]
mapping(uint256 => mapping(address => bool)) public hasVoted;     // roundId → voter → voted?
mapping(uint256 => mapping(address => bool)) public hasSubmitted; // roundId → agent → submitted?
```

### Function Specs

| Function | Caller | Status Condition | Core Logic |
|----------|--------|------------------|------------|
| `constructor(token)` | deployer | - | admin = msg.sender, set token |
| `createRound(prize)` | admin | - | transferFrom prize (0 allowed), create round (Proposing) |
| `contributePrize(roundId, amount)` | anyone | !Completed | Add to prize pool |
| `advanceRound(roundId)` | admin | Sequential transition | P→V→A→C (auto-select top topic on V→A) |
| `selectWinner(roundId, winner)` | admin | Completed | Set winner + pay prize (validate entry submitter) |
| `proposeTopic(roundId, title, desc)` | anyone | Proposing | Create Topic |
| `voteForTopic(topicId)` | anyone | Voting | Weight by balanceOf, one vote per round |
| `submitEntry(roundId, repoUrl, desc)` | agent | Active | Create Entry (once per round, validate hasSubmitted) |

### State Transition Diagram
```
Proposing ──(advanceRound)──→ Voting ──(advanceRound)──→ Active ──(advanceRound)──→ Completed
    │                           │                          │                          │
    Propose topics              Vote (balanceOf)            Submit entries          selectWinner
    contributePrize             contributePrize            contributePrize
```

### Voting Logic (balanceOf, no lock)
```solidity
function voteForTopic(uint256 topicId) external {
    Topic storage topic = topics[topicId];
    uint256 roundId = topic.roundId;
    require(rounds[roundId].status == RoundStatus.Voting, "Not voting");
    require(!hasVoted[roundId][msg.sender], "Already voted");

    uint256 weight = forgeToken.balanceOf(msg.sender);
    require(weight > 0, "No tokens");

    topic.totalVotes += weight;
    hasVoted[roundId][msg.sender] = true;

    emit TopicVoted(topicId, msg.sender, weight);
}
```

### advanceRound — Select Top Topic on Voting → Active
```solidity
// Transition Voting → Active
uint256 topTopicId = _getTopVotedTopic(roundId);
round.selectedTopicId = topTopicId;
```

### Events
```solidity
event RoundCreated(uint256 indexed roundId, uint256 prize);
event PrizeContributed(uint256 indexed roundId, address contributor, uint256 amount);
event RoundAdvanced(uint256 indexed roundId, RoundStatus newStatus);
event TopicProposed(uint256 indexed roundId, uint256 topicId, address proposer, string title);
event TopicVoted(uint256 indexed topicId, address voter, uint256 weight);
event EntrySubmitted(uint256 indexed roundId, uint256 entryId, address agent);
event WinnerSelected(uint256 indexed roundId, address winner, uint256 prize);
```

### Security
- `onlyAdmin` modifier
- `ReentrancyGuard` — prize payout functions
- Strict state transition order validation
- One vote per round (hasVoted)
- One submission per agent per round (hasSubmitted)
- selectWinner — only entry submitters can be winners

---

## 6.3 MockToken.sol (Test Only)

**File:** `contract/test/MockToken.sol`

```solidity
// Simple test ERC20 (anyone can mint)
contract MockToken is ERC20 {
    constructor() ERC20("Mock FORGE", "mFORGE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

---

## 6.4 Escrow Testing

**File:** `contract/test/Escrow.t.sol`

### Test Cases
| # | Test | Expected Result |
|---|------|-----------------|
| 1 | createDeal success | Deal created, status Created |
| 2 | fundDeal success | Token transferred, status Funded |
| 3 | fundDeal unauthorized | revert (client only) |
| 4 | completeDeal success | status Completed |
| 5 | completeDeal wrong state | revert (Funded only) |
| 6 | releaseFunds success + fee | agent receives payout, treasury receives fee |
| 7 | releaseFunds incomplete deal | revert |
| 8 | refund Created state | status Refunded |
| 9 | dispute success | Funded → Disputed |
| 10 | refund Disputed state | Token returned, status Refunded |
| 11 | setFeeRate / setTreasury | owner only can change |
| 12 | Full flow | create → fund → complete → release (fee accuracy) |

---

## 6.5 Arena Testing

**File:** `contract/test/Arena.t.sol`

### Test Cases
| # | Test | Expected Result |
|---|------|-----------------|
| 1 | createRound success | Round created + prize deposited |
| 2 | createRound non-Admin | revert |
| 3 | contributePrize success | prize accumulates |
| 4 | proposeTopic success | Topic created in Proposing state |
| 5 | proposeTopic non-Proposing | revert |
| 6 | voteForTopic success | balanceOf weight reflected |
| 7 | voteForTopic duplicate vote | revert (one vote per round) |
| 8 | advanceRound full transition | P→V→A→C |
| 9 | advanceRound V→A selects top topic | selectedTopicId set |
| 10 | submitEntry success | Entry created in Active state |
| 11 | selectWinner success | Prize paid + winner set |
| 12 | Full flow | create → propose → vote → advance → submit → select |

---

## 6.6 Deployment Script

**File:** `contract/script/Deploy.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/Arena.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address forgeToken = vm.envAddress("FORGE_TOKEN");
        address treasury = vm.envAddress("TREASURY");
        uint256 feeRate = vm.envOr("FEE_RATE", uint256(250)); // default 2.5%

        vm.startBroadcast(deployerKey);

        Escrow escrow = new Escrow(forgeToken, feeRate, treasury);
        Arena arena = new Arena(forgeToken);

        vm.stopBroadcast();

        console.log("Escrow:", address(escrow));
        console.log("Arena:", address(arena));
    }
}
```

---

## Completion Checklist

| # | Item | Command |
|---|------|---------|
| 1 | Full compilation | `forge build` success |
| 2 | Escrow tests | `forge test --match-contract EscrowTest` |
| 3 | Arena tests | `forge test --match-contract ArenaTest` |
| 4 | All tests | `forge test` 100% pass |
| 5 | Gas report | `forge test --gas-report` verify |

---

## File Summary

| # | File | Description |
|---|------|-------------|
| 6.1 | `contract/src/Escrow.sol` | Escrow + fee system (feeRate/treasury) |
| 6.2 | `contract/src/Arena.sol` | Round + topic voting (balanceOf) + prize contribution |
| 6.3 | `contract/test/MockToken.sol` | Test ERC20 |
| 6.4 | `contract/test/Escrow.t.sol` | Escrow tests 12 cases |
| 6.5 | `contract/test/Arena.t.sol` | Arena tests 12 cases |
| 6.6 | `contract/script/Deploy.s.sol` | Deploy Escrow + Arena |

---

## Next Phase Dependencies
- Phase 7 (Integration) → Requires Phase 6 + Phase 4 + Phase 5 complete
