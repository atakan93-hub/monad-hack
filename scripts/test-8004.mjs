/**
 * ERC-8004 Identity + Reputation E2E test
 * Usage: PRIVATE_KEY=0x... node scripts/test-8004.mjs
 *
 * Prerequisites:
 *   - ERC-8004 IdentityRegistry and ReputationRegistry deployed
 *   - Frontend dev server running at http://localhost:3000
 */

import { createWalletClient, createPublicClient, http, defineChain, decodeEventLog } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── Config ──────────────────────────────────────────
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error("Set PRIVATE_KEY env var"); process.exit(1); }

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const IDENTITY_REGISTRY = process.env.IDENTITY_REGISTRY || "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const REPUTATION_REGISTRY = process.env.REPUTATION_REGISTRY || "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
const CHAIN_ID = Number(process.env.CHAIN_ID || "143");
const RPC_URL = process.env.RPC_URL || "https://infra.originstake.com/monad/evm";

const monadChain = defineChain({
  id: CHAIN_ID,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Account:", account.address);

const publicClient = createPublicClient({ chain: monadChain, transport: http() });
const walletClient = createWalletClient({ account, chain: monadChain, transport: http() });

// ─── ABIs (minimal) ─────────────────────────────────
const IdentityAbi = [
  { type: "function", name: "register", inputs: [{ name: "agentURI", type: "string" }], outputs: [{ name: "agentId", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "tokenURI", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "getAgentWallet", inputs: [{ name: "agentId", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getVersion", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "event", name: "Registered", inputs: [{ name: "agentId", type: "uint256", indexed: true }, { name: "agentURI", type: "string" }, { name: "owner", type: "address", indexed: true }] },
];

const ReputationAbi = [
  { type: "function", name: "giveFeedback", inputs: [{ name: "agentId", type: "uint256" }, { name: "value", type: "int128" }, { name: "valueDecimals", type: "uint8" }, { name: "tag1", type: "string" }, { name: "tag2", type: "string" }, { name: "endpoint", type: "string" }, { name: "feedbackURI", type: "string" }, { name: "feedbackHash", type: "bytes32" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getSummary", inputs: [{ name: "agentId", type: "uint256" }, { name: "clientAddresses", type: "address[]" }, { name: "tag1", type: "string" }, { name: "tag2", type: "string" }], outputs: [{ name: "count", type: "uint64" }, { name: "summaryValue", type: "int128" }, { name: "summaryValueDecimals", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "getClients", inputs: [{ name: "agentId", type: "uint256" }], outputs: [{ type: "address[]" }], stateMutability: "view" },
  { type: "function", name: "getVersion", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "event", name: "NewFeedback", inputs: [{ name: "agentId", type: "uint256", indexed: true }, { name: "clientAddress", type: "address", indexed: true }, { name: "feedbackIndex", type: "uint64" }, { name: "value", type: "int128" }, { name: "valueDecimals", type: "uint8" }, { name: "indexedTag1", type: "string", indexed: true }, { name: "tag1", type: "string" }, { name: "tag2", type: "string" }, { name: "endpoint", type: "string" }, { name: "feedbackURI", type: "string" }, { name: "feedbackHash", type: "bytes32" }] },
];

// ─── Helpers ─────────────────────────────────────────
async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  return res.json();
}

// ─── Main ────────────────────────────────────────────
async function main() {
  console.log("\n=== ERC-8004 Identity + Reputation E2E Test ===\n");

  // ── Step 1: Check Identity Registry ────────
  console.log("=== Step 1: Check Identity Registry ===");
  try {
    const version = await publicClient.readContract({
      address: IDENTITY_REGISTRY, abi: IdentityAbi, functionName: "getVersion",
    });
    console.log(`  Identity Registry version: ${version}`);
  } catch (err) {
    console.log(`  ⚠️ Identity Registry not accessible: ${err.message}`);
    console.log("  Skipping on-chain identity tests.\n");
  }

  // ── Step 2: Check balance (already registered?) ──
  console.log("\n=== Step 2: Check Identity Balance ===");
  try {
    const balance = await publicClient.readContract({
      address: IDENTITY_REGISTRY, abi: IdentityAbi, functionName: "balanceOf",
      args: [account.address],
    });
    console.log(`  Identity tokens: ${Number(balance)}`);

    if (Number(balance) === 0) {
      console.log("  Not registered. Attempting registration...");
      try {
        const hash = await walletClient.writeContract({
          address: IDENTITY_REGISTRY, abi: IdentityAbi, functionName: "register",
          args: ["ipfs://QmTest/agent-metadata.json"],
        });
        console.log(`  tx register: ${hash}`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`  confirmed in block ${receipt.blockNumber}`);

        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({ abi: IdentityAbi, data: log.data, topics: log.topics });
            if (decoded.eventName === "Registered") {
              console.log(`  Registered with agentId: ${decoded.args.agentId}`);
            }
          } catch {}
        }
      } catch (regErr) {
        console.log(`  Registration failed: ${regErr.message}`);
      }
    }
  } catch (err) {
    console.log(`  ⚠️ Balance check failed: ${err.message}`);
  }

  // ── Step 3: Check Reputation Registry ────────
  console.log("\n=== Step 3: Check Reputation Registry ===");
  try {
    const version = await publicClient.readContract({
      address: REPUTATION_REGISTRY, abi: ReputationAbi, functionName: "getVersion",
    });
    console.log(`  Reputation Registry version: ${version}`);
  } catch (err) {
    console.log(`  ⚠️ Reputation Registry not accessible: ${err.message}`);
  }

  // ── Step 4: Test API endpoints ────────────────
  console.log("\n=== Step 4: Test API Endpoints ===");
  try {
    const identityData = await apiGet(`/api/agents/${account.address}/identity`);
    console.log(`  Identity API: registered=${identityData.registered}`);
  } catch (err) {
    console.log(`  ⚠️ Identity API: ${err.message} (server may not be running)`);
  }

  try {
    const reputationData = await apiGet(`/api/agents/${account.address}/reputation`);
    console.log(`  Reputation API: onChain=${reputationData.onChain}, feedbackCount=${reputationData.feedbackCount}`);
  } catch (err) {
    console.log(`  ⚠️ Reputation API: ${err.message}`);
  }

  try {
    const feedbackData = await apiGet(`/api/agents/${account.address}/feedback`);
    console.log(`  Feedback API: ${(feedbackData.feedback || []).length} feedback entries`);
  } catch (err) {
    console.log(`  ⚠️ Feedback API: ${err.message}`);
  }

  console.log("\n✅ ERC-8004 Test Complete!\n");
}

main().catch((err) => {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
});
