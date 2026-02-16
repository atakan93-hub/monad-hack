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

// GET /api/agents/[address]/reputation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  try {
    // Get user's erc8004_agent_id from DB
    const { data: user } = await supabase
      .from("users")
      .select("erc8004_agent_id")
      .ilike("address", address)
      .maybeSingle();

    const agentId = user?.erc8004_agent_id;

    if (!agentId || !isDeployed) {
      // Return DB-based reputation as fallback
      const { data: userRow } = await supabase
        .from("users")
        .select("reputation, completion_rate, total_tasks")
        .ilike("address", address)
        .maybeSingle();

      return NextResponse.json({
        onChain: false,
        agentId: null,
        reputation: userRow?.reputation ?? 0,
        completionRate: userRow?.completion_rate ?? 0,
        totalTasks: userRow?.total_tasks ?? 0,
        feedbackCount: 0,
        summaryValue: 0,
      });
    }

    // Get on-chain reputation summary
    const summary = await client.readContract({
      address: registryAddress,
      abi: ReputationRegistryAbi,
      functionName: "getSummary",
      args: [BigInt(agentId), [], "", ""],
    });

    const [count, summaryValue, summaryValueDecimals] = summary as [bigint, bigint, number];
    const divisor = 10 ** summaryValueDecimals;
    const normalizedValue = Number(summaryValue) / divisor;

    return NextResponse.json({
      onChain: true,
      agentId,
      feedbackCount: Number(count),
      summaryValue: normalizedValue,
      summaryValueDecimals,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
