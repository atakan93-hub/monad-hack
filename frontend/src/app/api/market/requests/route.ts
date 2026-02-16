import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/resolve-user";
import { getOnChainDeal } from "@/lib/viem-server";

// POST /api/market/requests — create or update task requests
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "updateStatus": {
        const { requestId, status, address } = body;
        if (!address) {
          return NextResponse.json({ error: "address is required" }, { status: 400 });
        }

        // Verify caller is the request owner
        const callerId = await resolveUserId(address);
        const { data: taskReq, error: reqErr } = await supabase
          .from("task_requests")
          .select("requester_id")
          .eq("id", requestId)
          .single();
        if (reqErr) throw reqErr;

        if (taskReq.requester_id !== callerId) {
          return NextResponse.json(
            { error: "Only the requester can update request status" },
            { status: 403 },
          );
        }

        // On-chain verification for completed: escrow deal must be completed on-chain
        if (status === "completed") {
          const { data: escrow } = await supabase
            .from("escrow_deals")
            .select("on_chain_deal_id")
            .eq("request_id", requestId)
            .maybeSingle();

          if (escrow?.on_chain_deal_id != null) {
            const onChainDeal = await getOnChainDeal(BigInt(escrow.on_chain_deal_id));
            const onChainStatus = Number(onChainDeal[4]);
            if (onChainStatus < 2) {
              return NextResponse.json(
                { error: "On-chain deal not yet completed" },
                { status: 403 },
              );
            }
          }
        }

        const { data, error } = await supabase
          .from("task_requests")
          .update({ status })
          .eq("id", requestId)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      default: {
        // Legacy: create request (no action field)
        const { title, description, category, budget, deadline, address } = body;
        const requesterId = await resolveUserId(address);
        const { data, error } = await supabase
          .from("task_requests")
          .insert({
            title,
            description,
            category,
            budget,
            deadline,
            requester_id: requesterId,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
