import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/resolve-user";

// POST /api/escrow/sync
// Actions: createEscrow, updateStatus
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "createEscrow": {
        const { requestId, address, agentId, amount } = body;
        const requesterId = await resolveUserId(address);
        const { data, error } = await supabase
          .from("escrow_deals")
          .insert({
            request_id: requestId,
            requester_id: requesterId,
            agent_id: agentId,
            amount,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "updateStatus": {
        const { escrowId, status } = body;
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
