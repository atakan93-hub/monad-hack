# TaskForge MVP - Final Implementation Plan

## Context
Phases 1-7 completed. Remaining work: DB setup, contract deployment, design enhancement, Admin page, testing, and mainnet deployment.
Currently running on mock-api (25 functions, in-memory) with all contract addresses as placeholders (0x000...).

## Execution Order

```
Phase 8: Supabase DB + API        ──┐
Phase 9: Contract Testnet Deploy   ──┼──→ Phase 11: Admin + Testing + Mainnet
Phase 10: Full UI Redesign         ──┘
```

8/9/10 can be executed in parallel independently. 11 proceeds after 8+9 completion.

---

## Phase 8: Supabase DB + API

### 8-1. Create Supabase Project
- Create free project at supabase.com
- Obtain Project URL + `anon` key

### 8-2. Table Schema (9 Tables)

| Table | Main Columns | Notes |
|-------|--------------|-------|
| `users` | id, address(unique), name, role, avatar_url | Wallet address = User ID |
| `agents` | id, name, description, owner_id(FK), reputation, skills[], hourly_rate | |
| `sbt_badges` | id, agent_id(FK), name, tier | |
| `task_requests` | id, title, category, budget, deadline, status, requester_id(FK) | |
| `proposals` | id, request_id(FK), agent_id(FK), price, estimated_days, status | |
| `rounds` | id, round_number, prize, status, selected_topic_id, winner_id | Arena |
| `topics` | id, round_id(FK), proposer_id(FK), title, total_votes | |
| `arena_entries` | id, round_id(FK), agent_id(FK), repo_url, demo_url | |
| `escrow_deals` | id, request_id(FK), requester_id(FK), agent_id(FK), amount, status | |

- RLS: Full public read/write for MVP (anon key)
- `increment_votes` RPC function (atomic vote increment)

### 8-3. New Files to Create

| File | Description |
|------|-------------|
| `frontend/.env.local` | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY |
| `frontend/lib/supabase.ts` | createClient singleton |
| `frontend/lib/database.types.ts` | Schema type definitions |
| `frontend/lib/supabase-api.ts` | Same 25 functions as mock-api.ts, implemented with Supabase queries |
| `frontend/lib/hooks/useUser.ts` | Upsert users table on wallet connection |
| `frontend/lib/seed.ts` | Seed Supabase with mock-data (one-time execution) |

### 8-4. Core Strategy: Maintain Identical Signatures
`supabase-api.ts` maintains **exact same function names/parameters/return types** as `mock-api.ts`.
→ Pages only need to change import path from `mock-api` → `supabase-api`.

### 8-5. Files to Modify (import replacement + useUser integration)
- `app/arena/page.tsx`
- `app/market/page.tsx`
- `app/market/[id]/page.tsx`
- `app/agent/[id]/page.tsx`
- `app/dashboard/page.tsx`
- `components/features/market/ProposalForm.tsx`

### 8-6. Verification
- Check 9 tables data in Supabase dashboard
- Verify Supabase data displays on each page load
- Test create/update operations (create request, submit proposal, vote)

---

## Phase 9: Contract Testnet Deployment

### 9-1. MockToken Deployment Script
- **New file**: `contract/script/DeployMockToken.s.sol`
- Deploy MockToken on testnet first (FORGE token substitute)
- Replace with actual FORGE address when user provides it later

### 9-2. Execute Deployment
```bash
# Deploy MockToken
forge script script/DeployMockToken.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast

# Deploy Escrow + Arena (env: PRIVATE_KEY, FORGE_TOKEN, TREASURY, FEE_RATE=250)
forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

### 9-3. Update Addresses
- **Modify**: `frontend/lib/contracts/addresses.ts` — placeholder → actual deployment addresses
- After this, `isOnChain` check becomes true → activate wagmi hooks

### 9-4. Verification
- Check contracts on block explorer
- MockToken mint → distribute tokens to test accounts
- Verify Arena.admin() == deployer address

---

## Phase 10: Full UI Redesign

Reference: Premium dark Web3 (amber hammer + cyan circuits + glassmorphism)

### 10-1. Design System Changes
**Modify**: `frontend/app/globals.css`

| Item | Current | Change To |
|------|---------|-----------|
| Background | `#09090B` | `#0a0a0f` + purple gradient |
| Accent | `#3B82F6` (blue) | `#06B6D4` (cyan/teal) |
| Cards | Solid background | Glassmorphism (backdrop-blur + white/5) |
| Icons | Emoji | lucide-react |

Additional CSS:
- `.glass` (glassmorphism cards)
- `.glow-cyan` (cyan glow)
- `.bg-gradient-hero` (hero gradient)
- `.skeleton` (loading shimmer)
- Circuit pattern overlay

### 10-2. Replace Emoji → lucide-react
- `app/page.tsx`: Feature card icons
- `app/dashboard/page.tsx`: Stat icons
- `components/features/agent/AgentStats.tsx`: Stat icons
- `app/agent/[id]/page.tsx`: Badge tier icons

### 10-3. Landing Page Redesign (`app/page.tsx`)
- Hero: Center align → left text + right hero.webp (flex row)
- 3 CTA buttons (amber filled + cyan outlined)
- Circuit pattern background overlay
- Glass feature cards

### 10-4. Navbar Redesign (`components/layout/Navbar.tsx`)
- Glassmorphism background (backdrop-blur-xl)
- Enhanced active link indicator

### 10-5. Arena Page Redesign
- RoundCard: Glass card + status-based glow border
- TopicCard: Vote progress bar
- EntryCard: Winner golden glow
- VoteButton: Cyan outline + glow

### 10-6. Market Page Redesign
- RequestCard: Glass card + category color
- FilterSidebar: Custom styled radio/checkbox
- ProposalForm: Glass wrapper

### 10-7. Dashboard Redesign
- StatCard: Glass + icon glow
- List items: Glass cards

### 10-8. Agent Profile Redesign
- Glass hero card
- Badges: Tier-based glow (gold/silver/bronze)

### 10-9. Footer Redesign (`components/layout/Footer.tsx`)
- Glassmorphism + lucide social icons

### 10-10. Common Improvements
- Skeleton loader component (`components/ui/skeleton.tsx`)
- Button hover: scale(1.02) + glow
- Card hover: Border glow transition
- Responsive check (375px / 768px / 1440px)

### 10-11. Verification
- Visual check on all pages
- Grep check for remaining emoji
- `npm run build` 0 errors

---

## Phase 11: Admin Page + Testing + Mainnet

### 11-1. Admin Page
**New file**: `frontend/app/admin/page.tsx`
**New file**: `frontend/lib/hooks/useAdminCheck.ts`

Features:
- **Wallet gate**: Compare connected wallet with Arena.admin(), deny access if mismatch
- **Create round**: Input prize → approve + createRound (dual record on-chain + Supabase)
- **Advance state**: advanceRound (Proposing→Voting→Active→Completed)
- **Select winner**: selectWinner (choose from entry list)

Reuse existing hooks: useCreateRound, useAdvanceRound, useSelectWinner from `useArena.ts`

### 11-2. Add Admin Link to Navbar
- `useAdminCheck()` → show "Admin" nav link only when isAdmin

### 11-3. Dual Recording Pattern (On-Chain + Supabase)
- Admin operations: on-chain tx success → Supabase update
- Already using same pattern in `arena/page.tsx` (mock-api + wagmi hooks in parallel)

### 11-4. E2E Testing

**Arena Full Cycle:**
1. Admin: Create round (deposit prize)
2. User: Propose topic (Proposing state)
3. Admin: Advance to Voting
4. User: Vote for topic (FORGE balance weighted)
5. Admin: Advance to Active
6. Agent: Submit entry (repo URL)
7. Admin: Advance to Completed + select winner
8. Verify prize distribution

**Escrow Full Cycle:**
1. Client: Create task → accept proposal → createDeal
2. Client: approve + fundDeal
3. Client: completeDeal
4. releaseFunds → agent receives (fee deducted)

### 11-5. Mainnet Deployment (After FORGE Token Acquisition)
- Add Monad Mainnet chain to `wagmi.ts`
- Change `addresses.ts` to chain-based address mapping
- Redeploy with actual FORGE token address
- Final verification

---

## Complete File Summary

### New Files (10)
| File | Phase |
|------|-------|
| `contract/script/DeployMockToken.s.sol` | 9 |
| `frontend/.env.local` | 8 |
| `frontend/lib/supabase.ts` | 8 |
| `frontend/lib/database.types.ts` | 8 |
| `frontend/lib/supabase-api.ts` | 8 |
| `frontend/lib/hooks/useUser.ts` | 8 |
| `frontend/lib/seed.ts` | 8 |
| `frontend/components/ui/skeleton.tsx` | 10 |
| `frontend/app/admin/page.tsx` | 11 |
| `frontend/lib/hooks/useAdminCheck.ts` | 11 |

### Files to Modify (~20)
| File | Phase | Changes |
|------|-------|---------|
| `frontend/lib/contracts/addresses.ts` | 9, 11 | Deployment addresses, chain-based mapping |
| `frontend/app/arena/page.tsx` | 8, 10 | Import replacement + redesign |
| `frontend/app/market/page.tsx` | 8, 10 | Import replacement + redesign |
| `frontend/app/market/[id]/page.tsx` | 8, 10 | Import replacement + redesign |
| `frontend/app/agent/[id]/page.tsx` | 8, 10 | Import replacement + redesign |
| `frontend/app/dashboard/page.tsx` | 8, 10 | Import replacement + redesign |
| `frontend/app/page.tsx` | 10 | Landing redesign |
| `frontend/app/globals.css` | 10 | Complete theme overhaul |
| `frontend/components/layout/Navbar.tsx` | 10, 11 | Glassmorphism + Admin link |
| `frontend/components/layout/Footer.tsx` | 10 | Redesign |
| `frontend/components/features/market/ProposalForm.tsx` | 8, 10 | useUser + styling |
| `frontend/components/features/**/*.tsx` (8 files) | 10 | Glass + lucide icons |
| `frontend/lib/wagmi.ts` | 11 | Add mainnet chain |

### Can Be Deleted (After Completion)
- `frontend/lib/mock-data.ts` — unnecessary after seeding
- `frontend/lib/mock-api.ts` — replaced by supabase-api.ts
