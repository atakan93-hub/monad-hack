"use client";

import { useAccount } from "wagmi";

const ARENA_ADMINS = (process.env.NEXT_PUBLIC_ARENA_ADMINS ?? "")
  .split(",")
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check if the connected wallet is an Arena admin.
 * Admins can create rounds and contribute prizes.
 */
export function useAdminCheck() {
  const { address, isConnected } = useAccount();

  const isAdmin =
    isConnected &&
    !!address &&
    ARENA_ADMINS.includes(address.toLowerCase());

  return {
    isAdmin,
    isLoading: false,
    adminAddress: address,
    connectedAddress: address,
  };
}
