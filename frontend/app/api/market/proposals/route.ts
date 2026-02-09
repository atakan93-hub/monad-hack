import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/resolve-user";
import { getOnChainDeal } from "@/lib/viem-server";

// POST /api/market/proposals
// Actions: submit, updateStatus
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "submit": {
        const { requestId, address, price, estimatedDays, message } = body;
        if (!address) {
          return NextResponse.json({ error: "address is required" }, { status: 400 });
        }
        const userId = await resolveUserId(address);
        const { data, error } = await supabase
          .from("proposals")
          .insert({
            request_id: requestId,
            user_id: userId,
            price,
            estimated_days: estimatedDays,
            message,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "updateStatus": {
        const { proposalId, status, address, onChainDealId } = body;
        if (!address) {
          return NextResponse.json({ error: "address is required" }, { status: 400 });
        }

        // Verify caller is the request owner
        const callerId = await resolveUserId(address);
        const { data: proposal, error: propErr } = await supabase
          .from("proposals")
          .select("request_id")
          .eq("id", proposalId)
          .single();
        if (propErr) throw propErr;

        const { data: taskReq, error: reqErr } = await supabase
          .from("task_requests")
          .select("requester_id")
          .eq("id", proposal.request_id)
          .single();
        if (reqErr) throw reqErr;

        if (taskReq.requester_id !== callerId) {
          return NextResponse.json(
            { error: "Only the requester can update proposal status" },
            { status: 403 },
          );
        }

        // On-chain verification for accept
        if (status === "accepted" && onChainDealId != null) {
          const onChainDeal = await getOnChainDeal(BigInt(onChainDealId));
          const client = (onChainDeal[0] as string).toLowerCase();
          if (client !== address.toLowerCase()) {
            return NextResponse.json(
              { error: "On-chain deal client does not match address" },
              { status: 403 },
            );
          }
        }

        const { data, error } = await supabase
          .from("proposals")
          .update({ status })
          .eq("id", proposalId)
          .select()
          .single();
        if (error) throw error;

        // When a proposal is accepted, update request to in_progress and assign the user
        if (status === "accepted" && data) {
          await supabase
            .from("task_requests")
            .update({ status: "in_progress", assigned_user_id: data.user_id })
            .eq("id", data.request_id);
        }

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
