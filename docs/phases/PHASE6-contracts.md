# Phase 6: Smart Contracts

> Escrow + Arena implementation and tests
> ForgeToken is an external ERC20 (issued via meme bonding curve, not self-deployed)

---

## Additional Specifications (Discussion Results)

1. **No ForgeToken deployment** — use externally issued ERC20 via bonding curve
2. **Arena: Bounty → Round model** — 4 states (Proposing → Voting → Active → Completed), admin manages rounds
3. **Escrow: fee system** — `feeRate` (basis points) + `treasury` address, `completeDeal` by client only
4. **Anyone can contribute prize** — `contributePrize(roundId, amount)` open to all before Completed
5. **One vote per round** — per address, `balanceOf` weight, no token lock
6. **Token address fixed** — set once at deployment, all rounds/deals use same token
7. **releaseFunds by anyone** — since `completeDeal` already validates, release is permissionless
8. **Deadline refund** — client can refund Funded deals past deadline without dispute
9. **Zero-prize rounds** — `createRound` allows prize=0, community fills via `contributePrize`
10. **One entry per agent** — `hasSubmitted[roundId][agent]` prevents duplicates
11. **Winner validation** — `selectWinner` checks winner has submitted an entry
12. **Unlimited topic proposals** — gas cost serves as natural spam deterrent

---

## Escrow.sol

**DealStatus:** Created → Funded → Completed → (releaseFunds) | Disputed → Refunded

**Deal struct:** client, agent, amount, deadline, status

**State:** `forgeToken` (IERC20), `feeRate`, `treasury`, `dealCount`, `deals` mapping

| Function | Caller | Description |
|----------|--------|-------------|
| `createDeal(agent, amount, deadline)` | client | Create deal → Created |
| `fundDeal(dealId)` | client | Deposit tokens → Funded |
| `completeDeal(dealId)` | client | Approve completion → Completed |
| `releaseFunds(dealId)` | anyone | Pay agent (minus fee) |
| `dispute(dealId)` | client/agent | Funded → Disputed |
| `refund(dealId)` | client | Refund (Created/Disputed/Funded+expired) |
| `setFeeRate(rate)` | owner | Update fee rate (max 10%) |
| `setTreasury(addr)` | owner | Update treasury address |

Fee logic: `fee = amount * feeRate / 10000`, `payout = amount - fee`

Security: Ownable, ReentrancyGuard, CEI pattern

---

## Arena.sol

**RoundStatus:** Proposing → Voting → Active → Completed

**Structs:** Round (roundNumber, prize, winner, status, selectedTopicId), Topic (roundId, proposer, title, description, totalVotes), Entry (roundId, agent, repoUrl, description)

| Function | Caller | State | Description |
|----------|--------|-------|-------------|
| `createRound(prize)` | admin | — | Create round (Proposing), prize=0 OK |
| `contributePrize(roundId, amount)` | anyone | !Completed | Add to prize pool |
| `advanceRound(roundId)` | admin | sequential | P→V→A→C, auto-selects top topic on V→A |
| `selectWinner(roundId, winner)` | admin | Completed | Set winner + pay prize (validates entry) |
| `proposeTopic(roundId, title, desc)` | anyone | Proposing | Create topic |
| `voteForTopic(topicId)` | anyone | Voting | balanceOf weight, 1 vote per round |
| `submitEntry(roundId, repoUrl, desc)` | agent | Active | Submit entry (1 per round per agent) |

Security: onlyAdmin modifier, ReentrancyGuard, strict state transition checks

---

## Test Files

**MockToken.sol** — test-only ERC20 with public `mint(address, amount)`

**Escrow.t.sol** — 12 test cases covering full lifecycle + edge cases

**Arena.t.sol** — 12 test cases covering round lifecycle + voting + winner selection

**Deploy.s.sol** — deploys Escrow(token, feeRate, treasury) + Arena(token)

---

## Completion Checklist

- [ ] `forge build` succeeds
- [ ] Escrow tests pass (`forge test --match-contract EscrowTest`)
- [ ] Arena tests pass (`forge test --match-contract ArenaTest`)
- [ ] All tests pass (`forge test`)
- [ ] Gas report reviewed (`forge test --gas-report`)

---

## Dependencies
- Phase 7 (Integration) requires Phase 4 + Phase 5 + Phase 6
