import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/market/requests — create a new task request
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, category, budget, deadline, requesterId } = body;

  try {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
