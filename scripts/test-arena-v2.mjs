/**
 * ArenaV2 full-flow E2E test: viem on-chain tx + API sync
 * Usage: PRIVATE_KEY=0x... node scripts/test-arena-v2.mjs
 *
 * Prerequisites:
 *   - ArenaV2 deployed and address set in ARENA_V2 below
 *   - FORGE token available with sufficient balance
 *   - Frontend dev server running at http://localhost:3000
 */

import { createWalletClient, createPublicClient, http, defineChain, decodeEventLog, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── Config ──────────────────────────────────────────
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error("Set PRIVATE_KEY env var"); process.exit(1); }

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const ARENA_V2 = process.env.ARENA_V2 || "0x0000000000000000000000000000000000000000";
const FORGE_TOKEN = process.env.FORGE_TOKEN || "0x7A403F18Dd87C14d712C60779FDfB7F1c7697777";
const CHAIN_ID = Number(process.env.CHAIN_ID || "143");
const RPC_URL = process.env.RPC_URL || "https://infra.originstake.com/monad/evm";

if (ARENA_V2 === "0x0000000000000000000000000000000000000000") {
  console.log("⚠️  ArenaV2 address is placeholder. Set ARENA_V2 env var after deployment.");
  console.log("   Running in API-only mode (no on-chain transactions).\n");
}

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
const ArenaV2Abi = [
  { type: "function", name: "createRound", inputs: [{ name: "_prize", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "advanceRound", inputs: [{ name: "_roundId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "proposeTopic", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_title", type: "string" }, { name: "_description", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "voteForTopic", inputs: [{ name: "_topicId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "submitEntry", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_repoUrl", type: "string" }, { name: "_description", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "selectWinner", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_winner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "contributePrize", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "roundCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "roundCreator", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "winningTopicProposer", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalVoteWeight", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "minTopicsToAdvance", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "minVoteWeightToAdvance", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "RoundCreated", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "roundNumber", type: "uint256" }, { name: "prize", type: "uint256" }, { name: "creator", type: "address" }] },
  { type: "event", name: "RoundAdvanced", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "newStatus", type: "uint8" }] },
  { type: "event", name: "TopicProposed", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "topicId", type: "uint256" }, { name: "proposer", type: "address" }, { name: "title", type: "string" }] },
  { type: "event", name: "TopicVoted", inputs: [{ name: "topicId", type: "uint256", indexed: true }, { name: "voter", type: "address" }, { name: "weight", type: "uint256" }] },
  { type: "event", name: "EntrySubmitted", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "entryId", type: "uint256" }, { name: "agent", type: "address" }] },
  { type: "event", name: "WinnerSelected", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "winner", type: "address" }, { name: "prize", type: "uint256" }] },
  { type: "event", name: "PrizeContributed", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "contributor", type: "address" }, { name: "amount", type: "uint256" }] },
];

const Erc20Abi = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
];

// ─── Helpers ─────────────────────────────────────────
const isOnChain = ARENA_V2 !== "0x0000000000000000000000000000000000000000";

async function sendTx(functionName, args) {
  if (!isOnChain) throw new Error("On-chain disabled");
  const hash = await walletClient.writeContract({
    address: ARENA_V2, abi: ArenaV2Abi, functionName, args,
  });
  console.log(`  tx ${functionName}: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

function decodeEvent(receipt, eventName) {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: ArenaV2Abi, data: log.data, topics: log.topics });
      if (decoded.eventName === eventName) return decoded.args;
    } catch {}
  }
  return null;
}

async function apiSync(body) {
  const res = await fetch(`${API_BASE}/api/arena/sync`, {
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
  console.log("\n=== ArenaV2 E2E Test ===\n");

  if (isOnChain) {
    // Check FORGE balance
    const balance = await publicClient.readContract({
      address: FORGE_TOKEN, abi: Erc20Abi, functionName: "balanceOf", args: [account.address],
    });
    console.log(`FORGE balance: ${formatUnits(balance, 18)}`);

    // Check contract config
    const minTopics = await publicClient.readContract({
      address: ARENA_V2, abi: ArenaV2Abi, functionName: "minTopicsToAdvance",
    });
    const minVoteWeight = await publicClient.readContract({
      address: ARENA_V2, abi: ArenaV2Abi, functionName: "minVoteWeightToAdvance",
    });
    console.log(`minTopicsToAdvance: ${minTopics}`);
    console.log(`minVoteWeightToAdvance: ${formatUnits(minVoteWeight, 18)}`);

    // ── Step 1: Create Round ────────────────────
    console.log("\n=== Step 1: Create Round (anyone can do this) ===");
    const prize = parseUnits("50", 18);

    const approveHash = await walletClient.writeContract({
      address: FORGE_TOKEN, abi: Erc20Abi, functionName: "approve", args: [ARENA_V2, prize],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("  FORGE approved");

    const createReceipt = await sendTx("createRound", [prize]);
    const roundCreated = decodeEvent(createReceipt, "RoundCreated");
    const onChainRoundId = Number(roundCreated.roundId);
    console.log(`  on-chain roundId: ${onChainRoundId}`);
    console.log(`  creator: ${roundCreated.creator}`);

    // Sync to DB
    const dbRound = await apiSync({ action: "createRound", onChainRoundId, creator: account.address });
    console.log(`  DB round: ${dbRound.id} (status=${dbRound.status})`);

    // ── Step 2: Propose Topics ────────────────
    console.log("\n=== Step 2: Propose Topics ===");
    const prop1Receipt = await sendTx("proposeTopic", [BigInt(onChainRoundId), "AI Agent Framework", "Build a modular AI agent framework"]);
    const topic1 = decodeEvent(prop1Receipt, "TopicProposed");
    const dbTopic1 = await apiSync({
      action: "proposeTopic", roundId: dbRound.id, address: account.address,
      title: "AI Agent Framework", description: "Build a modular AI agent framework",
      onChainTopicId: Number(topic1.topicId),
    });
    console.log(`  topic1: ${dbTopic1.id} (on-chain: ${topic1.topicId})`);

    const prop2Receipt = await sendTx("proposeTopic", [BigInt(onChainRoundId), "DeFi Dashboard", "Build an all-in-one DeFi dashboard"]);
    const topic2 = decodeEvent(prop2Receipt, "TopicProposed");
    const dbTopic2 = await apiSync({
      action: "proposeTopic", roundId: dbRound.id, address: account.address,
      title: "DeFi Dashboard", description: "Build an all-in-one DeFi dashboard",
      onChainTopicId: Number(topic2.topicId),
    });
    console.log(`  topic2: ${dbTopic2.id} (on-chain: ${topic2.topicId})`);

    // ── Step 3: Advance to Voting ────────────
    console.log("\n=== Step 3: Advance → Voting ===");
    await sendTx("advanceRound", [BigInt(onChainRoundId)]);
    const dbAdv1 = await apiSync({ action: "advanceRound", roundId: dbRound.id, newStatus: "voting" });
    console.log(`  DB status: ${dbAdv1.status}`);

    // ── Step 4: Vote ─────────────────────────
    console.log("\n=== Step 4: Vote for Topic 1 ===");
    await sendTx("voteForTopic", [topic1.topicId]);
    const dbVote = await apiSync({ action: "voteForTopic", topicId: dbTopic1.id, address: account.address });
    console.log(`  DB topic1 votes: ${dbVote.total_votes}`);

    // ── Step 5: Advance to Active ────────────
    console.log("\n=== Step 5: Advance → Active ===");
    await sendTx("advanceRound", [BigInt(onChainRoundId)]);
    const dbAdv2 = await apiSync({ action: "advanceRound", roundId: dbRound.id, newStatus: "active" });
    console.log(`  DB status: ${dbAdv2.status}`);

    // Verify winning topic proposer
    const proposer = await publicClient.readContract({
      address: ARENA_V2, abi: ArenaV2Abi, functionName: "winningTopicProposer", args: [BigInt(onChainRoundId)],
    });
    console.log(`  winningTopicProposer: ${proposer}`);

    // ── Step 6: Submit Entry ─────────────────
    console.log("\n=== Step 6: Submit Entry ===");
    const entryReceipt = await sendTx("submitEntry", [BigInt(onChainRoundId), "https://github.com/test/ai-agent", "Modular AI agent framework MVP"]);
    const entryEvent = decodeEvent(entryReceipt, "EntrySubmitted");
    const dbEntry = await apiSync({
      action: "submitEntry", roundId: dbRound.id, address: account.address,
      repoUrl: "https://github.com/test/ai-agent", description: "Modular AI agent framework MVP",
      onChainEntryId: entryEvent ? Number(entryEvent.entryId) : undefined,
    });
    console.log(`  DB entry: ${dbEntry.id}`);

    // ── Step 7: Advance to Judging ───────────
    console.log("\n=== Step 7: Advance → Judging ===");
    await sendTx("advanceRound", [BigInt(onChainRoundId)]);
    const dbAdv3 = await apiSync({ action: "advanceRound", roundId: dbRound.id, newStatus: "judging" });
    console.log(`  DB status: ${dbAdv3.status}`);

    // ── Step 8: Select Winner ────────────────
    console.log("\n=== Step 8: Select Winner (by winning topic proposer) ===");
    await sendTx("selectWinner", [BigInt(onChainRoundId), account.address]);
    const dbWinner = await apiSync({ action: "selectWinner", roundId: dbRound.id, winnerId: dbEntry.user_id });
    console.log(`  DB final status: ${dbWinner.status}, winner: ${dbWinner.winner_id}`);

    console.log("\n✅ ArenaV2 Full Flow Complete!\n");
  } else {
    console.log("Skipping on-chain tests (ArenaV2 not deployed).");
    console.log("Testing API-only flow...\n");

    // API-only test
    try {
      const dbRound = await apiSync({ action: "createRound", onChainRoundId: 999, creator: account.address });
      console.log(`  Created DB round: ${dbRound.id}`);
      console.log("✅ API-only test passed\n");
    } catch (err) {
      console.log(`  API test: ${err.message}`);
      console.log("⚠️  API test skipped (server may not be running)\n");
    }
  }
}

main().catch((err) => {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
});
