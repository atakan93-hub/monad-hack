# TaskForge MVP - File Checklist

> Mark each file with `[x]` and record the date when created/completed.
> For detailed specs, refer to `docs/phases/PHASE{N}-*.md`

---

## Phase 1: Project Setup

| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `package.json` | npm workspace root | 2026-02-08 |
| [x] | `frontend/package.json` | Next.js 15 project | 2026-02-08 |
| [x] | `frontend/next.config.ts` | Next.js configuration | 2026-02-08 |
| [x] | `frontend/tsconfig.json` | TypeScript configuration | 2026-02-08 |
| [x] | `frontend/app/layout.tsx` | Root layout (fonts, meta) | 2026-02-08 |
| [x] | `frontend/app/globals.css` | Tailwind v4 theme + dark mode styles | 2026-02-08 |
| [x] | `contract/foundry.toml` | Foundry config (solc 0.8.20) | 2026-02-08 |
| [x] | `contract/lib/openzeppelin-contracts` | OpenZeppelin dependency | 2026-02-08 |

**Completion Criteria:** `npm run dev` + `forge build` working properly
**Details:** [`docs/phases/PHASE1-setup.md`](docs/phases/PHASE1-setup.md)

---

## Phase 2: UI Component Library

### components/ui/ (shadcn/ui based)
| Status | File Path | Props/Description | Date |
|--------|-----------|-------------------|------|
| [x] | `frontend/components/ui/button.tsx` | shadcn Button (default variant/size) | 2026-02-08 |
| [x] | `frontend/components/ui/card.tsx` | shadcn Card + CardHeader/Content/Footer | 2026-02-08 |
| [x] | `frontend/components/ui/input.tsx` | shadcn Input | 2026-02-08 |
| [x] | `frontend/components/ui/textarea.tsx` | shadcn Textarea | 2026-02-08 |
| [x] | `frontend/components/ui/badge.tsx` | shadcn Badge (custom variants planned) | 2026-02-08 |
| [x] | `frontend/components/ui/avatar.tsx` | shadcn Avatar + AvatarImage/Fallback | 2026-02-08 |
| [x] | `frontend/components/ui/dialog.tsx` | shadcn Dialog (Modal replacement) | 2026-02-08 |

### components/layout/
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/components/layout/Navbar.tsx` | Logo + Menu(Arena/Market/Dashboard) + ConnectWallet placeholder | 2026-02-08 |
| [x] | `frontend/components/layout/Footer.tsx` | Copyright + Links(GitHub/Docs/Twitter) | 2026-02-08 |

**Completion Criteria:** All UI components render independently
**Details:** [`docs/phases/PHASE2-ui-components.md`](docs/phases/PHASE2-ui-components.md)

---

## Phase 3: Mock Data & API Layer

| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/lib/types.ts` | User, Agent, TaskRequest, Proposal, Bounty, EscrowDeal + enum types | 2026-02-08 |
| [x] | `frontend/lib/mock-data.ts` | mockUsers(5), mockAgents(6), mockRequests(6), mockProposals(12), mockBounties(4), mockEscrows(3) | 2026-02-08 |
| [x] | `frontend/lib/mock-api.ts` | 19 CRUD functions (Promise return, 200ms delay) | 2026-02-08 |

**Completion Criteria:** mock-api functions return correct data when called
**Details:** [`docs/phases/PHASE3-mock-data.md`](docs/phases/PHASE3-mock-data.md)

---

## Phase 4: Page Implementation

### Pages
| Status | File Path | Key Elements | Date |
|--------|-----------|--------------|------|
| [x] | `frontend/app/page.tsx` | Hero(Forge emphasis) + Features(3 cards) + Stats + CTA | 2026-02-08 |
| [x] | `frontend/app/arena/page.tsx` | BountyCard grid + status filter tabs + voting UI + detail modal | 2026-02-08 |
| [x] | `frontend/app/market/page.tsx` | FilterSidebar + RequestCard grid + New Request modal | 2026-02-08 |
| [x] | `frontend/app/market/[id]/page.tsx` | Request detail + proposal list(cards) + ProposalForm | 2026-02-08 |
| [x] | `frontend/app/agent/[id]/page.tsx` | AgentProfile + AgentStats(4 cards) + SBT badges + completed works | 2026-02-08 |
| [x] | `frontend/app/dashboard/page.tsx` | StatCard(4) + ongoing requests + received proposals | 2026-02-08 |

### Feature Components
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/components/features/arena/BountyCard.tsx` | Status Badge + title + prize + participants + deadline | 2026-02-08 |
| [x] | `frontend/components/features/arena/VoteButton.tsx` | Token amount input + vote execution | 2026-02-08 |
| [x] | `frontend/components/features/market/RequestCard.tsx` | Category Badge + title + budget + proposal count | 2026-02-08 |
| [x] | `frontend/components/features/market/ProposalForm.tsx` | Price + Days + Message + Agent selection | 2026-02-08 |
| [x] | `frontend/components/features/market/FilterSidebar.tsx` | Category checkboxes + Status radio + Budget range | 2026-02-08 |
| [x] | `frontend/components/features/agent/AgentProfile.tsx` | Avatar(xl,glow) + name + description + skill Badges | 2026-02-08 |
| [x] | `frontend/components/features/agent/AgentStats.tsx` | Reputation/completion rate/total jobs/hourly rate 4-grid | 2026-02-08 |
| [x] | `frontend/components/features/common/StatCard.tsx` | Icon + large number + label | 2026-02-08 |

**Completion Criteria:** All page navigation + mock data display working
**Details:** [`docs/phases/PHASE4-pages.md`](docs/phases/PHASE4-pages.md)

---

## Phase 5: Wallet Connection

| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/lib/wagmi.ts` | wagmi config + Monad Testnet chain definition | 2026-02-08 |
| [x] | `frontend/app/providers.tsx` | WagmiProvider + QueryClientProvider + RainbowKitProvider(darkTheme) | 2026-02-08 |
| [x] | ~~`frontend/app/layout.tsx` (modified)~~ | Providers wrapping | 2026-02-08 |
| [x] | ~~`frontend/components/layout/Navbar.tsx` (modified)~~ | ConnectButton integration | 2026-02-08 |
| [x] | ~~`frontend/app/dashboard/page.tsx` (modified)~~ | Wallet connection guard when disconnected | 2026-02-08 |

**Completion Criteria:** Wallet connect/disconnect working
**Details:** [`docs/phases/PHASE5-wallet.md`](docs/phases/PHASE5-wallet.md)

---

## Phase 6: Smart Contracts

### Contract Sources
| Status | File Path | Core Features | Date |
|--------|-----------|---------------|------|
| ~~[x]~~ | ~~`contract/src/ForgeToken.sol`~~ | ~~Removed — using external ERC20 (meme bonding curve)~~ | N/A |
| [x] | `contract/src/Escrow.sol` | createDeal→fundDeal→completeDeal→releaseFunds, dispute, refund + feeRate/treasury | 2026-02-08 |
| [x] | `contract/src/Arena.sol` | Round(Proposing→Voting→Active→Completed) + Topic voting(balanceOf) + contributePrize + selectWinner | 2026-02-08 |

### Tests
| Status | File Path | Test Count | Date |
|--------|-----------|------------|------|
| ~~[x]~~ | ~~`contract/test/ForgeToken.t.sol`~~ | ~~Removed~~ | N/A |
| [x] | `contract/test/MockToken.sol` | Test ERC20 | 2026-02-08 |
| [x] | `contract/test/Escrow.t.sol` | 17 cases | 2026-02-08 |
| [x] | `contract/test/Arena.t.sol` | 19 cases | 2026-02-08 |

### Deployment Scripts
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `contract/script/Deploy.s.sol` | Deploy Escrow + Arena (references external FORGE token address) | 2026-02-08 |

**Completion Criteria:** `forge test` all passing
**Details:** [`docs/phases/PHASE6-contracts.md`](docs/phases/PHASE6-contracts.md)

---

## Phase 7: Integration & Polish

### ABI + Contract Configuration
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/lib/contracts/EscrowAbi.ts` | Escrow ABI (as const) | 2026-02-08 |
| [x] | `frontend/lib/contracts/ArenaAbi.ts` | Arena ABI (as const) | 2026-02-08 |
| [x] | `frontend/lib/contracts/Erc20Abi.ts` | ERC20 minimal ABI (as const) | 2026-02-08 |
| [x] | `frontend/lib/contracts/addresses.ts` | Deployment address placeholder (Monad Testnet) | 2026-02-08 |

### wagmi Hooks
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/lib/hooks/useEscrow.ts` | useCreateDeal, useFundDeal, useCompleteDeal, useReleaseFunds, useGetDeal | 2026-02-08 |
| [x] | `frontend/lib/hooks/useArena.ts` | useCreateRound, useAdvanceRound, useSelectWinner, useProposeTopic, useVoteForTopic, useSubmitEntry + read hooks | 2026-02-08 |
| [x] | `frontend/lib/hooks/useForgeToken.ts` | useForgeBalance, useForgeAllowance, useApprove | 2026-02-08 |

### UI Polish + Assets
| Status | File/Task | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/app/globals.css` (modified) | glow-amber/blue, card-hover-glow, text-gradient-amber, fade-in/pulse-glow animations | 2026-02-08 |
| [x] | `frontend/public/logo.webp` | Logo symbol (amber hammer+anvil) | 2026-02-08 |
| [x] | `frontend/public/hero.webp` | Hero illustration (cyber forge) | 2026-02-08 |
| [x] | `frontend/components/layout/Navbar.tsx` (modified) | Logo Image added | 2026-02-08 |
| [x] | `frontend/app/page.tsx` (modified) | Hero background image + glow CTA + gradient stats + fade-in animations | 2026-02-08 |

### Contract ↔ Frontend Integration
| Status | File/Task | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/app/arena/page.tsx` (modified) | voteForTopic + proposeTopic → wagmi hooks integration (mock fallback maintained) | 2026-02-08 |
| [x] | `frontend/app/market/[id]/page.tsx` (modified) | acceptProposal → useCreateDeal integration (mock fallback maintained) | 2026-02-08 |
| [x] | `npm run build` success | 0 errors, 8 routes | 2026-02-08 |

**Completion Criteria:** `npm run build` success + no wagmi hooks import errors + glow/animations working
**Details:** [`docs/phases/PHASE7-integration.md`](docs/phases/PHASE7-integration.md)

---

## File Count Summary

| Phase | File Count | Completed | Details Doc |
|-------|------------|-----------|-------------|
| Phase 1: Setup | 8 | 8/8 | [PHASE1](docs/phases/PHASE1-setup.md) |
| Phase 2: UI Component Library | 9 | 9/9 | [PHASE2](docs/phases/PHASE2-ui-components.md) |
| Phase 3: Mock Data | 3 | 3/3 | [PHASE3](docs/phases/PHASE3-mock-data.md) |
| Phase 4: Pages + Features | 14 | 14/14 | [PHASE4](docs/phases/PHASE4-pages.md) |
| ~~Phase 5: Wallet Connection~~ | ~~5~~ | ~~5/5~~ | [PHASE5](docs/phases/PHASE5-wallet.md) |
| Phase 6: Smart Contracts | 6 | 6/6 | [PHASE6](docs/phases/PHASE6-contracts.md) |
| Phase 7: Integration | 15 | 15/15 | [PHASE7](docs/phases/PHASE7-integration.md) |
| **Total** | **59** | **59/59** | |

---

## Phase Dependency Map

```
Phase 1 (Setup)
 ├─→ Phase 2 (UI) ──────────┐
 ├─→ Phase 3 (Mock) ────────┼─→ Phase 4 (Pages) ─→ Phase 5 (Wallet) ─┐
 └─→ Phase 6 (Contracts) ───────────────────────────────────────────┼─→ Phase 7 (Integration)
```

- Phase 2, 3, 6 can proceed **in parallel** after Phase 1
- Phase 4 requires Phase 2 + 3 completion
- Phase 7 requires Phase 4 + 5 + 6 completion
