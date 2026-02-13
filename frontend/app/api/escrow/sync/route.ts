import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/resolve-user";
import { getOnChainDeal } from "@/lib/viem-server";

// POST /api/escrow/sync
// Actions: createEscrow, updateStatus
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "createEscrow": {
        const { requestId, address, userId, amount, onChainDealId } = body;

        // Read on-chain deal to get client address
        let resolvedAddress = address;
        if (onChainDealId != null) {
          const onChainDeal = await getOnChainDeal(BigInt(onChainDealId));
          // onChainDeal = [client, agent, amount, deadline, status]
          const client = onChainDeal[0] as string;
          if (address) {
            if (client.toLowerCase() !== address.toLowerCase()) {
              return NextResponse.json(
                { error: "On-chain deal client does not match address" },
                { status: 403 },
              );
            }
          } else {
            resolvedAddress = client;
          }
        }

        if (!resolvedAddress) {
          return NextResponse.json({ error: "address required (or provide onChainDealId)" }, { status: 400 });
        }

        const requesterId = await resolveUserId(resolvedAddress);

        // Resolve agent user_id — from body.userId or from on-chain deal
        let agentUserId = userId;
        if (!agentUserId && onChainDealId != null) {
          const onChainDeal = await getOnChainDeal(BigInt(onChainDealId));
          const agentAddress = onChainDeal[1] as string;
          agentUserId = await resolveUserId(agentAddress);
        }

        const { data, error } = await supabase
          .from("escrow_deals")
          .insert({
            request_id: requestId,
            requester_id: requesterId,
            user_id: agentUserId,
            amount,
            on_chain_deal_id: onChainDealId != null ? Number(onChainDealId) : null,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "updateStatus": {
        const { escrowId, status } = body;

        // On-chain verification: check deal status matches
        const { data: escrowRow, error: escrowErr } = await supabase
          .from("escrow_deals")
          .select("on_chain_deal_id")
          .eq("id", escrowId)
          .single();
        if (escrowErr) throw escrowErr;

        if (escrowRow.on_chain_deal_id != null) {
          const onChainDeal = await getOnChainDeal(BigInt(escrowRow.on_chain_deal_id));
          const onChainStatusNum = Number(onChainDeal[4]);

          if (status === "released") {
            // released = on-chain Completed(2) + amount drained to 0
            const onChainAmount = BigInt(onChainDeal[2] as bigint);
            if (onChainStatusNum !== 2 || onChainAmount !== 0n) {
              return NextResponse.json(
                { error: "On-chain deal not yet released (status must be Completed and amount must be 0)" },
                { status: 403 },
              );
            }
          } else {
            // status enum: 0=Created, 1=Funded, 2=Completed, 3=Disputed, 4=Refunded
            const statusMap: Record<number, string> = {
              0: "created", 1: "funded", 2: "completed", 3: "disputed", 4: "refunded",
            };
            const onChainStatus = statusMap[onChainStatusNum] ?? "unknown";
            if (onChainStatus !== status) {
              return NextResponse.json(
                { error: `On-chain status is "${onChainStatus}", not "${status}"` },
                { status: 403 },
              );
            }
          }
        }

        const updateData: { status: string; completed_at?: string } = { status };
        if (status === "completed") {
          updateData.completed_at = new Date().toISOString();
        }
        const { data, error } = await supabase
          .from("escrow_deals")
          .update(updateData)
          .eq("id", escrowId)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
