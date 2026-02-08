import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/arena/sync
// Actions: createRound, advanceRound, proposeTopic, voteForTopic, selectWinner
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "createRound": {
        const { roundNumber, prize } = body;
        const { data, error } = await supabase
          .from("rounds")
          .insert({ round_number: roundNumber, prize, status: "proposing" })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "advanceRound": {
        const { roundId, newStatus } = body;
        const { data, error } = await supabase
          .from("rounds")
          .update({ status: newStatus })
          .eq("id", roundId)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "proposeTopic": {
        const { roundId, proposerId, title, description } = body;
        const { data, error } = await supabase
          .from("topics")
          .insert({
            round_id: roundId,
            proposer_id: proposerId,
            title,
            description,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "voteForTopic": {
        const { topicId, weight } = body;
        const { error: rpcError } = await supabase.rpc("increment_votes", {
          topic_id: topicId,
          weight,
        });
        if (rpcError) throw rpcError;

        const { data, error } = await supabase
          .from("topics")
          .select("*")
          .eq("id", topicId)
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "selectWinner": {
        const { roundId, winnerId } = body;
        const { data, error } = await supabase
          .from("rounds")
          .update({ status: "completed", winner_id: winnerId })
          .eq("id", roundId)
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
