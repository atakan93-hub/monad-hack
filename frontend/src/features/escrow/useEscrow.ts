"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import type { TransactionReceipt } from "viem";
import { EscrowAbi } from "@/lib/contracts/EscrowAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const escrowConfig = {
  address: CONTRACT_ADDRESSES.ESCROW,
  abi: EscrowAbi,
} as const;

/** Shared base for all escrow write hooks: sign → wait → assert success */
function useEscrowWrite() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  const sendAndWait = async (functionName: string, args: unknown[]) => {
    const h = await writeContractAsync({ ...escrowConfig, functionName, args } as Parameters<typeof writeContractAsync>[0]);
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: h });
    if (receipt.status === "reverted") throw new Error(`Transaction reverted: ${functionName}`);
    return receipt as TransactionReceipt;
  };

  return { sendAndWait, hash, isPending, isConfirming, isSuccess, error };
}

export function useCreateDeal() {
  const { sendAndWait, ...rest } = useEscrowWrite();
  const writeAsync = (agent: `0x${string}`, amount: bigint, deadline: bigint) =>
    sendAndWait("createDeal", [agent, amount, deadline]);
  return { writeAsync, ...rest };
}

export function useFundDeal() {
  const { sendAndWait, ...rest } = useEscrowWrite();
  const writeAsync = (dealId: bigint) => sendAndWait("fundDeal", [dealId]);
  return { writeAsync, ...rest };
}

export function useCompleteDeal() {
  const { sendAndWait, ...rest } = useEscrowWrite();
  const writeAsync = (dealId: bigint) => sendAndWait("completeDeal", [dealId]);
  return { writeAsync, ...rest };
}

export function useReleaseFunds() {
  const { sendAndWait, ...rest } = useEscrowWrite();
  const writeAsync = (dealId: bigint) => sendAndWait("releaseFunds", [dealId]);
  return { writeAsync, ...rest };
}

export function useDisputeDeal() {
  const { sendAndWait, ...rest } = useEscrowWrite();
  const writeAsync = (dealId: bigint) => sendAndWait("dispute", [dealId]);
  return { writeAsync, ...rest };
}

export function useRefundDeal() {
  const { sendAndWait, ...rest } = useEscrowWrite();
  const writeAsync = (dealId: bigint) => sendAndWait("refund", [dealId]);
  return { writeAsync, ...rest };
}

export function useGetDeal(dealId: bigint) {
  return useReadContract({
    ...escrowConfig,
    functionName: "deals",
    args: [dealId],
  });
}
