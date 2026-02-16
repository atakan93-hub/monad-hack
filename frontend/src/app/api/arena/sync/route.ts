import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
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
        const { onChainRoundId, creator } = body;
        if (onChainRoundId == null) {
          return NextResponse.json({ error: "onChainRoundId is required" }, { status: 400 });
        }
        // Verify round exists on-chain
        const onChainRound = await getOnChainRound(BigInt(onChainRoundId));
        const roundNumber = Number(onChainRound[0] as bigint);
        const prize = Number(formatUnits(onChainRound[1] as bigint, 18));
        if (roundNumber === 0 && prize === 0) {
          return NextResponse.json({ error: "Round does not exist on-chain" }, { status: 404 });
        }
        const insertPayload: Record<string, unknown> = {
          round_number: roundNumber,
          prize,
          status: "proposing",
          on_chain_round_id: Number(onChainRoundId),
        };
        if (creator) {
          insertPayload.creator = creator;
        }
        // Check if round already exists in DB (by round_number or on_chain_round_id)
        const { data: existing } = await supabase
          .from("rounds")
          .select()
          .or(`round_number.eq.${insertPayload.round_number},on_chain_round_id.eq.${Number(onChainRoundId)}`)
          .maybeSingle();
        if (existing) {
          // Update creator if not set
          if (creator && !existing.creator) {
            await supabase.from("rounds").update({ creator }).eq("id", existing.id);
          }
          return NextResponse.json(existing);
        }
        const { data, error } = await supabase
          .from("rounds")
          .insert(insertPayload)
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

        let onChainSelectedTopicId: number | null = null;
        if (roundRow.on_chain_round_id != null) {
          const onChainRound = await getOnChainRound(BigInt(roundRow.on_chain_round_id));
          // status enum: 0=Proposing, 1=Voting, 2=Building(active), 3=Judging, 4=Completed
          const statusMap: Record<number, string> = { 0: "proposing", 1: "voting", 2: "active", 3: "judging", 4: "completed" };
          const onChainStatus = statusMap[Number(onChainRound[3])] ?? "unknown";
          if (onChainStatus !== newStatus) {
            return NextResponse.json(
              { error: `On-chain status is "${onChainStatus}", not "${newStatus}"` },
              { status: 403 },
            );
          }
          // Read selectedTopicId when advancing to active (Voting → Building)
          const rawSelectedTopicId = Number(onChainRound[4]);
          if (rawSelectedTopicId > 0) {
            onChainSelectedTopicId = rawSelectedTopicId;
          }
        }

        // If on-chain has a selected topic, find the matching DB topic and mark it as winning
        const updatePayload: Record<string, unknown> = { status: newStatus };
        if (onChainSelectedTopicId != null) {
          const { data: topicRow } = await supabase
            .from("topics")
            .select("id")
            .eq("on_chain_topic_id", onChainSelectedTopicId)
            .single();
          if (topicRow) {
            updatePayload.selected_topic_id = topicRow.id;
            // Mark the winning topic
            await supabase
              .from("topics")
              .update({ is_winning: true })
              .eq("id", topicRow.id);
          }
        }

        const { data, error } = await supabase
          .from("rounds")
          .update(updatePayload)
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

        // On-chain verification: check hasVoted + read totalVotes
        let onChainTotalVotes: bigint | null = null;
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
          onChainTotalVotes = onChainTopic[4] as bigint;
        }

        // Resolve user (validates address exists) and sync votes
        await resolveUserId(address);
        if (onChainTotalVotes != null) {
          // Sync DB total_votes to match on-chain (convert from 18 decimals)
          const totalVotes = Number(onChainTotalVotes / 10n ** 18n);
          const { error: updateErr } = await supabase
            .from("topics")
            .update({ total_votes: totalVotes })
            .eq("id", topicId);
          if (updateErr) throw updateErr;
        } else {
          // Fallback: no on-chain data, increment by 1
          const { error: rpcError } = await supabase.rpc("increment_votes", {
            topic_id: topicId,
            weight: 1,
          });
          if (rpcError) throw rpcError;
        }

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
        // winnerId can be a DB UUID or a wallet address — resolve to UUID
        let resolvedWinnerId = winnerId;
        if (winnerId && winnerId.startsWith("0x")) {
          resolvedWinnerId = await resolveUserId(winnerId);
        }
        const { data, error } = await supabase
          .from("rounds")
          .update({ status: "completed", winner_id: resolvedWinnerId })
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
