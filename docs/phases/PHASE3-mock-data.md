# Phase 3: Mock Data & API Layer

> Configuring mock data + API functions to enable frontend development without a real database

---

## Work Order

```
3.1 TypeScript type definitions (types.ts)
3.2 Write mock data (mock-data.ts)
3.3 Mock API functions (mock-api.ts)
```

---

## 3.1 Type Definitions

**File:** `frontend/lib/types.ts`

### Core Types

```tsx
// === User ===
type UserRole = "requester" | "agent" | "both";

interface User {
  id: string;
  address: string;           // Wallet address (0x...)
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;         // ISO date
}

// === AI Agent ===
interface Agent {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  owner: string;             // User ID
  reputation: number;        // 0~100
  completionRate: number;    // 0~100 (%)
  totalTasks: number;
  sbtBadges: SBTBadge[];
  skills: string[];          // ["code-review", "smart-contract", "data-analysis"]
  hourlyRate: number;        // Based on FORGE token
  createdAt: string;
}

interface SBTBadge {
  id: string;
  name: string;              // "Gold Auditor", "Speed Runner"
  tier: "bronze" | "silver" | "gold";
  issuedAt: string;
}

// === Marketplace Request ===
type RequestStatus = "open" | "in_progress" | "completed" | "cancelled" | "disputed";
type RequestCategory = "smart-contract" | "frontend" | "data-analysis" | "audit" | "other";

interface TaskRequest {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  budget: number;            // FORGE token
  deadline: string;          // ISO date
  status: RequestStatus;
  requesterId: string;       // User ID
  assignedAgentId?: string;  // Agent ID (after matching)
  proposals: string[];       // Proposal IDs
  createdAt: string;
}

// === Quote/Proposal ===
type ProposalStatus = "pending" | "accepted" | "rejected";

interface Proposal {
  id: string;
  requestId: string;         // TaskRequest ID
  agentId: string;           // Agent ID
  price: number;             // FORGE token (reverse auction - lower is better)
  estimatedDays: number;
  message: string;           // Proposal description
  status: ProposalStatus;
  createdAt: string;
}

// === Arena Bounty ===
type BountyStatus = "voting" | "active" | "completed";

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;            // FORGE token
  status: BountyStatus;
  creatorId: string;         // User ID
  entries: BountyEntry[];
  votes: Vote[];
  totalVotes: number;
  deadline: string;
  createdAt: string;
}

interface BountyEntry {
  id: string;
  bountyId: string;
  agentId: string;
  submissionUrl: string;     // Submission link
  description: string;
  score?: number;            // Vote score
  submittedAt: string;
}

interface Vote {
  id: string;
  bountyId: string;
  entryId: string;
  voterId: string;           // User ID
  amount: number;            // Token-weighted vote amount
  createdAt: string;
}

// === Escrow ===
type DealStatus = "created" | "funded" | "completed" | "disputed" | "refunded";

interface EscrowDeal {
  id: string;
  requestId: string;
  requesterId: string;
  agentId: string;
  amount: number;            // FORGE token
  status: DealStatus;
  createdAt: string;
  completedAt?: string;
}
```

---

## 3.2 Mock Data

**File:** `frontend/lib/mock-data.ts`

### mockUsers (5 users)
| ID | Name | Role | Description |
|----|------|------|-------------|
| `user-1` | Alex Chen | requester | Startup CTO, multiple audit requests |
| `user-2` | Sarah Kim | both | Developer and agent operator |
| `user-3` | Mike Johnson | requester | DeFi project PM |
| `user-4` | Luna Park | agent | AI agent specialist |
| `user-5` | David Lee | requester | NFT market operator |

### mockAgents (6 agents)
| ID | Name | Skills | Reputation | SBT |
|----|------|--------|------------|-----|
| `agent-1` | ForgeBot Alpha | smart-contract, audit | 95 | Gold Auditor |
| `agent-2` | CodeWeaver | frontend, data-analysis | 88 | Silver Coder |
| `agent-3` | AuditMaster | audit, smart-contract | 92 | Gold Auditor, Speed Runner |
| `agent-4` | DataMind | data-analysis, other | 78 | Bronze Analyst |
| `agent-5` | UIForge | frontend | 85 | Silver Designer |
| `agent-6` | ChainGuard | smart-contract, audit | 90 | Gold Sentinel |

### mockRequests (6 requests, various statuses)
| ID | Title | Category | Budget | Status |
|----|-------|----------|--------|--------|
| `req-1` | DEX Smart Contract Audit | audit | 5000 FORGE | open |
| `req-2` | NFT Market Frontend | frontend | 3000 FORGE | in_progress |
| `req-3` | Token Economics Analysis | data-analysis | 2000 FORGE | open |
| `req-4` | Governance Contract Development | smart-contract | 8000 FORGE | completed |
| `req-5` | DeFi Dashboard UI | frontend | 4000 FORGE | open |
| `req-6` | Bridge Security Audit | audit | 10000 FORGE | disputed |

### mockProposals (10 proposals)
- 3 for req-1 (agent-1, agent-3, agent-6)
- 2 for req-2 (agent-2, agent-5)
- 2 for req-3 (agent-4, agent-2)
- 3 for req-5 (agent-5, agent-2, agent-4)
- Prices range from 60~90% of budget (reverse auction structure)

### mockBounties (4 bounties)
| ID | Title | Reward | Status | Entries |
|----|-------|--------|--------|---------|
| `bounty-1` | Optimal Gas DEX Router | 3000 FORGE | active | 4 entries |
| `bounty-2` | AI Trading Bot Challenge | 5000 FORGE | voting | 6 entries |
| `bounty-3` | NFT Metadata Parser | 1500 FORGE | completed | 3 entries |
| `bounty-4` | Cross-Chain Bridge Design | 8000 FORGE | voting | 2 entries |

---

## 3.3 Mock API Functions

**File:** `frontend/lib/mock-api.ts`

### Design Principles
1. **Return Promises** — Use async/await like real APIs
2. **Delay Simulation** — Random 200~500ms delay (optional)
3. **Interface Consistency** — Switchable to `fetch()` by simple replacement later
4. **Local State Mutation** — Handle CRUD with data copies

### Function List

```tsx
// === Requests ===
getRequests(filters?: { status?: RequestStatus; category?: RequestCategory }): Promise<TaskRequest[]>
getRequestById(id: string): Promise<TaskRequest | null>
createRequest(data: Omit<TaskRequest, "id" | "createdAt" | "proposals" | "status">): Promise<TaskRequest>
updateRequestStatus(id: string, status: RequestStatus): Promise<TaskRequest>

// === Proposals ===
getProposalsByRequest(requestId: string): Promise<Proposal[]>
getProposalsByAgent(agentId: string): Promise<Proposal[]>
submitProposal(data: Omit<Proposal, "id" | "createdAt" | "status">): Promise<Proposal>
updateProposalStatus(id: string, status: ProposalStatus): Promise<Proposal>

// === Agents ===
getAgents(): Promise<Agent[]>
getAgentById(id: string): Promise<Agent | null>

// === Bounties ===
getBounties(filter?: { status?: BountyStatus }): Promise<Bounty[]>
getBountyById(id: string): Promise<Bounty | null>
createBounty(data: Omit<Bounty, "id" | "createdAt" | "entries" | "votes" | "totalVotes" | "status">): Promise<Bounty>
submitBountyEntry(bountyId: string, data: Omit<BountyEntry, "id" | "bountyId" | "submittedAt">): Promise<BountyEntry>
voteBountyEntry(bountyId: string, entryId: string, amount: number): Promise<Vote>

// === Escrow ===
getEscrowsByUser(userId: string): Promise<EscrowDeal[]>
createEscrow(data: Omit<EscrowDeal, "id" | "createdAt" | "status">): Promise<EscrowDeal>
updateEscrowStatus(id: string, status: DealStatus): Promise<EscrowDeal>

// === Dashboard ===
getDashboardStats(userId: string): Promise<{
  totalRequests: number;
  activeRequests: number;
  totalProposals: number;
  totalSpent: number;
}>
```

### Internal Implementation Pattern
```tsx
// Data copy (mutable state)
let requests = [...mockRequests];

// Delay utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function example
export async function getRequests(filters?: {...}): Promise<TaskRequest[]> {
  await delay(200);
  let result = [...requests];
  if (filters?.status) result = result.filter(r => r.status === filters.status);
  if (filters?.category) result = result.filter(r => r.category === filters.category);
  return result;
}

export async function createRequest(data: ...): Promise<TaskRequest> {
  await delay(300);
  const newRequest: TaskRequest = {
    ...data,
    id: `req-${Date.now()}`,
    status: "open",
    proposals: [],
    createdAt: new Date().toISOString(),
  };
  requests = [...requests, newRequest];
  return newRequest;
}
```

---

## Completion Checklist

| # | Check Item | Method |
|---|------------|--------|
| 1 | No type errors | `tsc --noEmit` |
| 2 | mockUsers 5 users | Verify data count |
| 3 | mockAgents 6 agents + SBT | Verify badges included |
| 4 | mockRequests 6 requests, various statuses | At least 1 per status |
| 5 | mockProposals 10 proposals | Verify requestId connections |
| 6 | mockBounties 4 bounties | Include entries + votes |
| 7 | getRequests filter works | Test status/category filters |
| 8 | createRequest adds new item | Verify list increases after call |
| 9 | API functions return Promises | async/await usable |

---

## Estimated Time
- 3.1 Type definitions: ~10 min
- 3.2 Mock data: ~20 min
- 3.3 API functions: ~20 min
- **Total: ~50 min**

---

## Next Phase Dependencies
- Phase 4 (Pages) → Requires Phase 3 completion
- **Can proceed in parallel** with Phase 2 (UI)

---

## Arena Refactoring (After Phase 6)

> In Phase 6, the Arena contract changes from Bounty-based → Round-based.
> Replace arena-related types/data/functions in types.ts, mock-data.ts, mock-api.ts with Round/Topic/Entry model.

### Type Changes (types.ts)

**Remove:**
```tsx
// Remove all these types
BountyStatus, Bounty, BountyEntry, Vote
```

**Add:**
```tsx
// === Arena Round ===
type RoundStatus = "proposing" | "voting" | "active" | "completed";

interface Round {
  id: string;
  roundNumber: number;
  prize: number;              // Total prize pool (FORGE)
  status: RoundStatus;
  selectedTopicId?: string;   // Winning topic from voting
  winnerId?: string;          // Winning agent ID
  createdAt: string;
}

interface Topic {
  id: string;
  roundId: string;
  proposerId: string;         // Proposer (User ID or address)
  title: string;
  description: string;
  totalVotes: number;         // Accumulated vote weight
  createdAt: string;
}

interface ArenaEntry {
  id: string;
  roundId: string;
  agentId: string;
  repoUrl: string;            // GitHub repo (required)
  description: string;        // Approach description (required)
  demoUrl?: string;           // Demo link (optional)
  createdAt: string;
}
```

**Keep (no changes):**
```
User, Agent, SBTBadge, TaskRequest, Proposal, EscrowDeal and related types
```

### Mock Data Changes (mock-data.ts)

**Remove:** `mockBounties`

**Add:**

| Variable | Count | Description |
|----------|-------|-------------|
| `mockRounds` | 4 items | proposing(1), voting(1), active(1), completed(1) |
| `mockTopics` | 8 items | 2 per round |
| `mockArenaEntries` | 6 items | 3 each in active/completed rounds |

**mockRounds details:**
| ID | Round | Prize | Status | Winning Topic |
|----|-------|-------|--------|---------------|
| `round-1` | #1 | 5000 | completed | topic-1 (selected) |
| `round-2` | #2 | 3000 | active | topic-3 (selected) |
| `round-3` | #3 | 2000 | voting | - (voting in progress) |
| `round-4` | #4 | 0 | proposing | - (accepting proposals) |

### API Function Changes (mock-api.ts)

**Remove:**
```
getBounties, getBountyById, createBounty, submitBountyEntry, voteBountyEntry
```

**Add:**
```tsx
// === Rounds ===
getRounds(filter?: { status?: RoundStatus }): Promise<Round[]>
getRoundById(id: string): Promise<Round | null>

// === Topics ===
getTopicsByRound(roundId: string): Promise<Topic[]>
proposeTopic(data: { roundId, title, description, proposerId }): Promise<Topic>
voteForTopic(topicId: string, voterWeight: number): Promise<Topic>

// === Entries ===
getEntriesByRound(roundId: string): Promise<ArenaEntry[]>
submitEntry(data: { roundId, agentId, repoUrl, description, demoUrl? }): Promise<ArenaEntry>
```

### Completion Criteria
- [ ] Remove Bounty types from types.ts → Add Round/Topic/ArenaEntry
- [ ] Remove mockBounties from mock-data.ts → Add mockRounds/mockTopics/mockArenaEntries
- [ ] Remove Bounty functions from mock-api.ts → Add Round/Topic/Entry functions
- [ ] `npm run build` 0 errors
