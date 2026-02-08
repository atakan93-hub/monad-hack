# Phase 3: Mock Data & API Layer

> Mock data + API functions for frontend development without a real DB

---

## Task Order

```
3.1 TypeScript type definitions (types.ts)
3.2 Mock data (mock-data.ts)
3.3 Mock API functions (mock-api.ts)
```

---

## 3.1 Type Definitions

**File:** `frontend/lib/types.ts`

- `User` — id, address, name, role, avatarUrl, createdAt
- `Agent` — id, name, description, reputation, completionRate, totalTasks, sbtBadges, skills, hourlyRate
- `SBTBadge` — id, name, tier (bronze/silver/gold)
- `TaskRequest` — id, title, description, category, budget, deadline, status, requesterId, proposals[]
- `Proposal` — id, requestId, agentId, price, estimatedDays, message, status
- `Bounty` — id, title, description, reward, status, entries[], votes[], totalVotes, deadline
- `BountyEntry` — id, bountyId, agentId, submissionUrl, description, score
- `Vote` — id, bountyId, entryId, voterId, amount
- `EscrowDeal` — id, requestId, requesterId, agentId, amount, status

Status enums: `RequestStatus`, `ProposalStatus`, `BountyStatus`, `DealStatus`

## 3.2 Mock Data

**File:** `frontend/lib/mock-data.ts`

| Variable | Count | Description |
|----------|-------|-------------|
| `mockUsers` | 5 | Various roles (requester, agent, both) |
| `mockAgents` | 6 | Different skills, reputation scores, SBT badges |
| `mockRequests` | 6 | Various statuses (open, in_progress, completed, disputed) |
| `mockProposals` | 10 | Linked to requests, reverse auction pricing |
| `mockBounties` | 4 | voting(2), active(1), completed(1) |

## 3.3 Mock API Functions

**File:** `frontend/lib/mock-api.ts`

Design: Promise-based, delay simulation (200ms), local state mutations.

```
getRequests(filters?) → TaskRequest[]
getRequestById(id) → TaskRequest | null
createRequest(data) → TaskRequest
updateRequestStatus(id, status) → TaskRequest

getProposalsByRequest(requestId) → Proposal[]
getProposalsByAgent(agentId) → Proposal[]
submitProposal(data) → Proposal
updateProposalStatus(id, status) → Proposal

getAgents() → Agent[]
getAgentById(id) → Agent | null

getBounties(filter?) → Bounty[]
getBountyById(id) → Bounty | null
voteBountyEntry(bountyId, entryId, amount) → Vote

getEscrowsByUser(userId) → EscrowDeal[]
createEscrow(data) → EscrowDeal
updateEscrowStatus(id, status) → EscrowDeal

getDashboardStats(userId) → { totalRequests, activeRequests, totalProposals, totalSpent }
```

---

## Completion Checklist

- [ ] All types compile without errors (`tsc --noEmit`)
- [ ] mockUsers 5, mockAgents 6, mockRequests 6, mockProposals 10, mockBounties 4
- [ ] getRequests filter works (status, category)
- [ ] createRequest adds new item
- [ ] All API functions return Promises
- [ ] `npm run build` 0 errors

---

## Dependencies
- Phase 4 (Pages) requires Phase 3
- Phase 2 (UI) can run in parallel
