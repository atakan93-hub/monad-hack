"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import type { TransactionReceipt } from "viem";
import { ArenaV2Abi } from "@/lib/contracts/ArenaV2Abi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const arenaV2Config = {
  address: CONTRACT_ADDRESSES.ARENA_V2,
  abi: ArenaV2Abi,
} as const;

/** Shared base for all arena V2 write hooks: sign → wait → assert success */
function useArenaV2Write() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  const sendAndWait = async (functionName: string, args: unknown[]) => {
    const h = await writeContractAsync({ ...arenaV2Config, functionName, args } as Parameters<typeof writeContractAsync>[0]);
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: h });
    if (receipt.status === "reverted") throw new Error(`Transaction reverted: ${functionName}`);
    return receipt as TransactionReceipt;
  };

  return { sendAndWait, hash, isPending, isConfirming, isSuccess, error };
}

// === Write Hooks (Anyone) ===

export function useCreateRoundV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (prize: bigint) => sendAndWait("createRound", [prize]);
  return { writeAsync, ...rest };
}

export function useAdvanceRoundV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (roundId: bigint) => sendAndWait("advanceRound", [roundId]);
  return { writeAsync, ...rest };
}

export function useSelectWinnerV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (roundId: bigint, winner: `0x${string}`) => sendAndWait("selectWinner", [roundId, winner]);
  return { writeAsync, ...rest };
}

export function useProposeTopicV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (roundId: bigint, title: string, description: string) =>
    sendAndWait("proposeTopic", [roundId, title, description]);
  return { writeAsync, ...rest };
}

export function useVoteForTopicV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (topicId: bigint) => sendAndWait("voteForTopic", [topicId]);
  return { writeAsync, ...rest };
}

export function useSubmitEntryV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (roundId: bigint, repoUrl: string, description: string) =>
    sendAndWait("submitEntry", [roundId, repoUrl, description]);
  return { writeAsync, ...rest };
}

export function useContributePrizeV2() {
  const { sendAndWait, ...rest } = useArenaV2Write();
  const writeAsync = (roundId: bigint, amount: bigint) => sendAndWait("contributePrize", [roundId, amount]);
  return { writeAsync, ...rest };
}

// === Read Hooks ===

export function useRoundCreator(roundId: bigint) {
  return useReadContract({
    ...arenaV2Config,
    functionName: "roundCreator",
    args: [roundId],
  });
}

export function useWinningTopicProposer(roundId: bigint) {
  return useReadContract({
    ...arenaV2Config,
    functionName: "winningTopicProposer",
    args: [roundId],
  });
}

export function useTotalVoteWeight(roundId: bigint) {
  return useReadContract({
    ...arenaV2Config,
    functionName: "totalVoteWeight",
    args: [roundId],
  });
}

export function useMinTopicsToAdvance() {
  return useReadContract({
    ...arenaV2Config,
    functionName: "minTopicsToAdvance",
  });
}

export function useMinVoteWeightToAdvance() {
  return useReadContract({
    ...arenaV2Config,
    functionName: "minVoteWeightToAdvance",
  });
}

export function useHasVotedV2(roundId: bigint) {
  const { address } = useAccount();
  return useReadContract({
    ...arenaV2Config,
    functionName: "hasVoted",
    args: address ? [roundId, address] : undefined,
    query: { enabled: !!address },
  });
}
