import { createPublicClient, http, defineChain } from "viem";
import { ArenaAbi } from "./contracts/ArenaAbi";
import { CONTRACT_ADDRESSES } from "./contracts/addresses";

const MONAD_CHAIN_ID = 10143;

const monadTestnet = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const arenaAddress = CONTRACT_ADDRESSES.ARENA as `0x${string}`;

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
