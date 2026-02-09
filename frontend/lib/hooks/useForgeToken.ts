"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { Erc20Abi } from "@/lib/contracts/Erc20Abi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const tokenConfig = {
  address: CONTRACT_ADDRESSES.FORGE_TOKEN,
  abi: Erc20Abi,
} as const;

export function useForgeBalance() {
  const { address } = useAccount();

  return useReadContract({
    ...tokenConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useForgeAllowance(spender: `0x${string}`) {
  const { address } = useAccount();

  return useReadContract({
    ...tokenConfig,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
  });
}

export function useApprove(spender: `0x${string}`, amount: bigint) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const write = () =>
    writeContract({
      ...tokenConfig,
      functionName: "approve",
      args: [spender, amount],
    });

  return { write, hash, isPending, isConfirming, isSuccess, error };
}

export function useForgeApprove() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const approveAsync = async (spender: `0x${string}`, amount: bigint) => {
    const h = await writeContractAsync({
      ...tokenConfig,
      functionName: "approve",
      args: [spender, amount],
    });
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: h });
    if (receipt.status === "reverted") throw new Error("FORGE approve reverted");
    return receipt;
  };

  return { approveAsync };
}
