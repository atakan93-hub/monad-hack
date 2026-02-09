"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { EscrowAbi } from "@/lib/contracts/EscrowAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const escrowConfig = {
  address: CONTRACT_ADDRESSES.ESCROW,
  abi: EscrowAbi,
} as const;

export function useCreateDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (agent: `0x${string}`, amount: bigint, deadline: bigint) =>
    writeContract({ ...escrowConfig, functionName: "createDeal", args: [agent, amount, deadline] });

  return { write, hash, receipt, isPending, isConfirming, isSuccess, error };
}

export function useFundDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (dealId: bigint) =>
    writeContract({ ...escrowConfig, functionName: "fundDeal", args: [dealId] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useCompleteDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (dealId: bigint) =>
    writeContract({ ...escrowConfig, functionName: "completeDeal", args: [dealId] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useReleaseFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = (dealId: bigint) =>
    writeContract({ ...escrowConfig, functionName: "releaseFunds", args: [dealId] });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useGetDeal(dealId: bigint) {
  return useReadContract({
    ...escrowConfig,
    functionName: "deals",
    args: [dealId],
  });
}
