/**
 * Direct Deal + Escrow flow E2E test
 * Usage: node scripts/test-direct-deal.mjs
 *
 * Prerequisites:
 *   - Frontend dev server running at http://localhost:3000
 *   - DB migration applied (direct_requests table exists)
 */

const API_BASE = process.env.API_BASE || "http://localhost:3000";

const CLIENT_ADDRESS = process.env.CLIENT_ADDRESS || "0xTestClient0000000000000000000000000001";
const AGENT_ADDRESS = process.env.AGENT_ADDRESS || "0xTestAgent00000000000000000000000000002";

async function apiCall(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("\n=== Direct Deal E2E Test ===\n");
  console.log(`Client: ${CLIENT_ADDRESS}`);
  console.log(`Agent:  ${AGENT_ADDRESS}\n`);

  // ── Step 1: Create Direct Deal Request ────────
  console.log("=== Step 1: Create Direct Deal ===");
  const deal = await apiCall("/api/market/direct", {
    action: "create",
    clientAddress: CLIENT_ADDRESS,
    agentAddress: AGENT_ADDRESS,
    amount: 500,
    description: "Build a custom smart contract for token vesting",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  console.log(`  Deal created: ${deal.id} (status: ${deal.status})`);
  console.log(`  Amount: ${deal.amount} FORGE`);

  // ── Step 2: Query deals by agent ──────────────
  console.log("\n=== Step 2: Query Deals by Agent ===");
  const agentDeals = await apiGet(`/api/market/direct?agent=${AGENT_ADDRESS}`);
  console.log(`  Agent has ${agentDeals.length} deal(s)`);

  // ── Step 3: Query deals by client ─────────────
  console.log("\n=== Step 3: Query Deals by Client ===");
  const clientDeals = await apiGet(`/api/market/direct?client=${CLIENT_ADDRESS}`);
  console.log(`  Client has ${clientDeals.length} deal(s)`);

  // ── Step 4: Agent accepts the deal ────────────
  console.log("\n=== Step 4: Agent Accepts ===");
  const accepted = await apiCall("/api/market/direct", {
    action: "accept",
    requestId: deal.id,
    address: AGENT_ADDRESS,
  });
  console.log(`  Deal status: ${accepted.status}`);

  // ── Step 5: Sync escrow info ──────────────────
  console.log("\n=== Step 5: Sync Escrow ===");
  const synced = await apiCall("/api/market/direct", {
    action: "syncEscrow",
    requestId: deal.id,
    escrowId: "test-escrow-123",
    status: "escrow_created",
  });
  console.log(`  Deal status: ${synced.status}, escrow: ${synced.escrow_id}`);

  // ── Step 6: Query all deals by address ────────
  console.log("\n=== Step 6: Query All Deals ===");
  const allDeals = await apiGet(`/api/market/direct?address=${CLIENT_ADDRESS}`);
  console.log(`  Total deals involving client: ${allDeals.length}`);

  // ── Step 7: Test rejection flow ───────────────
  console.log("\n=== Step 7: Test Rejection Flow ===");
  const deal2 = await apiCall("/api/market/direct", {
    action: "create",
    clientAddress: CLIENT_ADDRESS,
    agentAddress: "0xTestAgent00000000000000000000000000003",
    amount: 200,
    description: "Quick audit review",
  });
  console.log(`  Deal2 created: ${deal2.id}`);

  const rejected = await apiCall("/api/market/direct", {
    action: "reject",
    requestId: deal2.id,
    address: "0xTestAgent00000000000000000000000000003",
  });
  console.log(`  Deal2 status: ${rejected.status}`);

  console.log("\n✅ Direct Deal Flow Complete!\n");
}

main().catch((err) => {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
});
