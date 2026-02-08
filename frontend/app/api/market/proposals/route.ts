import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/market/proposals
// Actions: submit, updateStatus
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "submit": {
        const { requestId, userId, price, estimatedDays, message } = body;
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
        const { proposalId, status } = body;
        const { data, error } = await supabase
          .from("proposals")
          .update({ status })
          .eq("id", proposalId)
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
