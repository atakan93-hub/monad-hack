"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import type { TransactionReceipt } from "viem";
import { ReputationRegistryAbi } from "@/lib/contracts/ReputationRegistryAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const reputationConfig = {
  address: CONTRACT_ADDRESSES.REPUTATION_REGISTRY,
  abi: ReputationRegistryAbi,
} as const;

const isDeployed = CONTRACT_ADDRESSES.REPUTATION_REGISTRY !== "0x0000000000000000000000000000000000000000";

/** Get reputation summary for an agent */
export function useReputationSummary(agentId: bigint, clientAddresses: `0x${string}`[] = [], tag1 = "", tag2 = "") {
  return useReadContract({
    ...reputationConfig,
    functionName: "getSummary",
    args: [agentId, clientAddresses, tag1, tag2],
    query: { enabled: isDeployed && agentId > 0n },
  });
}

/** Get all clients who gave feedback to an agent */
export function useReputationClients(agentId: bigint) {
  return useReadContract({
    ...reputationConfig,
    functionName: "getClients",
    args: [agentId],
    query: { enabled: isDeployed && agentId > 0n },
  });
}

/** Read a specific feedback entry */
export function useReadFeedback(agentId: bigint, clientAddress: `0x${string}`, feedbackIndex: bigint) {
  return useReadContract({
    ...reputationConfig,
    functionName: "readFeedback",
    args: [agentId, clientAddress, feedbackIndex],
    query: { enabled: isDeployed && agentId > 0n },
  });
}

/** Give feedback to an agent */
export function useGiveFeedback() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  const writeAsync = async (
    agentId: bigint,
    value: bigint,
    valueDecimals: number,
    tag1: string,
    tag2: string,
    endpoint: string,
    feedbackURI: string,
    feedbackHash: `0x${string}`,
  ) => {
    const h = await writeContractAsync({
      ...reputationConfig,
      functionName: "giveFeedback",
      args: [agentId, value, valueDecimals, tag1, tag2, endpoint, feedbackURI, feedbackHash],
    });
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: h });
    if (receipt.status === "reverted") throw new Error("giveFeedback reverted");
    return receipt as TransactionReceipt;
  };

  return { writeAsync, hash, isPending, isConfirming, isSuccess, error };
}
