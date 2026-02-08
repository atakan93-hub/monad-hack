import { createClient } from "@supabase/supabase-js";
import {
  mockUsers,
  mockAgents,
  mockRequests,
  mockProposals,
  mockRounds,
  mockTopics,
  mockArenaEntries,
  mockEscrows,
} from "./mock-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("Starting seed...\n");

  // 1. Users
  const { error: usersError } = await supabase.from("users").insert(
    mockUsers.map((u) => ({
      id: u.id,
      address: u.address,
      name: u.name,
      role: u.role as "requester" | "agent" | "both",
      avatar_url: u.avatarUrl ?? null,
      created_at: u.createdAt,
    }))
  );
  if (usersError) console.error("Users error:", usersError.message);
  else console.log(`[OK] Users seeded (${mockUsers.length} rows)`);

  // 2. Agents
  const { error: agentsError } = await supabase.from("agents").insert(
    mockAgents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      avatar_url: a.avatarUrl ?? null,
      owner_id: a.owner,
      reputation: a.reputation,
      completion_rate: a.completionRate,
      total_tasks: a.totalTasks,
      skills: a.skills,
      hourly_rate: a.hourlyRate,
      created_at: a.createdAt,
    }))
  );
  if (agentsError) console.error("Agents error:", agentsError.message);
  else console.log(`[OK] Agents seeded (${mockAgents.length} rows)`);

  // 3. SBT Badges
  const badges = mockAgents.flatMap((a) =>
    a.sbtBadges.map((b) => ({
      id: b.id,
      agent_id: a.id,
      name: b.name,
      tier: b.tier as "bronze" | "silver" | "gold",
      issued_at: b.issuedAt,
    }))
  );
  const { error: badgesError } = await supabase.from("sbt_badges").insert(badges);
  if (badgesError) console.error("Badges error:", badgesError.message);
  else console.log(`[OK] SBT Badges seeded (${badges.length} rows)`);

  // 4. Task Requests
  const { error: requestsError } = await supabase.from("task_requests").insert(
    mockRequests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as "smart-contract" | "frontend" | "data-analysis" | "audit" | "other",
      budget: r.budget,
      deadline: r.deadline,
      status: r.status as "open" | "in_progress" | "completed" | "cancelled" | "disputed",
      requester_id: r.requesterId,
      assigned_agent_id: r.assignedAgentId ?? null,
      created_at: r.createdAt,
    }))
  );
  if (requestsError) console.error("Requests error:", requestsError.message);
  else console.log(`[OK] Task Requests seeded (${mockRequests.length} rows)`);

  // 5. Proposals
  const { error: proposalsError } = await supabase.from("proposals").insert(
    mockProposals.map((p) => ({
      id: p.id,
      request_id: p.requestId,
      agent_id: p.agentId,
      price: p.price,
      estimated_days: p.estimatedDays,
      message: p.message,
      status: p.status as "pending" | "accepted" | "rejected",
      created_at: p.createdAt,
    }))
  );
  if (proposalsError) console.error("Proposals error:", proposalsError.message);
  else console.log(`[OK] Proposals seeded (${mockProposals.length} rows)`);

  // 6. Rounds (without selected_topic_id to avoid circular FK)
  const { error: roundsError } = await supabase.from("rounds").insert(
    mockRounds.map((r) => ({
      id: r.id,
      round_number: r.roundNumber,
      prize: r.prize,
      status: r.status as "proposing" | "voting" | "active" | "completed",
      winner_id: r.winnerId ?? null,
      created_at: r.createdAt,
    }))
  );
  if (roundsError) console.error("Rounds error:", roundsError.message);
  else console.log(`[OK] Rounds seeded (${mockRounds.length} rows)`);

  // 7. Topics
  const { error: topicsError } = await supabase.from("topics").insert(
    mockTopics.map((t) => ({
      id: t.id,
      round_id: t.roundId,
      proposer_id: t.proposerId,
      title: t.title,
      description: t.description,
      total_votes: t.totalVotes,
      created_at: t.createdAt,
    }))
  );
  if (topicsError) console.error("Topics error:", topicsError.message);
  else console.log(`[OK] Topics seeded (${mockTopics.length} rows)`);

  // 7b. Update rounds with selected_topic_id
  for (const r of mockRounds) {
    if (r.selectedTopicId) {
      const { error } = await supabase
        .from("rounds")
        .update({ selected_topic_id: r.selectedTopicId })
        .eq("id", r.id);
      if (error) console.error(`Round ${r.id} topic update error:`, error.message);
    }
  }
  console.log("[OK] Rounds selected_topic_id updated");

  // 8. Arena Entries
  const { error: entriesError } = await supabase.from("arena_entries").insert(
    mockArenaEntries.map((e) => ({
      id: e.id,
      round_id: e.roundId,
      agent_id: e.agentId,
      repo_url: e.repoUrl,
      description: e.description,
      demo_url: e.demoUrl ?? null,
      created_at: e.createdAt,
    }))
  );
  if (entriesError) console.error("Entries error:", entriesError.message);
  else console.log(`[OK] Arena Entries seeded (${mockArenaEntries.length} rows)`);

  // 9. Escrow Deals
  const { error: escrowsError } = await supabase.from("escrow_deals").insert(
    mockEscrows.map((e) => ({
      id: e.id,
      request_id: e.requestId,
      requester_id: e.requesterId,
      agent_id: e.agentId,
      amount: e.amount,
      status: e.status as "created" | "funded" | "completed" | "disputed" | "refunded",
      created_at: e.createdAt,
      completed_at: e.completedAt ?? null,
    }))
  );
  if (escrowsError) console.error("Escrows error:", escrowsError.message);
  else console.log(`[OK] Escrow Deals seeded (${mockEscrows.length} rows)`);

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
