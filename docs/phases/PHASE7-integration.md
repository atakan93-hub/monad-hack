# Phase 7: Integration & Polish

> Contract ↔ Frontend connection + UI polish + E2E flow testing

---

## Task Order

```
7.1 ABI extraction + copy to frontend
7.2 Contract address + ABI export file
7.3 wagmi hooks for contract calls
7.4 UI polish (glow effects, animations)
7.5 E2E flow testing
```

---

## 7.1 ABI Extraction

Extract ABI from Foundry build output:
```bash
cat contract/out/Escrow.sol/Escrow.json | jq '.abi' > frontend/lib/contracts/Escrow.abi.json
cat contract/out/Arena.sol/Arena.json | jq '.abi' > frontend/lib/contracts/Arena.abi.json
```

## 7.2 ABI + Address Export

**File:** `frontend/lib/contracts/index.ts`

Export contract addresses (Monad Testnet) + ABI objects for use with wagmi hooks.

## 7.3 wagmi Hooks

### Escrow hooks (`frontend/lib/hooks/useEscrow.ts`)
- `useCreateDeal` — create escrow deal
- `useFundDeal` — approve + fund (2-step tx)
- `useCompleteDeal` — client approves completion
- `useReleaseFunds` — release funds to agent

### Arena hooks (`frontend/lib/hooks/useArena.ts`)
- `useCreateRound` — admin creates round
- `useProposeTopic` — propose topic in Proposing round
- `useVoteForTopic` — vote with balanceOf weight
- `useSubmitEntry` — submit entry in Active round
- `useSelectWinner` — admin selects winner

### Token hooks (`frontend/lib/hooks/useForgeToken.ts`)
- `useForgeBalance` — check $FORGE balance
- `useAllowance` — check token allowance

## 7.4 UI Polish

- Amber glow: CTA buttons, highlighted cards
- Cyber blue glow: avatar rings, active vote buttons
- Card hover glow: BountyCard, RequestCard
- Text gradient: hero title, stat numbers
- Fade-in animation: page content transitions
- Pulse glow: live/active status indicators

## 7.5 E2E Flow Testing

**Scenario 1: Marketplace**
Wallet connect → post request → submit proposal → accept → escrow deposit → complete → release

**Scenario 2: Arena**
Wallet connect → browse rounds → vote on topic → submit entry → winner selection

**Scenario 3: Dashboard**
Wallet connect → view stats → active requests → received proposals

---

## Completion Checklist

- [x] ABI files exist in `frontend/lib/contracts/` (as const .ts format)
- [x] Hooks import without errors
- [x] Escrow hook wired to Market accept button
- [x] Arena vote/propose hooks wired to Arena page
- [x] Glow effects in globals.css (glow-amber, glow-blue, card-hover-glow)
- [x] Hover animations work (card-hover-glow, pulse-glow)
- [x] Logo asset (logo.webp) in Navbar
- [x] Hero asset (hero.webp) as landing background
- [x] Gradient text on stats section
- [x] Fade-in animations on hero
- [x] `npm run build` 0 errors (8 routes)
- [x] `forge test` 36 passed, 0 failed

---

## Notes
- If contracts not deployed → fall back to mock data
- approve + function call = 2-step transaction (UX guidance needed)
- Transaction pending state requires loading UI
- User-friendly error messages (parse revert reasons)

## Dependencies
- Requires Phase 4 + Phase 5 + Phase 6 complete
