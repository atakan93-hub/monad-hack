"use client";

import { useAccount } from "wagmi";

/**
 * ArenaV2 has no admin — anyone can create rounds, advance, etc.
 * This hook returns isAdmin=true for all connected wallets (no admin gating).
 */
export function useAdminCheck() {
  const { address, isConnected } = useAccount();

  return {
    isAdmin: isConnected && !!address,
    isLoading: false,
    adminAddress: address,
    connectedAddress: address,
  };
}
