"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ArenaAbi } from "@/lib/contracts/ArenaAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const arenaConfig = {
  address: CONTRACT_ADDRESSES.ARENA,
  abi: ArenaAbi,
} as const;

// === Admin ===

export function useCreateRound() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (prize: bigint) =>
    writeContract({ ...arenaConfig, functionName: "createRound", args: [prize] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useAdvanceRound() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (roundId: bigint) =>
    writeContract({ ...arenaConfig, functionName: "advanceRound", args: [roundId] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useSelectWinner() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (roundId: bigint, winner: `0x${string}`) =>
    writeContract({ ...arenaConfig, functionName: "selectWinner", args: [roundId, winner] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

// === User ===

export function useProposeTopic() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (roundId: bigint, title: string, description: string) =>
    writeContract({ ...arenaConfig, functionName: "proposeTopic", args: [roundId, title, description] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useVoteForTopic() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (topicId: bigint) =>
    writeContract({ ...arenaConfig, functionName: "voteForTopic", args: [topicId] });

  const writeAsync = (topicId: bigint) =>
    writeContractAsync({ ...arenaConfig, functionName: "voteForTopic", args: [topicId] });

  return { write, writeAsync, hash, isPending, isConfirming, isSuccess, error };
}

export function useSubmitEntry() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (roundId: bigint, repoUrl: string, description: string) =>
    writeContract({ ...arenaConfig, functionName: "submitEntry", args: [roundId, repoUrl, description] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

// === Read ===

export function useGetRound(roundId: bigint) {
  return useReadContract({
    ...arenaConfig,
    functionName: "rounds",
    args: [roundId],
  });
}

export function useGetRoundTopics(roundId: bigint) {
  return useReadContract({
    ...arenaConfig,
    functionName: "getRoundTopics",
    args: [roundId],
  });
}

export function useGetRoundEntries(roundId: bigint) {
  return useReadContract({
    ...arenaConfig,
    functionName: "getRoundEntries",
    args: [roundId],
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
