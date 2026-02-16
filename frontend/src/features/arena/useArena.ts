"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import type { TransactionReceipt } from "viem";
import { ArenaAbi } from "@/lib/contracts/ArenaAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const arenaConfig = {
  address: CONTRACT_ADDRESSES.ARENA_V2,
  abi: ArenaAbi,
} as const;

/** Shared base for all arena write hooks: sign → wait → assert success */
function useArenaWrite() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  const sendAndWait = async (functionName: string, args: unknown[]) => {
    const h = await writeContractAsync({ ...arenaConfig, functionName, args } as Parameters<typeof writeContractAsync>[0]);
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: h });
    if (receipt.status === "reverted") throw new Error(`Transaction reverted: ${functionName}`);
    return receipt as TransactionReceipt;
  };

  return { sendAndWait, hash, isPending, isConfirming, isSuccess, error };
}

// === Admin ===

export function useCreateRound() {
  const { sendAndWait, ...rest } = useArenaWrite();
  const writeAsync = (prize: bigint) => sendAndWait("createRound", [prize]);
  return { writeAsync, ...rest };
}

export function useAdvanceRound() {
  const { sendAndWait, ...rest } = useArenaWrite();
  const writeAsync = (roundId: bigint) => sendAndWait("advanceRound", [roundId]);
  return { writeAsync, ...rest };
}

export function useSelectWinner() {
  const { sendAndWait, ...rest } = useArenaWrite();
  const writeAsync = (roundId: bigint, winner: `0x${string}`) => sendAndWait("selectWinner", [roundId, winner]);
  return { writeAsync, ...rest };
}

// === User ===

export function useProposeTopic() {
  const { sendAndWait, ...rest } = useArenaWrite();
  const writeAsync = (roundId: bigint, title: string, description: string) =>
    sendAndWait("proposeTopic", [roundId, title, description]);
  return { writeAsync, ...rest };
}

export function useVoteForTopic() {
  const { sendAndWait, ...rest } = useArenaWrite();
  const writeAsync = (topicId: bigint) => sendAndWait("voteForTopic", [topicId]);
  return { writeAsync, ...rest };
}

export function useSubmitEntry() {
  const { sendAndWait, ...rest } = useArenaWrite();
  const writeAsync = (roundId: bigint, repoUrl: string, description: string) =>
    sendAndWait("submitEntry", [roundId, repoUrl, description]);
  return { writeAsync, ...rest };
}

// === Read ===

export function useWinningTopicProposer(roundId: bigint | undefined) {
  return useReadContract({
    ...arenaConfig,
    functionName: "winningTopicProposer",
    args: roundId != null ? [roundId] : undefined,
    query: { enabled: roundId != null },
  });
}

export function useHasVoted(roundId: bigint) {
  const { address } = useAccount();
  return useReadContract({
    ...arenaConfig,
    functionName: "hasVoted",
    args: address ? [roundId, address] : undefined,
    query: { enabled: !!address },
  });
}
