import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";
import { ReputationRegistryAbi } from "@/lib/contracts/ReputationRegistryAbi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { supabase } from "@/lib/supabase";

const MONAD_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

const monadChain = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl!] } },
});

const client = createPublicClient({ chain: monadChain, transport: http() });
const registryAddress = CONTRACT_ADDRESSES.REPUTATION_REGISTRY;
const isDeployed = registryAddress !== "0x0000000000000000000000000000000000000000";

// GET /api/agents/[address]/feedback — read all feedback for an agent
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  try {
    // Look up agent's ERC-8004 ID
    const { data: user } = await supabase
      .from("users")
      .select("erc8004_agent_id")
      .ilike("address", address)
      .maybeSingle();

    const agentId = user?.erc8004_agent_id;

    if (!agentId || !isDeployed) {
      return NextResponse.json({ feedback: [], message: "No on-chain identity or registry not deployed" });
    }

    // Get all clients who gave feedback
    const clients = await client.readContract({
      address: registryAddress,
      abi: ReputationRegistryAbi,
      functionName: "getClients",
      args: [BigInt(agentId)],
    }) as `0x${string}`[];

    if (!clients || clients.length === 0) {
      return NextResponse.json({ feedback: [] });
    }

    // Read all feedback
    const allFeedback = await client.readContract({
      address: registryAddress,
      abi: ReputationRegistryAbi,
      functionName: "readAllFeedback",
      args: [BigInt(agentId), clients, "", "", false],
    });

    const [fbClients, feedbackIndexes, values, valueDecimals, tag1s, tag2s, revokedStatuses] =
      allFeedback as [string[], bigint[], bigint[], number[], string[], string[], boolean[]];

    const feedback = fbClients.map((c, i) => ({
      client: c,
      feedbackIndex: Number(feedbackIndexes[i]),
      value: Number(values[i]) / (10 ** valueDecimals[i]),
      valueDecimals: valueDecimals[i],
      tag1: tag1s[i],
      tag2: tag2s[i],
      isRevoked: revokedStatuses[i],
    }));

    return NextResponse.json({ feedback });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
