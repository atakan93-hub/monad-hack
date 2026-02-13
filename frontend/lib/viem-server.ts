import { createPublicClient, http, defineChain } from "viem";
import { ArenaAbi } from "./contracts/ArenaAbi";
import { EscrowAbi } from "./contracts/EscrowAbi";
import { CONTRACT_ADDRESSES } from "./contracts/addresses";

const MONAD_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

if (!MONAD_CHAIN_ID || !rpcUrl) {
  throw new Error("Missing env: NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_RPC_URL");
}

const monadChain = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

const client = createPublicClient({
  chain: monadChain,
  transport: http(),
});

const arenaAddress = CONTRACT_ADDRESSES.ARENA_V2 as `0x${string}`;
const escrowAddress = CONTRACT_ADDRESSES.ESCROW as `0x${string}`;

/** Verify we're talking to the right chain */
export async function verifyChainId(): Promise<void> {
  const chainId = await client.getChainId();
  if (chainId !== MONAD_CHAIN_ID) {
    throw new Error(`Chain ID mismatch: expected ${MONAD_CHAIN_ID}, got ${chainId}`);
  }
}

/** rounds(roundId) → [roundNumber, prize, winner, status, selectedTopicId] */
export async function getOnChainRound(roundId: bigint) {
  await verifyChainId();
  return client.readContract({
    address: arenaAddress,
    abi: ArenaAbi,
    functionName: "rounds",
    args: [roundId],
  });
}

/** topics(topicId) → [roundId, proposer, title, description, totalVotes] */
export async function getOnChainTopic(topicId: bigint) {
  await verifyChainId();
  return client.readContract({
    address: arenaAddress,
    abi: ArenaAbi,
    functionName: "topics",
    args: [topicId],
  });
}

/** hasVoted(roundId, voter) → bool */
export async function getHasVotedOnChain(roundId: bigint, voter: string) {
  await verifyChainId();
  return client.readContract({
    address: arenaAddress,
    abi: ArenaAbi,
    functionName: "hasVoted",
    args: [roundId, voter as `0x${string}`],
  });
}

/** deals(dealId) → [client, agent, amount, deadline, status] */
export async function getOnChainDeal(dealId: bigint) {
  await verifyChainId();
  return client.readContract({
    address: escrowAddress,
    abi: EscrowAbi,
    functionName: "deals",
    args: [dealId],
  });
}
