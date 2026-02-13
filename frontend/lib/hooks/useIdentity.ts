"use client";

import { useReadContract } from "wagmi";
import { IdentityRegistryAbi } from "@/lib/contracts/IdentityRegistryAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const identityConfig = {
  address: CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
  abi: IdentityRegistryAbi,
} as const;

const isDeployed = CONTRACT_ADDRESSES.IDENTITY_REGISTRY !== "0x0000000000000000000000000000000000000000";

/** Check if an address has a registered ERC-8004 identity (balanceOf > 0) */
export function useHasIdentity(address?: `0x${string}`) {
  return useReadContract({
    ...identityConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isDeployed && !!address },
  });
}

/** Get the token URI for a given agent ID */
export function useAgentTokenURI(agentId: bigint) {
  return useReadContract({
    ...identityConfig,
    functionName: "tokenURI",
    args: [agentId],
    query: { enabled: isDeployed && agentId > 0n },
  });
}

/** Get the wallet address linked to an agent ID */
export function useAgentWallet(agentId: bigint) {
  return useReadContract({
    ...identityConfig,
    functionName: "getAgentWallet",
    args: [agentId],
    query: { enabled: isDeployed && agentId > 0n },
  });
}

/** Get the owner of a specific agent token */
export function useAgentOwner(agentId: bigint) {
  return useReadContract({
    ...identityConfig,
    functionName: "ownerOf",
    args: [agentId],
    query: { enabled: isDeployed && agentId > 0n },
  });
}

/** Get metadata for an agent by key */
export function useAgentMetadata(agentId: bigint, metadataKey: string) {
  return useReadContract({
    ...identityConfig,
    functionName: "getMetadata",
    args: [agentId, metadataKey],
    query: { enabled: isDeployed && agentId > 0n && !!metadataKey },
  });
}
