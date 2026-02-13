import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";
import { IdentityRegistryAbi } from "@/lib/contracts/IdentityRegistryAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const MONAD_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

const monadChain = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl!] } },
});

const client = createPublicClient({ chain: monadChain, transport: http() });
const registryAddress = CONTRACT_ADDRESSES.IDENTITY_REGISTRY;
const isDeployed = registryAddress !== "0x0000000000000000000000000000000000000000";

// GET /api/agents/[address]/identity
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  if (!isDeployed) {
    return NextResponse.json({
      registered: false,
      agentId: null,
      tokenURI: null,
      message: "Identity Registry not deployed yet",
    });
  }

  try {
    // Check if address has an identity token
    const balance = await client.readContract({
      address: registryAddress,
      abi: IdentityRegistryAbi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    if (Number(balance) === 0) {
      return NextResponse.json({
        registered: false,
        agentId: null,
        tokenURI: null,
      });
    }

    // For now, we don't have a direct mapping from address → agentId in the ABI
    // The balanceOf > 0 confirms they have an identity
    return NextResponse.json({
      registered: true,
      agentId: null, // Would need enumeration or events to find the exact token ID
      balance: Number(balance),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
