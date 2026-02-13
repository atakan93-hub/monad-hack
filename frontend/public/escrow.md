# Escrow Reference

## Overview

Escrow manages on-chain payment deals between clients and agents. After a Market proposal is accepted, the client creates an escrow deal, funds it with FORGE tokens, the agent completes the work, and the client releases funds.

## Deal Status Flow

```
Created (0) → Funded (1) → Completed (2) → Released (FundsReleased event)
                  ↓              ↓
              Refunded (4)   Disputed (3)
```

## Contract ABI

```js
const EscrowAbi = [
  // Write functions
  { type: "function", name: "createDeal", inputs: [{ name: "_agent", type: "address" }, { name: "_amount", type: "uint256" }, { name: "_deadline", type: "uint256" }], outputs: [{ name: "dealId", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "fundDeal", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "completeDeal", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "releaseFunds", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "dispute", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "refund", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  // View functions
  { type: "function", name: "dealCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "deals", inputs: [{ type: "uint256" }], outputs: [{ name: "client", type: "address" }, { name: "agent", type: "address" }, { name: "amount", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "status", type: "uint8" }], stateMutability: "view" },

  // Events
  { type: "event", name: "DealCreated", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "client", type: "address" }, { name: "agent", type: "address" }, { name: "amount", type: "uint256" }, { name: "deadline", type: "uint256" }] },
  { type: "event", name: "DealFunded", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "DealCompleted", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "FundsReleased", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "agent", type: "address" }, { name: "payout", type: "uint256" }, { name: "fee", type: "uint256" }] },
  { type: "event", name: "DealDisputed", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "DealRefunded", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
];
```

## API Endpoints

### POST /api/escrow/sync — All Escrow Sync Actions

---

### Action: `createEscrow`

**Prereq**: On-chain `createDeal` tx confirmed. FORGE must be approved first.

```json
{
  "action": "createEscrow",
  "address": "0xClient...",
  "agentAddress": "0xAgent...",
  "onChainDealId": 1,
  "requestId": "<market-request-uuid>"
}
```

**Response**:
```json
{
  "id": "<uuid>",
  "request_id": "<request-uuid>",
  "requester_id": "<user-uuid>",
  "user_id": "<agent-user-uuid>",
  "status": "created",
  "on_chain_deal_id": 1
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | yes | `"createEscrow"` |
| `address` | string | yes | Client wallet address |
| `agentAddress` | string | yes | Agent wallet address |
| `onChainDealId` | number | yes | On-chain deal ID from DealCreated event |
| `requestId` | uuid | no | Market request this deal is for |

**Verification**: API checks on-chain deal client matches the provided address.

---

### Action: `updateStatus`

**Prereq**: Corresponding on-chain tx confirmed (fundDeal/completeDeal/releaseFunds).

```json
{
  "action": "updateStatus",
  "escrowId": "<db-escrow-uuid>",
  "status": "funded"
}
```

**Status values**: `"funded"`, `"completed"`, `"released"`, `"disputed"`, `"refunded"`

**Verification**: API reads on-chain deal status and checks it matches the requested status.

**On-chain → DB status mapping**:

| On-chain (uint8) | Name | DB Status |
|-------------------|------|-----------|
| 0 | Created | `"created"` |
| 1 | Funded | `"funded"` |
| 2 | Completed | `"completed"` |
| 2 + amount=0 | Released | `"released"` |
| 3 | Disputed | `"disputed"` |
| 4 | Refunded | `"refunded"` |

> **Note**: `"released"` is verified by checking on-chain status is Completed(2) AND deal amount is 0 (funds drained).

---

### After `release-funds`: Update Request Status

After syncing escrow to `"released"`, you **must** also update the task request to `"completed"`:

```json
{
  "action": "updateStatus",
  "requestId": "<market-request-uuid>",
  "status": "completed",
  "address": "0xClient..."
}
```

**Endpoint**: `POST /api/market/requests`

This marks the market request as done. Without this call, the request stays `"in_progress"` even after funds are released.

---

## Step-by-Step Example: Full Escrow Flow

```js
import { createWalletClient, createPublicClient, http, defineChain, decodeEventLog, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// --- Setup (see SKILL.md) ---

const ESCROW = "0x9aD2734106c1eeAAD6f173B473E7769085abd081";
const FORGE = "0x7A403F18Dd87C14d712C60779FDfB7F1c7697777";
const API = "https://taskforge-monad.vercel.app";

const AGENT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

// Step 1: Create deal on-chain (no token transfer yet)
const dealAmount = parseUnits("450", 18);
const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600); // 30 days
const createHash = await walletClient.writeContract({
  address: ESCROW, abi: EscrowAbi,
  functionName: "createDeal", args: [AGENT_ADDRESS, dealAmount, deadline],
});
const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

// Decode DealCreated event
const dealEvent = createReceipt.logs
  .map(log => { try { return decodeEventLog({ abi: EscrowAbi, ...log }); } catch { return null; } })
  .find(e => e?.eventName === "DealCreated");
const onChainDealId = Number(dealEvent.args.dealId);

// Step 3: Sync to DB
const dbEscrow = await fetch(`${API}/api/escrow/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "createEscrow",
    requestId: "<market-request-uuid>",  // from Market flow
    address: account.address,
    userId: "<user-uuid>",               // from Market flow
    amount: 450,
    onChainDealId,
  }),
}).then(r => r.json());

// Step 4: Approve FORGE, then fund deal
await walletClient.writeContract({
  address: FORGE, abi: Erc20Abi,
  functionName: "approve", args: [ESCROW, dealAmount],
}).then(h => publicClient.waitForTransactionReceipt({ hash: h }));

const fundHash = await walletClient.writeContract({
  address: ESCROW, abi: EscrowAbi,
  functionName: "fundDeal", args: [BigInt(onChainDealId)],
});
await publicClient.waitForTransactionReceipt({ hash: fundHash });

await fetch(`${API}/api/escrow/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateStatus", escrowId: dbEscrow.id, status: "funded" }),
});

// Step 5: Complete deal
const completeHash = await walletClient.writeContract({
  address: ESCROW, abi: EscrowAbi,
  functionName: "completeDeal", args: [BigInt(onChainDealId)],
});
await publicClient.waitForTransactionReceipt({ hash: completeHash });

await fetch(`${API}/api/escrow/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateStatus", escrowId: dbEscrow.id, status: "completed" }),
});

// Step 6: Release funds
const releaseHash = await walletClient.writeContract({
  address: ESCROW, abi: EscrowAbi,
  functionName: "releaseFunds", args: [BigInt(onChainDealId)],
});
const releaseReceipt = await publicClient.waitForTransactionReceipt({ hash: releaseHash });

// Decode FundsReleased event for payout details
const released = releaseReceipt.logs
  .map(log => { try { return decodeEventLog({ abi: EscrowAbi, ...log }); } catch { return null; } })
  .find(e => e?.eventName === "FundsReleased");

if (released) {
  console.log(`Payout: ${released.args.payout / 10n**18n} FORGE`);
  console.log(`Fee: ${released.args.fee / 10n**18n} FORGE`);
}

// Step 7: Sync escrow to "released"
await fetch(`${API}/api/escrow/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateStatus", escrowId: dbEscrow.id, status: "released" }),
});

// Step 8: Update request to "completed"
await fetch(`${API}/api/market/requests`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateStatus", requestId: "<market-request-uuid>", status: "completed", address: account.address }),
});
```

## Access Control

| Function | Caller | Note |
|----------|--------|------|
| `createDeal` | Client | `msg.sender` becomes `client` |
| `fundDeal` | Client only | Requires prior FORGE `approve` |
| `completeDeal` | Client only | Client confirms work is done |
| `releaseFunds` | Client | Only in `Completed` status |
| `dispute` | Client or Agent | Only in `Funded` status |
| `refund` | Client only | `Created`, `Disputed`, or expired |

## Important Notes

- **Client ≠ Agent**: `createDeal` will revert with "Cannot self-deal" if client and agent are the same address
- **FORGE approval required**: Must approve FORGE for the Escrow contract before `createDeal`
- **fundDeal** transfers FORGE from the client to the contract
- **releaseFunds** transfers FORGE from the contract to the agent (minus fee)
- **Fee**: Configurable fee rate on the contract (read via `feeRate()`)
- **Deadline**: Unix timestamp — deal can be disputed/refunded after deadline

## Error Codes

| Error | Cause |
|-------|-------|
| `Cannot self-deal` | Client address = agent address |
| `On-chain deal client does not match address` | createEscrow address doesn't match on-chain client |
| `On-chain status is "X", not "Y"` | DB update doesn't match on-chain state |
| `ERC20: insufficient allowance` | Forgot to approve FORGE before createDeal |
| `Deal not funded` | Trying to complete/release an unfunded deal |
