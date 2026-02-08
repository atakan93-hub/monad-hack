# Phase 11: Admin Page + Testing + Mainnet Deployment

> Admin management page, E2E testing, mainnet deployment preparation

---

## Task Order (Dependency-based)

```
11-1. useAdminCheck hook (independent)
 ├─ 11-2. Admin page implementation
 └─ 11-3. Add Admin link to Navbar

11-4. Dual recording pattern (Arena/Escrow)
11-5. E2E testing (Arena 8 steps, Escrow 4 steps)
11-6. Mainnet deployment (chain addition, address mapping)
```

**Parallelizable:** 11-1 is independent. 11-2/11-3 can run in parallel after 11-1 completion.
**Sequential:** 11-4 → 11-5 → 11-6

---

## 11-1. Admin Permission Check Hook

### File: `frontend/lib/hooks/useAdminCheck.ts`

**Purpose:** Compare Arena contract's `admin()` address with connected wallet address to determine admin status

```typescript
"use client";

import { useAccount, useReadContract } from "wagmi";
import { ArenaAbi } from "@/lib/contracts/ArenaAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

export function useAdminCheck() {
  const { address, isConnected } = useAccount();

  const { data: adminAddress, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA,
    abi: ArenaAbi,
    functionName: "admin",
  });

  const isAdmin = isConnected &&
                  address &&
                  adminAddress &&
                  address.toLowerCase() === adminAddress.toLowerCase();

  return {
    isAdmin,
    isLoading,
    adminAddress,
    connectedAddress: address,
  };
}
```

### Usage
```tsx
const { isAdmin, isLoading } = useAdminCheck();

if (isLoading) return <LoadingSpinner />;
if (!isAdmin) return <AccessDenied />;
```

---

## 11-2. Admin Page Implementation

### File: `frontend/app/admin/page.tsx`

### Page Structure

```
┌─────────────────────────────────────────┐
│  Admin Panel           [🔒 Wallet Addr]  │
│  ─────────────────────────────────────  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    Create Round                   │  │
│  │  Prize Amount (FORGE): [______]   │  │
│  │  [Approve] [Create Round]         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    Manage Rounds                  │  │
│  │                                   │  │
│  │  Round #1                         │  │
│  │  Status: Proposing                │  │
│  │  Prize: 10,000 FORGE              │  │
│  │  [Advance to Voting]              │  │
│  │  ─────────────────────────────    │  │
│  │  Round #2                         │  │
│  │  Status: Voting                   │  │
│  │  Topics: 5 | Votes: 230           │  │
│  │  [Advance to Active]              │  │
│  │  ─────────────────────────────    │  │
│  │  Round #3                         │  │
│  │  Status: Active                   │  │
│  │  Entries: 12                      │  │
│  │  [Select Winner]                  │  │
│  │  ─────────────────────────────    │  │
│  │  Round #4                         │  │
│  │  Status: Completed                │  │
│  │  Winner: Agent #42                │  │
│  │  ─────────────────────────────    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Component Structure (Pseudocode)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck";
import { useCreateRound, useAdvanceRound, useSelectWinner } from "@/lib/hooks/useArena";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

export default function AdminPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { address } = useAccount();

  // State
  const [prizeAmount, setPrizeAmount] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<bigint | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);

  // Wagmi hooks
  const createRound = useCreateRound();
  const advanceRound = useAdvanceRound();
  const selectWinner = useSelectWinner();

  // Load rounds from Supabase
  useEffect(() => {
    loadRounds();
  }, []);

  async function loadRounds() {
    const { data } = await supabase
      .from("rounds")
      .select("*")
      .order("round_number", { ascending: false });
    setRounds(data || []);
  }

  // === Create Round ===
  async function handleCreateRound() {
    if (!prizeAmount) return;

    const prize = parseUnits(prizeAmount, 18);

    // Step 1: Approve FORGE token
    // (ERC20 Approve UI needed - separate call via useWriteContract)

    // Step 2: Create round on-chain
    createRound.write(prize);
  }

  // Sync to Supabase on createRound success
  useEffect(() => {
    if (createRound.isSuccess) {
      syncRoundToSupabase();
    }
  }, [createRound.isSuccess]);

  async function syncRoundToSupabase() {
    // Read currentRound from on-chain and insert to Supabase
    // (getRound call + insert)
    await loadRounds();
    setPrizeAmount("");
  }

  // === Advance Round ===
  async function handleAdvanceRound(roundId: bigint) {
    advanceRound.write(roundId);
  }

  useEffect(() => {
    if (advanceRound.isSuccess) {
      // Update round status in Supabase
      updateRoundStatus();
    }
  }, [advanceRound.isSuccess]);

  async function updateRoundStatus() {
    // (Read on-chain state and sync to Supabase)
    await loadRounds();
  }

  // === Select Winner ===
  async function handleSelectWinner(roundId: bigint, winner: string) {
    selectWinner.write(roundId, winner as `0x${string}`);
  }

  useEffect(() => {
    if (selectWinner.isSuccess) {
      updateWinner();
    }
  }, [selectWinner.isSuccess]);

  async function updateWinner() {
    // Update winner in Supabase
    await loadRounds();
    setSelectedWinner("");
    setEntries([]);
  }

  // === Winner Selection UI (Modal) ===
  async function openWinnerSelector(roundId: bigint) {
    setSelectedRound(roundId);
    // Load entries for the round
    const { data } = await supabase
      .from("arena_entries")
      .select("*, agents(*)")
      .eq("round_id", roundId);
    setEntries(data || []);
  }

  // === Access Control ===
  if (adminLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Only the Arena admin can access this page.
          </p>
        </Card>
      </div>
    );
  }

  // === Main UI ===
  return (
    <div className="container mx-auto p-6 pt-24 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-heading font-bold">Admin Panel</h1>
        <Badge variant="outline" className="text-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </Badge>
      </div>

      {/* Create Round Section */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Create Round</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-2">Prize Amount (FORGE)</label>
            <Input
              type="number"
              placeholder="10000"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateRound}
            disabled={!prizeAmount || createRound.isPending}
          >
            {createRound.isPending ? "Creating..." : "Create Round"}
          </Button>
        </div>
        {createRound.error && (
          <p className="text-sm text-red-500 mt-2">
            Error: {createRound.error.message}
          </p>
        )}
      </Card>

      {/* Manage Rounds Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Manage Rounds</h2>
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">
                    Round #{round.round_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Prize: {formatUnits(BigInt(round.prize), 18)} FORGE
                  </p>
                </div>
                <Badge>{round.status}</Badge>
              </div>

              {/* Status-based action buttons */}
              {round.status === "proposing" && (
                <Button
                  size="sm"
                  onClick={() => handleAdvanceRound(BigInt(round.id))}
                  disabled={advanceRound.isPending}
                >
                  Advance to Voting
                </Button>
              )}

              {round.status === "voting" && (
                <div>
                  <p className="text-sm mb-2">
                    Topics: {round.topic_count || 0} | Votes: {round.total_votes || 0}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleAdvanceRound(BigInt(round.id))}
                    disabled={advanceRound.isPending}
                  >
                    Advance to Active
                  </Button>
                </div>
              )}

              {round.status === "active" && (
                <div>
                  <p className="text-sm mb-2">Entries: {round.entry_count || 0}</p>
                  <Button
                    size="sm"
                    onClick={() => openWinnerSelector(BigInt(round.id))}
                  >
                    Select Winner
                  </Button>
                </div>
              )}

              {round.status === "completed" && (
                <p className="text-sm text-green-600">
                  Winner: {round.winner_address?.slice(0, 6)}...{round.winner_address?.slice(-4)}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Winner Selection Modal (Simple Implementation) */}
      {selectedRound && entries.length > 0 && (
        <Card className="fixed inset-0 m-auto max-w-2xl max-h-[80vh] overflow-auto p-6 z-50">
          <h2 className="text-2xl font-semibold mb-4">Select Winner</h2>
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border p-3 rounded"
              >
                <div>
                  <p className="font-medium">{entry.agents?.name}</p>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                  <a
                    href={entry.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary"
                  >
                    {entry.repo_url}
                  </a>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    handleSelectWinner(selectedRound, entry.agents.owner_id)
                  }
                  disabled={selectWinner.isPending}
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setSelectedRound(null);
              setEntries([]);
            }}
          >
            Cancel
          </Button>
        </Card>
      )}
    </div>
  );
}
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Wallet Gate** | Compare Arena.admin() with connected wallet via useAdminCheck, deny access on mismatch |
| **Create Round** | Input prize → ERC20 Approve → createRound → Supabase sync |
| **Advance State** | advanceRound (Proposing→Voting→Active→Completed) + Supabase update |
| **Select Winner** | Display entry list → select → selectWinner → update Supabase winner_address |

---

## 11-3. Add Admin Link to Navbar

### File: `frontend/components/layout/Navbar.tsx`

**Changes:**
1. Import `useAdminCheck` hook
2. Show "Admin" link only when isAdmin is true

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck"; // Added

const navLinks = [
  { href: "/arena", label: "Arena" },
  { href: "/market", label: "Market" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin } = useAdminCheck(); // Added

  return (
    <nav className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
            <Image
              src="/logo.webp"
              alt="TaskForge"
              width={56}
              height={56}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <div className="flex items-center text-2xl">
            <span>Task</span>
            <span className="text-primary">Forge</span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href || pathname?.startsWith(href + "/")
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Admin link (conditional) */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`text-sm transition-colors ${
                pathname === "/admin"
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Wallet connection */}
        <ConnectButton
          chainStatus="icon"
          accountStatus="avatar"
          showBalance={false}
        />
      </div>
    </nav>
  );
}
```

---

## 11-4. Dual Recording Pattern (On-Chain + Supabase)

### Design Principles

**Principles:**
1. **On-chain = Source of Truth**: All state changes start with on-chain transactions
2. **Supabase = UI Cache**: Off-chain replica for fast queries
3. **tx success → DB sync**: Detect tx completion via useEffect, then update Supabase

### Pattern Example: Arena Round Creation

```tsx
// 1. On-chain transaction
const createRound = useCreateRound();
createRound.write(prize);

// 2. Detect transaction success
useEffect(() => {
  if (createRound.isSuccess && createRound.hash) {
    syncRoundToSupabase(createRound.hash);
  }
}, [createRound.isSuccess, createRound.hash]);

// 3. Supabase sync
async function syncRoundToSupabase(txHash: string) {
  // Read currentRound from on-chain
  const currentRound = await readContract({
    address: CONTRACT_ADDRESSES.ARENA,
    abi: ArenaAbi,
    functionName: "currentRound",
  });

  const round = await readContract({
    address: CONTRACT_ADDRESSES.ARENA,
    abi: ArenaAbi,
    functionName: "rounds",
    args: [currentRound],
  });

  // Insert to Supabase
  await supabase.from("rounds").insert({
    round_number: Number(currentRound),
    prize: round.prize.toString(),
    status: "proposing",
    created_tx: txHash,
  });
}
```

### Pattern Example: Escrow Deal Creation

```tsx
// Client creates deal
const createDeal = useCreateDeal();
createDeal.write(requestId, agentAddress, amount);

useEffect(() => {
  if (createDeal.isSuccess && createDeal.hash) {
    syncDealToSupabase(createDeal.hash);
  }
}, [createDeal.isSuccess]);

async function syncDealToSupabase(txHash: string) {
  // Extract dealId from on-chain (read event log)
  const receipt = await getTransactionReceipt({ hash: txHash });
  const dealId = parseDealCreatedEvent(receipt.logs);

  // Supabase insert
  await supabase.from("escrow_deals").insert({
    deal_id: dealId,
    request_id: requestId,
    requester_id: clientAddress,
    agent_id: agentAddress,
    amount: amount.toString(),
    status: "created",
    created_tx: txHash,
  });
}
```

### Sync Timing

| Event | On-chain Action | Supabase Sync Timing |
|-------|----------------|---------------------|
| Create round | createRound | Immediately after tx completion |
| Advance state | advanceRound | Update status after tx completion |
| Propose topic | proposeTopic | Insert to topics table after tx completion |
| Vote | voteForTopic | Increment total_votes after tx completion |
| Submit entry | submitEntry | Insert to arena_entries after tx completion |
| Select winner | selectWinner | Update winner_address after tx completion |
| Create deal | createDeal | Insert to escrow_deals after tx completion |
| Fund deal | fundDeal | status → funded after tx completion |
| Complete deal | completeDeal | status → completed after tx completion |

---

## 11-5. E2E Test Scenarios

### Arena Full Cycle (8 Steps)

**Prerequisites:**
- Admin wallet: 10,000 FORGE approved
- User1~3 wallets: 100 FORGE each
- Agent1~3: Ready to submit entries

| Step | Actor | Action | Verification |
|------|-------|--------|-------------|
| 1 | Admin | Create round (10,000 FORGE) | Supabase rounds table: round_number=1, status=proposing |
| 2 | User1 | Propose topic "Build AI Chatbot" | topics table insert, proposer_id=User1 |
| 3 | User2 | Propose topic "Smart Contract Audit" | topics table has 2 rows |
| 4 | Admin | Advance to Voting (advanceRound) | rounds.status → voting |
| 5 | User1 | Vote for topic1 (50 FORGE balanceOf) | topics.total_votes += 50 |
| 6 | User2 | Vote for topic2 (100 FORGE) | topics.total_votes += 100 |
| 7 | User3 | Vote for topic2 (80 FORGE) | topics.total_votes += 80 |
| 8 | Admin | Advance to Active | rounds.status → active, selected_topic_id = topic2 |
| 9 | Agent1 | Submit entry (repo URL) | arena_entries insert, agent_id=Agent1 |
| 10 | Agent2 | Submit entry | arena_entries has 2 rows |
| 11 | Agent3 | Submit entry | arena_entries has 3 rows |
| 12 | Admin | Advance to Completed + select Agent2 | rounds.status → completed, winner_id=Agent2 |
| 13 | Agent2 | Verify prize received | Agent2 FORGE balance += 10,000 |

**Automated Testing (Optional):**
- Foundry test: Reproduce full cycle in Arena.t.sol
- Frontend Playwright E2E (including Admin page)

### Escrow Full Cycle (4 Steps)

**Prerequisites:**
- Client wallet: 5,000 FORGE approved
- Agent wallet: Ready for work

| Step | Actor | Action | Verification |
|------|-------|--------|-------------|
| 1 | Client | Create task (Market page) | task_requests insert, status=open |
| 2 | Agent | Submit proposal (3,000 FORGE, 5 days) | proposals insert, price=3000 |
| 3 | Client | Accept proposal → createDeal | escrow_deals insert, status=created |
| 4 | Client | approve + fundDeal (3,000) | escrow_deals.status → funded |
| 5 | Client | Confirm completion → completeDeal | escrow_deals.status → completed |
| 6 | Contract | releaseFunds auto-call | Agent FORGE += 2925 (3000 - 2.5% fee), Treasury += 75 |

**Verification Points:**
- Escrow balance = 0
- Agent received = price * (10000 - feeRate) / 10000
- Treasury fee = price * feeRate / 10000

---

## 11-6. Mainnet Deployment

### 6-1. Add Monad Mainnet Chain

**File:** `frontend/lib/wagmi.ts`

```typescript
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

// Added: Monad Mainnet
export const monadMainnet = defineChain({
  id: 10144, // Assumed (check official docs for actual chainId)
  name: "Monad Mainnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet-rpc.monad.xyz"], // Assumed
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://monadexplorer.com",
    },
  },
  testnet: false,
});

export const config = createConfig({
  chains: [monadTestnet, monadMainnet], // Support both chains
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(),
    [monadMainnet.id]: http(),
  },
  ssr: true,
});
```

### 6-2. Chain-based Contract Address Mapping

**File:** `frontend/lib/contracts/addresses.ts`

```typescript
import { monadTestnet, monadMainnet } from "@/lib/wagmi";

type ContractAddresses = {
  FORGE_TOKEN: `0x${string}`;
  ESCROW: `0x${string}`;
  ARENA: `0x${string}`;
};

const TESTNET_ADDRESSES: ContractAddresses = {
  FORGE_TOKEN: "0x1234..." as `0x${string}`, // MockToken (Phase B deployed address)
  ESCROW: "0x5678..." as `0x${string}`,
  ARENA: "0x9abc..." as `0x${string}`,
};

const MAINNET_ADDRESSES: ContractAddresses = {
  FORGE_TOKEN: "0xABCD..." as `0x${string}`, // Actual FORGE token (issued via Nad.fun)
  ESCROW: "0xEF01..." as `0x${string}`,
  ARENA: "0x2345..." as `0x${string}`,
};

export function getContractAddresses(chainId: number): ContractAddresses {
  if (chainId === monadMainnet.id) {
    return MAINNET_ADDRESSES;
  }
  return TESTNET_ADDRESSES; // Default: testnet
}

// Default export (testnet)
export const CONTRACT_ADDRESSES = TESTNET_ADDRESSES;
```

### 6-3. Use Chain-based Addresses in Hooks

**Modify:** `frontend/lib/hooks/useArena.ts`

```typescript
import { useChainId } from "wagmi";
import { getContractAddresses } from "@/lib/contracts/addresses";

export function useCreateRound() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const arenaConfig = {
    address: addresses.ARENA,
    abi: ArenaAbi,
  } as const;

  // ... existing logic
}
```

**Apply to:**
- `useArena.ts`
- `useEscrow.ts` (to be created)
- `useAdminCheck.ts`

### 6-4. FORGE Token Replacement

**Scenario:**
1. Issue FORGE token via Nad.fun → obtain address
2. Set actual address in `MAINNET_ADDRESSES.FORGE_TOKEN`
3. Redeploy Escrow + Arena (pass actual FORGE address to constructor)
4. Update deployed Escrow/Arena addresses in `MAINNET_ADDRESSES`

**Deployment Command (Foundry):**
```bash
# .env configuration
PRIVATE_KEY=0x...
FORGE_TOKEN=0xABCD... (actual FORGE address)
TREASURY=0x... (treasury wallet)
FEE_RATE=250 (2.5%)

# Mainnet deployment
forge script script/Deploy.s.sol \
  --rpc-url https://mainnet-rpc.monad.xyz \
  --broadcast \
  --verify
```

### 6-5. Frontend Environment Variables

**File:** `frontend/.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Deployment environment (optional)
NEXT_PUBLIC_CHAIN_ENV=mainnet # or testnet
```

**Conditional chain selection in wagmi.ts:**
```typescript
const isMainnet = process.env.NEXT_PUBLIC_CHAIN_ENV === "mainnet";

export const config = createConfig({
  chains: isMainnet ? [monadMainnet] : [monadTestnet],
  // ...
});
```

---

## Completion Checklist

| # | Verification Item | Method |
|---|-------------------|--------|
| 1 | useAdminCheck works | Arena.admin() vs wallet address comparison OK |
| 2 | Admin page access control | Non-admin wallet shows Access Denied |
| 3 | Create round | Admin inputs prize → on-chain tx → Supabase insert |
| 4 | Advance state (advanceRound) | Proposing→Voting→Active→Completed sequential transition |
| 5 | Select winner | Entry list displayed → select → selectWinner tx success |
| 6 | Navbar Admin link | Shown only when isAdmin=true |
| 7 | Arena E2E 8 steps | Round creation through prize distribution complete |
| 8 | Escrow E2E 4 steps | Deal creation through releaseFunds complete |
| 9 | Chain-based address routing | Correct addresses used based on chainId |
| 10 | Mainnet deployment | Contracts deployed on Monad Mainnet |
| 11 | FORGE token replacement | Redeployed with actual FORGE address |
| 12 | No build errors | `npm run build` succeeds |

---

## Estimated Time
- D1 (useAdminCheck): ~10 min
- D2 (Admin page): ~90 min
- D3 (Navbar modification): ~5 min
- D4 (Dual recording pattern): ~30 min (documentation)
- D5 (E2E testing): ~120 min (manual testing)
- D6 (Mainnet deployment): ~60 min (deployment + verification)
- **Total: ~5.5 hours**

---

## Next Steps

After Phase D completion:
- **Production checklist**: Security audit, performance optimization
- **Monitoring setup**: On-chain events → Supabase auto-sync (Webhook)
- **Additional development**: Reputation.sol, SBTBadge.sol integration

---

## Notes

### Admin Page Security
- On-chain permission check is Source of Truth (Arena.admin())
- Frontend gate is for UX improvement (contract does final verification)

### Dual Recording Sync Strategy
- **Real-time**: Supabase updated immediately after tx completion (5~10 second delay)
- **Consistency guarantee**: Periodic sync job to re-synchronize on-chain and DB
- **Read optimization**: Query from Supabase, writes always go on-chain first

### FORGE Token Replacement Scenario
1. MVP testing: Use MockToken (self-mintable)
2. Actual launch: Replace with Nad.fun FORGE token address
3. Migration: Deploy new contracts + update addresses
