"use client";

import { useAccount, useReadContract } from "wagmi";
import { ArenaAbi } from "@/lib/contracts/ArenaAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

export function useAdminCheck() {
  const { address, isConnected } = useAccount();

  const { data: adminAddress, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA,
    abi: ArenaAbi,
    functionName: "admin",
  });

  const isAdmin =
    isConnected &&
    !!address &&
    !!adminAddress &&
    address.toLowerCase() === (adminAddress as string).toLowerCase();

  return { isAdmin, isLoading, adminAddress, connectedAddress: address };
}
