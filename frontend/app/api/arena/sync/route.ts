import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/resolve-user";
import { getOnChainRound, getOnChainTopic, getHasVotedOnChain } from "@/lib/viem-server";

// POST /api/arena/sync
// Actions: createRound, advanceRound, proposeTopic, voteForTopic, selectWinner
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "createRound": {
        const { onChainRoundId } = body;
        if (onChainRoundId == null) {
          return NextResponse.json({ error: "onChainRoundId is required" }, { status: 400 });
        }
        // Verify round exists on-chain
        const onChainRound = await getOnChainRound(BigInt(onChainRoundId));
        const roundNumber = Number(onChainRound[0] as bigint);
        const prize = Number(onChainRound[1] as bigint);
        if (roundNumber === 0 && prize === 0) {
          return NextResponse.json({ error: "Round does not exist on-chain" }, { status: 404 });
        }
        const { data, error } = await supabase
          .from("rounds")
          .insert({ round_number: roundNumber, prize, status: "proposing", on_chain_round_id: Number(onChainRoundId) })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "advanceRound": {
        const { roundId, newStatus } = body;
        // Look up on_chain_round_id to verify on-chain
        const { data: roundRow, error: roundErr } = await supabase
          .from("rounds")
          .select("on_chain_round_id")
          .eq("id", roundId)
          .single();
        if (roundErr) throw roundErr;
        if (roundRow.on_chain_round_id != null) {
          const onChainRound = await getOnChainRound(BigInt(roundRow.on_chain_round_id));
          // status enum: 0=Proposing, 1=Voting, 2=Building(active), 3=Judging(active), 4=Completed
          const statusMap: Record<number, string> = { 0: "proposing", 1: "voting", 2: "active", 3: "active", 4: "completed" };
          const onChainStatus = statusMap[Number(onChainRound[3])] ?? "unknown";
          if (onChainStatus !== newStatus) {
            return NextResponse.json(
              { error: `On-chain status is "${onChainStatus}", not "${newStatus}"` },
              { status: 403 },
            );
          }
        }
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
        const { roundId, address, title, description, onChainTopicId } = body;

        // On-chain verification: check proposer matches address
        if (onChainTopicId != null) {
          const onChainTopic = await getOnChainTopic(BigInt(onChainTopicId));
          // onChainTopic = [roundId, proposer, title, description, totalVotes]
          const proposer = onChainTopic[1] as string;
          if (proposer.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json(
              { error: "On-chain proposer does not match address" },
              { status: 403 },
            );
          }
        }

        const proposerId = await resolveUserId(address);
        const { data, error } = await supabase
          .from("topics")
          .insert({
            round_id: roundId,
            proposer_id: proposerId,
            title,
            description,
            on_chain_topic_id: onChainTopicId != null ? Number(onChainTopicId) : null,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "voteForTopic": {
        const { topicId, address } = body;

        // Look up topic to get on_chain_topic_id
        const { data: topicRow, error: topicErr } = await supabase
          .from("topics")
          .select("*")
          .eq("id", topicId)
          .single();
        if (topicErr) throw topicErr;

        // On-chain verification: check hasVoted
        if (topicRow.on_chain_topic_id != null) {
          const onChainTopic = await getOnChainTopic(BigInt(topicRow.on_chain_topic_id));
          const onChainRoundId = onChainTopic[0] as bigint;
          const voted = await getHasVotedOnChain(onChainRoundId, address);
          if (!voted) {
            return NextResponse.json(
              { error: "On-chain vote not found for this address" },
              { status: 403 },
            );
          }
        }

        // Resolve user (validates address exists) and increment votes
        await resolveUserId(address);
        const { error: rpcError } = await supabase.rpc("increment_votes", {
          topic_id: topicId,
          weight: 1,
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

      case "submitEntry": {
        const { roundId, address, repoUrl, description, onChainEntryId } = body;
        const userId = await resolveUserId(address);
        const { data, error } = await supabase
          .from("arena_entries")
          .insert({
            round_id: roundId,
            user_id: userId,
            repo_url: repoUrl,
            description: description ?? "",
            on_chain_entry_id: onChainEntryId != null ? Number(onChainEntryId) : null,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "selectWinner": {
        const { roundId, winnerId } = body;
        // Verify on-chain winner
        const { data: rRow, error: rErr } = await supabase
          .from("rounds")
          .select("on_chain_round_id")
          .eq("id", roundId)
          .single();
        if (rErr) throw rErr;
        if (rRow.on_chain_round_id != null) {
          const onChainRound = await getOnChainRound(BigInt(rRow.on_chain_round_id));
          const onChainWinner = (onChainRound[2] as string).toLowerCase();
          const zeroAddr = "0x0000000000000000000000000000000000000000";
          if (onChainWinner === zeroAddr) {
            return NextResponse.json(
              { error: "Winner not yet selected on-chain" },
              { status: 403 },
            );
          }
        }
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
