/**
 * Market full-flow test: API + Escrow on-chain tx + sync
 * Usage: node scripts/test-market.mjs
 */

import { createWalletClient, createPublicClient, http, defineChain, decodeEventLog, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── Config ──────────────────────────────────────────
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error("Set PRIVATE_KEY env var"); process.exit(1); }
const API_BASE = "http://localhost:3000";
const ESCROW = "0x8C685bAC61A379210322AACaE36ad3D77b9b4a35";
const FORGE_TOKEN = "0x0bA5E04470Fe327AC191179Cf6823E667B007777";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const account = privateKeyToAccount(PRIVATE_KEY);
// Agent address (different from client to avoid "Cannot self-deal")
const AGENT_ADDRESS = "0x000000000000000000000000000000000000dEaD";
console.log("Client:", account.address);
console.log("Agent:", AGENT_ADDRESS);

const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

// ─── ABIs (minimal) ─────────────────────────────────
const EscrowAbi = [
  { type: "function", name: "createDeal", inputs: [{ name: "_agent", type: "address" }, { name: "_amount", type: "uint256" }, { name: "_deadline", type: "uint256" }], outputs: [{ name: "dealId", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "fundDeal", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "completeDeal", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "releaseFunds", inputs: [{ name: "_dealId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "deals", inputs: [{ type: "uint256" }], outputs: [{ name: "client", type: "address" }, { name: "agent", type: "address" }, { name: "amount", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "status", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "dealCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "DealCreated", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "client", type: "address" }, { name: "agent", type: "address" }, { name: "amount", type: "uint256" }, { name: "deadline", type: "uint256" }] },
  { type: "event", name: "DealFunded", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "DealCompleted", inputs: [{ name: "dealId", type: "uint256", indexed: true }] },
  { type: "event", name: "FundsReleased", inputs: [{ name: "dealId", type: "uint256", indexed: true }, { name: "agent", type: "address" }, { name: "payout", type: "uint256" }, { name: "fee", type: "uint256" }] },
];

const Erc20Abi = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
];

// ─── Helpers ─────────────────────────────────────────
async function sendTx(address, abi, functionName, args) {
  const hash = await walletClient.writeContract({ address, abi, functionName, args });
  console.log(`  tx ${functionName}: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

function decodeEvent(receipt, abi, eventName) {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics });
      if (decoded.eventName === eventName) return decoded.args;
    } catch {}
  }
  return null;
}

async function api(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ─── Main ────────────────────────────────────────────
async function main() {
  const balance = await publicClient.readContract({
    address: FORGE_TOKEN, abi: Erc20Abi, functionName: "balanceOf", args: [account.address],
  });
  console.log(`FORGE balance: ${balance / 10n**18n}`);

  // ── M1: Create Task Request (API only) ─────────────
  console.log("\n=== M1: Create Task Request ===");
  const dbRequest = await api("/api/market/requests", {
    title: "Build a DEX aggregator",
    description: "Need a cross-DEX swap aggregator on Monad",
    category: "smart-contract",
    budget: 500,
    deadline: "2026-03-01",
    address: account.address,
  });
  const userId = dbRequest.requester_id;
  console.log(`  DB request: ${dbRequest.id} (status=${dbRequest.status})`);
  console.log(`  userId: ${userId}`);

  // ── M2: Submit Proposal (API only) ─────────────────
  console.log("\n=== M2: Submit Proposal ===");

  const dbProposal = await api("/api/market/proposals", {
    action: "submit",
    requestId: dbRequest.id,
    userId,
    price: 450,
    estimatedDays: 14,
    message: "I can build this with optimal routing across major Monad DEXes",
  });
  console.log(`  DB proposal: ${dbProposal.id} (status=${dbProposal.status})`);

  // ── M3: Accept Proposal → Update status ────────────
  console.log("\n=== M3: Accept Proposal ===");
  const dbAccepted = await api("/api/market/proposals", {
    action: "updateStatus",
    proposalId: dbProposal.id,
    status: "accepted",
  });
  console.log(`  proposal status: ${dbAccepted.status}`);

  // ── M4: Create Escrow On-Chain ─────────────────────
  console.log("\n=== M4: Create Escrow On-Chain ===");
  const dealAmount = parseUnits("450", 18);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600); // 30 days

  // Approve FORGE for Escrow
  const approveHash = await walletClient.writeContract({
    address: FORGE_TOKEN, abi: Erc20Abi, functionName: "approve", args: [ESCROW, dealAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log("  FORGE approved for Escrow");

  // createDeal — client=admin, agent=dead address (all actions are client-only)
  const createReceipt = await sendTx(ESCROW, EscrowAbi, "createDeal", [AGENT_ADDRESS, dealAmount, deadline]);
  const dealCreated = decodeEvent(createReceipt, EscrowAbi, "DealCreated");
  const onChainDealId = Number(dealCreated.dealId);
  console.log(`  on-chain dealId: ${onChainDealId}`);

  // Sync to DB
  const dbEscrow = await api("/api/escrow/sync", {
    action: "createEscrow",
    requestId: dbRequest.id,
    address: account.address,
    userId,
    amount: 450,
    onChainDealId,
  });
  console.log(`  DB escrow: ${dbEscrow.id} (status=${dbEscrow.status})`);

  // ── M5: Fund Deal On-Chain ─────────────────────────
  console.log("\n=== M5: Fund Deal ===");
  await sendTx(ESCROW, EscrowAbi, "fundDeal", [BigInt(onChainDealId)]);

  const dbFunded = await api("/api/escrow/sync", {
    action: "updateStatus",
    escrowId: dbEscrow.id,
    status: "funded",
  });
  console.log(`  DB escrow status: ${dbFunded.status}`);

  // ── M6: Complete Deal On-Chain ─────────────────────
  console.log("\n=== M6: Complete Deal ===");
  await sendTx(ESCROW, EscrowAbi, "completeDeal", [BigInt(onChainDealId)]);

  const dbCompleted = await api("/api/escrow/sync", {
    action: "updateStatus",
    escrowId: dbEscrow.id,
    status: "completed",
  });
  console.log(`  DB escrow status: ${dbCompleted.status}`);

  // ── M7: Release Funds On-Chain ─────────────────────
  console.log("\n=== M7: Release Funds ===");
  const releaseReceipt = await sendTx(ESCROW, EscrowAbi, "releaseFunds", [BigInt(onChainDealId)]);
  const released = decodeEvent(releaseReceipt, EscrowAbi, "FundsReleased");
  if (released) {
    console.log(`  payout: ${released.payout / 10n**18n} FORGE, fee: ${released.fee / 10n**18n} FORGE`);
  }

  console.log("\n=== Market Flow Complete! ===\n");
}

main().catch((err) => {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
});
