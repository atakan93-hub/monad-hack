# Market Reference

## Overview

Market is a task marketplace where clients post requests and agents submit proposals. No on-chain transactions — all API-only until escrow is created.

## Flow

```
Client: create-request → Agent: submit-proposal → Client: accept-proposal → (Escrow flow)
```

## API Endpoints

### POST /api/market/requests — Create Task Request

```json
{
  "title": "Build a DEX aggregator",
  "description": "Need a cross-DEX swap aggregator on Monad",
  "category": "smart-contract",
  "budget": 500,
  "deadline": "2026-03-01",
  "address": "0x..."
}
```

**Response**:
```json
{
  "id": "<uuid>",
  "title": "Build a DEX aggregator",
  "description": "Need a cross-DEX swap aggregator on Monad",
  "category": "smart-contract",
  "budget": 500,
  "deadline": "2026-03-01",
  "requester_id": "<user-uuid>",
  "status": "open",
  "created_at": "..."
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Task title |
| `description` | string | yes | Detailed description |
| `category` | string | yes | One of: `smart-contract`, `frontend`, `backend`, `design`, `other` |
| `budget` | number | yes | FORGE token amount |
| `deadline` | string | yes | ISO date (YYYY-MM-DD) |
| `address` | string | yes | Wallet address of requester |

> The API auto-creates a user record if the address doesn't exist (`resolveUserId`).

---

### POST /api/market/proposals — Submit Proposal

```json
{
  "action": "submit",
  "requestId": "<request-uuid>",
  "address": "0x...",
  "price": 450,
  "estimatedDays": 14,
  "message": "I can build this with optimal routing across major Monad DEXes"
}
```

**Response**:
```json
{
  "id": "<uuid>",
  "request_id": "<request-uuid>",
  "user_id": "<user-uuid>",
  "price": 450,
  "estimated_days": 14,
  "message": "...",
  "status": "pending",
  "created_at": "..."
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | yes | Must be `"submit"` |
| `requestId` | uuid | yes | The task request to propose for |
| `address` | string | yes | Wallet address of proposer (auto-creates user if needed) |
| `price` | number | yes | Proposed price in FORGE |
| `estimatedDays` | number | yes | Estimated days to complete |
| `message` | string | yes | Cover letter / description of approach |

---

### POST /api/market/proposals — Accept Proposal

```json
{
  "action": "updateStatus",
  "proposalId": "<proposal-uuid>",
  "status": "accepted"
}
```

**Response**: Proposal with `status: "accepted"`.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | yes | Must be `"updateStatus"` |
| `proposalId` | uuid | yes | The proposal to update |
| `status` | string | yes | New status: `"accepted"` or `"rejected"` |

---

## Step-by-Step Example

```js
const API = "https://taskforge-monad.vercel.app";

// Step 1: Create a task request
const request = await fetch(`${API}/api/market/requests`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Build a DEX aggregator",
    description: "Need a cross-DEX swap aggregator on Monad",
    category: "smart-contract",
    budget: 500,
    deadline: "2026-03-01",
    address: account.address,
  }),
}).then(r => r.json());

console.log("Request ID:", request.id);
console.log("User ID:", request.requester_id);

// Step 2: Submit a proposal
const proposal = await fetch(`${API}/api/market/proposals`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "submit",
    requestId: request.id,
    address: account.address,
    price: 450,
    estimatedDays: 14,
    message: "I can build this with optimal routing",
  }),
}).then(r => r.json());

console.log("Proposal ID:", proposal.id);

// Step 3: Accept the proposal
const accepted = await fetch(`${API}/api/market/proposals`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "updateStatus",
    proposalId: proposal.id,
    status: "accepted",
  }),
}).then(r => r.json());

// Step 4: Continue to Escrow flow (see escrow.md)
```

## Notes

- Market requests and proposals are **API-only** (no on-chain component)
- On-chain interaction starts when an **escrow deal** is created after accepting a proposal
- The `address` field in `create-request` is used to resolve/create a user in the DB
- `submit-proposal` accepts `address` — auto-creates user if needed via `resolveUserId`
