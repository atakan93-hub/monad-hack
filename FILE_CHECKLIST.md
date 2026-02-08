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
| [x] | `frontend/lib/types.ts` | User (with agent fields), TaskRequest, Proposal, Round, Topic, ArenaEntry, EscrowDeal | 2026-02-08 |
| ~~[x]~~ | ~~`frontend/lib/mock-data.ts`~~ | ~~Deleted — data inlined into seed.ts~~ | N/A |
| ~~[x]~~ | ~~`frontend/lib/mock-api.ts`~~ | ~~Deleted — replaced by supabase-api.ts~~ | N/A |

**Completion Criteria:** ~~mock-api functions return correct data when called~~ Superseded by Phase 8 (Supabase)
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
| ~~[x]~~ | ~~`frontend/components/features/arena/BountyCard.tsx`~~ | ~~Deleted — replaced by RoundCard.tsx~~ | N/A |
| ~~[x]~~ | ~~`frontend/components/features/arena/VoteButton.tsx`~~ | ~~Deleted — replaced by TopicVoteButton.tsx~~ | N/A |
| [x] | `frontend/components/features/arena/RoundCard.tsx` | Round number + prize + status Badge + topic/entry counts | 2026-02-08 |
| [x] | `frontend/components/features/arena/TopicCard.tsx` | Title + description + vote count + children slot | 2026-02-08 |
| [x] | `frontend/components/features/arena/TopicVoteButton.tsx` | Vote button (purple/cyan theme) | 2026-02-08 |
| [x] | `frontend/components/features/arena/EntryCard.tsx` | User name + repo/demo links + winner highlight | 2026-02-08 |
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

## Phase 8: Supabase DB + API

### New Files
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/.env.local` | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | 2026-02-09 |
| [x] | `frontend/lib/supabase.ts` | createClient singleton | 2026-02-09 |
| [x] | `frontend/lib/database.types.ts` | Schema type definitions (Row/Insert/Update per table) | 2026-02-09 |
| [x] | `frontend/lib/supabase-api.ts` | 25+ query functions (same signatures as mock-api.ts) | 2026-02-09 |
| [x] | `frontend/lib/hooks/useUser.ts` | Upsert users table on wallet connect | 2026-02-09 |
| [x] | `frontend/lib/seed.ts` | Seed Supabase with test data (one-time execution) | 2026-02-09 |

### DB Migration
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `supabase/migrations/20260209_merge_agents_into_users.sql` | Full reset: DROP all + CREATE 8 tables (agents merged into users) | 2026-02-09 |

### Modified Files (import migration)
| Status | File Path | Changes | Date |
|--------|-----------|---------|------|
| [x] | `frontend/app/arena/page.tsx` | mock-api → supabase-api import | 2026-02-09 |
| [x] | `frontend/app/market/page.tsx` | mock-api → supabase-api import | 2026-02-09 |
| [x] | `frontend/app/market/[id]/page.tsx` | mock-api → supabase-api import | 2026-02-09 |
| [x] | `frontend/app/agent/[id]/page.tsx` | mock-api → supabase-api import | 2026-02-09 |
| [x] | `frontend/app/dashboard/page.tsx` | mock-api → supabase-api import | 2026-02-09 |
| [x] | `frontend/components/features/market/ProposalForm.tsx` | useUser integration | 2026-02-09 |

**Completion Criteria:** All pages display Supabase data, CRUD operations work
**Details:** [`docs/phases/PHASE8-supabase.md`](docs/phases/PHASE8-supabase_kr.md)

---

## Phase 9: Contract Testnet Deployment

| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `contract/script/Deploy.s.sol` | Deploy Escrow + Arena (external FORGE token) | 2026-02-08 |
| [x] | `contract/broadcast/` | Deployment broadcast records (Monad Testnet chain 10143) | 2026-02-09 |
| [x] | `frontend/lib/contracts/addresses.ts` (modified) | Placeholder → real deployment addresses | 2026-02-09 |

**Completion Criteria:** Real contract addresses set, wagmi hooks call on-chain
**Details:** [`docs/phases/PHASE9-deployment.md`](docs/phases/PHASE9-deployment_kr.md)

---

## Phase 10: Full UI Redesign

### New Files
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/components/ui/skeleton.tsx` | Loading shimmer animation component | 2026-02-09 |

### Modified Files
| Status | File Path | Changes | Date |
|--------|-----------|---------|------|
| [x] | `frontend/app/globals.css` | .glass, .glass-strong, .glow-cyan, circuit pattern, theme overhaul | 2026-02-09 |
| [x] | `frontend/app/page.tsx` | Landing redesign: left text + right hero, circuit overlay | 2026-02-09 |
| [x] | `frontend/components/layout/Navbar.tsx` | Glassmorphism background | 2026-02-09 |
| [x] | `frontend/components/layout/Footer.tsx` | Glassmorphism + lucide icons | 2026-02-09 |
| [x] | `frontend/app/arena/page.tsx` | Glass cards, vote progress bars | 2026-02-09 |
| [x] | `frontend/app/market/page.tsx` | Glass RequestCard, styled filters | 2026-02-09 |
| [x] | `frontend/app/market/[id]/page.tsx` | Glass proposal cards | 2026-02-09 |
| [x] | `frontend/app/agent/[id]/page.tsx` | Glass hero card, tier badge glow | 2026-02-09 |
| [x] | `frontend/app/dashboard/page.tsx` | Glass StatCards, icon glow | 2026-02-09 |
| [x] | `frontend/components/features/arena/RoundCard.tsx` | Glass + status glow border | 2026-02-09 |
| [x] | `frontend/components/features/arena/TopicCard.tsx` | Vote progress bar | 2026-02-09 |
| [x] | `frontend/components/features/arena/EntryCard.tsx` | Winner golden glow | 2026-02-09 |
| [x] | `frontend/components/features/market/RequestCard.tsx` | Glass + category color | 2026-02-09 |
| [x] | `frontend/components/features/agent/AgentProfile.tsx` | Glass card | 2026-02-09 |
| [x] | `frontend/components/features/agent/AgentStats.tsx` | lucide icons | 2026-02-09 |
| [x] | `frontend/components/features/common/StatCard.tsx` | Glass + glow | 2026-02-09 |

**Completion Criteria:** Glassmorphism + cyan accent on all pages, no emoji remaining
**Details:** [`docs/phases/PHASE10-ui-redesign.md`](docs/phases/PHASE10-ui-redesign_kr.md)

---

## Phase 11: Admin Page + SIWE Auth

### New Files
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/app/admin/page.tsx` | Admin round management UI (wallet gate) | 2026-02-09 |
| [x] | `frontend/lib/hooks/useAdminCheck.ts` | Arena.admin() wallet comparison hook | 2026-02-09 |

### Modified Files
| Status | File Path | Changes | Date |
|--------|-----------|---------|------|
| [x] | `frontend/components/layout/Navbar.tsx` | Conditional Admin link (isAdmin) | 2026-02-09 |
| [x] | `frontend/app/providers.tsx` | SIWE login integration | 2026-02-09 |
| [x] | `frontend/lib/supabase-api.ts` | Admin API functions extracted | 2026-02-09 |

**Completion Criteria:** Admin wallet gate + round CRUD + SIWE mandatory login
**Details:** [`docs/phases/PHASE11-admin.md`](docs/phases/PHASE11-admin_kr.md)

---

## Post-Phase: API Routes + On-chain Verification + Agent→User Merge

### New Files
| Status | File Path | Description | Date |
|--------|-----------|-------------|------|
| [x] | `frontend/app/api/market/requests/route.ts` | API route for task request mutations | 2026-02-09 |
| [x] | `frontend/app/api/market/proposals/route.ts` | API route for proposal mutations | 2026-02-09 |
| [x] | `frontend/app/api/arena/sync/route.ts` | API route for arena on-chain sync | 2026-02-09 |
| [x] | `frontend/app/api/escrow/sync/route.ts` | API route for escrow on-chain sync | 2026-02-09 |
| [x] | `frontend/lib/context/UserProvider.tsx` | React context for user state | 2026-02-09 |
| [x] | `frontend/lib/resolve-user.ts` | resolveUserId(address) helper | 2026-02-09 |

### Modified Files (Agent→User merge)
| Status | File Path | Changes | Date |
|--------|-----------|---------|------|
| [x] | `frontend/lib/types.ts` | Agent interface removed, User extended | 2026-02-09 |
| [x] | `frontend/lib/database.types.ts` | agents table removed, users extended | 2026-02-09 |
| [x] | `frontend/lib/supabase-api.ts` | agent functions → user functions | 2026-02-09 |
| [x] | `frontend/lib/seed.ts` | Data inlined, mock-data dependency removed | 2026-02-09 |
| [x] | All pages + components | agentId → userId, Agent → User | 2026-02-09 |

**Completion Criteria:** Build passes, no Agent type references, API routes functional

---

## File Count Summary

| Phase | File Count | Completed | Details Doc |
|-------|------------|-----------|-------------|
| Phase 1: Setup | 8 | 8/8 | [PHASE1](docs/phases/PHASE1-setup.md) |
| Phase 2: UI Components | 9 | 9/9 | [PHASE2](docs/phases/PHASE2-ui-components.md) |
| Phase 3: Mock Data | 1 | 1/1 | [PHASE3](docs/phases/PHASE3-mock-data.md) |
| Phase 4: Pages + Features | 18 | 18/18 | [PHASE4](docs/phases/PHASE4-pages.md) |
| Phase 5: Wallet | 5 | 5/5 | [PHASE5](docs/phases/PHASE5-wallet.md) |
| Phase 6: Contracts | 6 | 6/6 | [PHASE6](docs/phases/PHASE6-contracts.md) |
| Phase 7: Integration | 15 | 15/15 | [PHASE7](docs/phases/PHASE7-integration.md) |
| Phase 8: Supabase | 13 | 13/13 | [PHASE8](docs/phases/PHASE8-supabase_kr.md) |
| Phase 9: Deployment | 3 | 3/3 | [PHASE9](docs/phases/PHASE9-deployment_kr.md) |
| Phase 10: UI Redesign | 17 | 17/17 | [PHASE10](docs/phases/PHASE10-ui-redesign_kr.md) |
| Phase 11: Admin + SIWE | 5 | 5/5 | [PHASE11](docs/phases/PHASE11-admin_kr.md) |
| Post-Phase | 11 | 11/11 | — |
| **Total** | **111** | **111/111** | |

---

## Phase Dependency Map

```
Phase 1 (Setup)
 ├─→ Phase 2 (UI) ──────────┐
 ├─→ Phase 3 (Mock) ────────┼─→ Phase 4 (Pages) ─→ Phase 5 (Wallet) ─┐
 └─→ Phase 6 (Contracts) ───────────────────────────────────────────┼─→ Phase 7 (Integration)
                                                                     │
Phase 8 (Supabase) ──┐                                              │
Phase 9 (Deploy)  ───┼──→ Phase 11 (Admin + SIWE) ──→ Post-Phase (API Routes + Merge)
Phase 10 (Redesign) ─┘
```

- Phase 2, 3, 6 can proceed **in parallel** after Phase 1
- Phase 4 requires Phase 2 + 3 completion
- Phase 7 requires Phase 4 + 5 + 6 completion
- Phase 8, 9, 10 can proceed **in parallel** after Phase 7
- Phase 11 requires Phase 8 + 9 completion
- Post-Phase enhancements applied after Phase 11
