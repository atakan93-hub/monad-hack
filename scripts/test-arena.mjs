/**
 * Arena full-flow test: viem on-chain tx + API sync
 * Usage: node scripts/test-arena.mjs
 */

import { createWalletClient, createPublicClient, http, defineChain, decodeEventLog, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── Config ──────────────────────────────────────────
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error("Set PRIVATE_KEY env var"); process.exit(1); }
const API_BASE = "http://localhost:3000";
const ARENA = "0x1E038655317BF6a4e6A052A91444ca48d25b540f";
const FORGE_TOKEN = "0x0bA5E04470Fe327AC191179Cf6823E667B007777";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Admin:", account.address);

const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

// ─── ABIs (minimal) ─────────────────────────────────
const ArenaAbi = [
  { type: "function", name: "createRound", inputs: [{ name: "_prize", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "advanceRound", inputs: [{ name: "_roundId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "proposeTopic", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_title", type: "string" }, { name: "_description", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "voteForTopic", inputs: [{ name: "_topicId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "submitEntry", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_repoUrl", type: "string" }, { name: "_description", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "selectWinner", inputs: [{ name: "_roundId", type: "uint256" }, { name: "_winner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "roundCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "rounds", inputs: [{ type: "uint256" }], outputs: [{ name: "roundNumber", type: "uint256" }, { name: "prize", type: "uint256" }, { name: "winner", type: "address" }, { name: "status", type: "uint8" }, { name: "selectedTopicId", type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "RoundCreated", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "roundNumber", type: "uint256" }, { name: "prize", type: "uint256" }] },
  { type: "event", name: "TopicProposed", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "topicId", type: "uint256" }, { name: "proposer", type: "address" }, { name: "title", type: "string" }] },
  { type: "event", name: "RoundAdvanced", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "newStatus", type: "uint8" }] },
  { type: "event", name: "EntrySubmitted", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "entryId", type: "uint256" }, { name: "agent", type: "address" }] },
  { type: "event", name: "WinnerSelected", inputs: [{ name: "roundId", type: "uint256", indexed: true }, { name: "winner", type: "address" }, { name: "prize", type: "uint256" }] },
];

const Erc20Abi = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
];

// ─── Helpers ─────────────────────────────────────────
async function sendTx(functionName, args) {
  const hash = await walletClient.writeContract({
    address: ARENA, abi: ArenaAbi, functionName, args,
  });
  console.log(`  tx ${functionName}: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

function decodeEvent(receipt, eventName) {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: ArenaAbi, data: log.data, topics: log.topics });
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
  const statusNames = { 0: "Proposing", 1: "Voting", 2: "Building", 3: "Judging", 4: "Completed" };

  // Check FORGE balance
  const balance = await publicClient.readContract({
    address: FORGE_TOKEN, abi: Erc20Abi, functionName: "balanceOf", args: [account.address],
  });
  console.log(`FORGE balance: ${balance / 10n**18n}`);

  // ── A2: Approve + Create Round ────────────────────
  console.log("\n=== A2: Create Round ===");
  const prize = parseUnits("100", 18);

  // Approve first
  const approveHash = await walletClient.writeContract({
    address: FORGE_TOKEN, abi: Erc20Abi, functionName: "approve", args: [ARENA, prize],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log("  FORGE approved");

  const createReceipt = await sendTx("createRound", [prize]);
  const roundCreated = decodeEvent(createReceipt, "RoundCreated");
  const onChainRoundId = Number(roundCreated.roundId);
  console.log(`  on-chain roundId: ${onChainRoundId}`);

  // Sync to DB
  const dbRound = await apiSync({ action: "createRound", onChainRoundId });
  const dbRoundId = dbRound.id;
  console.log(`  DB round: ${dbRoundId} (status=${dbRound.status})`);

  // ── A3: Propose Topics ────────────────────────────
  console.log("\n=== A3: Propose Topics ===");
  const propReceipt1 = await sendTx("proposeTopic", [BigInt(onChainRoundId), "DeFi Aggregator", "Build a cross-DEX aggregator"]);
  const topic1 = decodeEvent(propReceipt1, "TopicProposed");
  console.log(`  topic1 on-chain id: ${topic1.topicId}`);

  const dbTopic1 = await apiSync({
    action: "proposeTopic", roundId: dbRoundId, address: account.address,
    title: "DeFi Aggregator", description: "Build a cross-DEX aggregator",
    onChainTopicId: Number(topic1.topicId),
  });
  console.log(`  DB topic1: ${dbTopic1.id}`);

  const propReceipt2 = await sendTx("proposeTopic", [BigInt(onChainRoundId), "NFT Marketplace", "Build an NFT marketplace"]);
  const topic2 = decodeEvent(propReceipt2, "TopicProposed");
  console.log(`  topic2 on-chain id: ${topic2.topicId}`);

  const dbTopic2 = await apiSync({
    action: "proposeTopic", roundId: dbRoundId, address: account.address,
    title: "NFT Marketplace", description: "Build an NFT marketplace",
    onChainTopicId: Number(topic2.topicId),
  });
  console.log(`  DB topic2: ${dbTopic2.id}`);

  // ── A4: Advance to Voting ─────────────────────────
  console.log("\n=== A4: Advance → Voting ===");
  await sendTx("advanceRound", [BigInt(onChainRoundId)]);
  const dbAdvance1 = await apiSync({ action: "advanceRound", roundId: dbRoundId, newStatus: "voting" });
  console.log(`  DB status: ${dbAdvance1.status}`);

  // ── A5: Vote ──────────────────────────────────────
  console.log("\n=== A5: Vote for Topic 1 ===");
  await sendTx("voteForTopic", [topic1.topicId]);
  const dbVote = await apiSync({ action: "voteForTopic", topicId: dbTopic1.id, address: account.address });
  console.log(`  DB topic1 votes: ${dbVote.total_votes}`);

  // ── A6: Advance to Active ─────────────────────────
  console.log("\n=== A6: Advance → Active ===");
  await sendTx("advanceRound", [BigInt(onChainRoundId)]);
  const dbAdvance2 = await apiSync({ action: "advanceRound", roundId: dbRoundId, newStatus: "active" });
  console.log(`  DB status: ${dbAdvance2.status}`);

  // ── A7: Submit Entry ──────────────────────────────
  console.log("\n=== A7: Submit Entry ===");
  const entryReceipt = await sendTx("submitEntry", [BigInt(onChainRoundId), "https://github.com/test/defi-agg", "Cross-DEX aggregator MVP"]);
  const entryEvent = decodeEvent(entryReceipt, "EntrySubmitted");
  console.log(`  entry on-chain id: ${entryEvent?.entryId}`);

  const dbEntry = await apiSync({
    action: "submitEntry", roundId: dbRoundId, address: account.address,
    repoUrl: "https://github.com/test/defi-agg", description: "Cross-DEX aggregator MVP",
    onChainEntryId: entryEvent ? Number(entryEvent.entryId) : undefined,
  });
  console.log(`  DB entry: ${dbEntry.id}`);

  // ── A8: Advance to Judging ──────────────────────────
  console.log("\n=== A8: Advance → Judging ===");
  await sendTx("advanceRound", [BigInt(onChainRoundId)]);
  const dbAdvance3 = await apiSync({ action: "advanceRound", roundId: dbRoundId, newStatus: "active" });
  console.log(`  DB status: ${dbAdvance3.status}`);

  // ── A9: Select Winner ─────────────────────────────
  console.log("\n=== A9: Select Winner ===");
  await sendTx("selectWinner", [BigInt(onChainRoundId), account.address]);

  // Need the DB user ID for the winner
  const dbWinner = await apiSync({ action: "selectWinner", roundId: dbRoundId, winnerId: dbEntry.user_id });
  console.log(`  DB final status: ${dbWinner.status}, winner: ${dbWinner.winner_id}`);

  console.log("\n=== Arena Flow Complete! ===\n");
}

main().catch((err) => {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
});
