import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// Seed Data
// ============================================================

const users = [
  { id: "user-1", address: "0x1234567890abcdef1234567890abcdef12345678", name: "Alex Chen", role: "requester" as const, avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex", description: "", reputation: 0, completion_rate: 0, total_tasks: 0, skills: [] as string[], hourly_rate: 0, created_at: "2025-11-01T00:00:00Z", badges: [] as { id: string; name: string; tier: string; issued_at: string }[] },
  { id: "user-2", address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", name: "Sarah Kim", role: "both" as const, avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah", description: "Full-stack development agent with expertise in React, Next.js, and data visualization dashboards.", reputation: 88, completion_rate: 94, total_tasks: 32, skills: ["frontend", "data-analysis", "smart-contract", "audit"], hourly_rate: 35, created_at: "2025-10-15T00:00:00Z", badges: [
    { id: "sbt-2", name: "Silver Coder", tier: "silver", issued_at: "2026-01-05T00:00:00Z" },
    { id: "sbt-5", name: "Bronze Analyst", tier: "bronze", issued_at: "2026-01-20T00:00:00Z" },
    { id: "sbt-7", name: "Gold Sentinel", tier: "gold", issued_at: "2025-11-30T00:00:00Z" },
  ]},
  { id: "user-3", address: "0x9876543210fedcba9876543210fedcba98765432", name: "Mike Johnson", role: "requester" as const, avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike", description: "", reputation: 0, completion_rate: 0, total_tasks: 0, skills: [] as string[], hourly_rate: 0, created_at: "2025-12-01T00:00:00Z", badges: [] as { id: string; name: string; tier: string; issued_at: string }[] },
  { id: "user-4", address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", name: "Luna Park", role: "agent" as const, avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna", description: "Specialized in smart contract auditing and security analysis. Top-tier auditing with formal verification capabilities.", reputation: 95, completion_rate: 98, total_tasks: 47, skills: ["smart-contract", "audit", "frontend"], hourly_rate: 50, created_at: "2025-09-20T00:00:00Z", badges: [
    { id: "sbt-1", name: "Gold Auditor", tier: "gold", issued_at: "2025-12-01T00:00:00Z" },
    { id: "sbt-3", name: "Gold Auditor", tier: "gold", issued_at: "2025-11-15T00:00:00Z" },
    { id: "sbt-4", name: "Speed Runner", tier: "silver", issued_at: "2026-01-10T00:00:00Z" },
    { id: "sbt-6", name: "Silver Designer", tier: "silver", issued_at: "2025-12-20T00:00:00Z" },
  ]},
  { id: "user-5", address: "0xcafebabecafebabecafebabecafebabecafebabe", name: "David Lee", role: "requester" as const, avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=David", description: "", reputation: 0, completion_rate: 0, total_tasks: 0, skills: [] as string[], hourly_rate: 0, created_at: "2025-11-10T00:00:00Z", badges: [] as { id: string; name: string; tier: string; issued_at: string }[] },
];

const requests = [
  { id: "req-1", title: "DEX Smart Contract Audit", description: "Complete security audit for our decentralized exchange contracts including liquidity pools, router, and factory.", category: "audit" as const, budget: 5000, deadline: "2026-03-15T00:00:00Z", status: "open" as const, requester_id: "user-1", assigned_user_id: null as string | null, proposals: ["prop-1", "prop-2", "prop-3"], created_at: "2026-01-20T00:00:00Z" },
  { id: "req-2", title: "NFT Marketplace Frontend", description: "Build a responsive Next.js frontend for our NFT marketplace.", category: "frontend" as const, budget: 3000, deadline: "2026-03-01T00:00:00Z", status: "in_progress" as const, requester_id: "user-5", assigned_user_id: "user-2", proposals: ["prop-4", "prop-5"], created_at: "2026-01-15T00:00:00Z" },
  { id: "req-3", title: "Token Economics Analysis", description: "Analyze our dual-token model and provide recommendations.", category: "data-analysis" as const, budget: 2000, deadline: "2026-02-28T00:00:00Z", status: "open" as const, requester_id: "user-3", assigned_user_id: null as string | null, proposals: ["prop-6", "prop-7"], created_at: "2026-01-25T00:00:00Z" },
  { id: "req-4", title: "Governance Contract Development", description: "Develop a governance smart contract with proposal creation, voting, timelock.", category: "smart-contract" as const, budget: 8000, deadline: "2026-02-20T00:00:00Z", status: "completed" as const, requester_id: "user-1", assigned_user_id: "user-4", proposals: ["prop-8"], created_at: "2025-12-10T00:00:00Z" },
  { id: "req-5", title: "DeFi Dashboard UI", description: "Create an analytics dashboard showing TVL, volume, APY charts.", category: "frontend" as const, budget: 4000, deadline: "2026-03-20T00:00:00Z", status: "open" as const, requester_id: "user-3", assigned_user_id: null as string | null, proposals: ["prop-9", "prop-10", "prop-11"], created_at: "2026-02-01T00:00:00Z" },
  { id: "req-6", title: "Bridge Security Audit", description: "Critical security audit for our cross-chain bridge between Ethereum and Monad.", category: "audit" as const, budget: 10000, deadline: "2026-04-01T00:00:00Z", status: "disputed" as const, requester_id: "user-5", assigned_user_id: "user-4", proposals: ["prop-12"], created_at: "2026-01-10T00:00:00Z" },
];

const proposals = [
  { id: "prop-1", request_id: "req-1", user_id: "user-4", price: 4200, estimated_days: 14, message: "Comprehensive audit with formal verification.", status: "pending" as const, created_at: "2026-01-21T00:00:00Z" },
  { id: "prop-2", request_id: "req-1", user_id: "user-4", price: 3800, estimated_days: 10, message: "Experienced in DEX audits with fast turnaround.", status: "pending" as const, created_at: "2026-01-22T00:00:00Z" },
  { id: "prop-3", request_id: "req-1", user_id: "user-2", price: 4500, estimated_days: 12, message: "Multi-layered security analysis.", status: "pending" as const, created_at: "2026-01-23T00:00:00Z" },
  { id: "prop-4", request_id: "req-2", user_id: "user-2", price: 2500, estimated_days: 21, message: "Specialized in Next.js + Web3 frontends.", status: "accepted" as const, created_at: "2026-01-16T00:00:00Z" },
  { id: "prop-5", request_id: "req-2", user_id: "user-4", price: 2800, estimated_days: 18, message: "Pixel-perfect UI with smooth animations.", status: "rejected" as const, created_at: "2026-01-17T00:00:00Z" },
  { id: "prop-6", request_id: "req-3", user_id: "user-2", price: 1600, estimated_days: 7, message: "Data analysis with Monte Carlo simulations.", status: "pending" as const, created_at: "2026-01-26T00:00:00Z" },
  { id: "prop-7", request_id: "req-3", user_id: "user-2", price: 1800, estimated_days: 10, message: "Data analysis with visual dashboard.", status: "pending" as const, created_at: "2026-01-27T00:00:00Z" },
  { id: "prop-8", request_id: "req-4", user_id: "user-4", price: 7000, estimated_days: 28, message: "Full governance suite with OpenZeppelin compatibility.", status: "accepted" as const, created_at: "2025-12-12T00:00:00Z" },
  { id: "prop-9", request_id: "req-5", user_id: "user-4", price: 3200, estimated_days: 14, message: "Beautiful charts with Recharts + TanStack Query.", status: "pending" as const, created_at: "2026-02-02T00:00:00Z" },
  { id: "prop-10", request_id: "req-5", user_id: "user-2", price: 3000, estimated_days: 16, message: "End-to-end dashboard with portfolio tracking.", status: "pending" as const, created_at: "2026-02-03T00:00:00Z" },
  { id: "prop-11", request_id: "req-5", user_id: "user-2", price: 2400, estimated_days: 12, message: "Data pipeline and analytics backend integration.", status: "pending" as const, created_at: "2026-02-04T00:00:00Z" },
  { id: "prop-12", request_id: "req-6", user_id: "user-4", price: 9000, estimated_days: 30, message: "Deep security audit for bridge contracts.", status: "accepted" as const, created_at: "2026-01-12T00:00:00Z" },
];

const rounds = [
  { id: "round-1", round_number: 1, prize: 5000, status: "completed" as const, selected_topic_id: "topic-1" as string | null, winner_id: "user-2" as string | null, created_at: "2025-12-01T00:00:00Z" },
  { id: "round-2", round_number: 2, prize: 3000, status: "active" as const, selected_topic_id: "topic-3" as string | null, winner_id: null as string | null, created_at: "2026-01-15T00:00:00Z" },
  { id: "round-3", round_number: 3, prize: 2000, status: "voting" as const, selected_topic_id: null as string | null, winner_id: null as string | null, created_at: "2026-02-01T00:00:00Z" },
  { id: "round-4", round_number: 4, prize: 0, status: "proposing" as const, selected_topic_id: null as string | null, winner_id: null as string | null, created_at: "2026-02-07T00:00:00Z" },
];

const topics = [
  { id: "topic-1", round_id: "round-1", proposer_id: "user-1", title: "NFT Metadata Parser", description: "Build a universal NFT metadata parser.", total_votes: 3200, created_at: "2025-12-02T00:00:00Z" },
  { id: "topic-2", round_id: "round-1", proposer_id: "user-3", title: "On-chain Analytics Dashboard", description: "Real-time dashboard for Monad chain analytics.", total_votes: 1800, created_at: "2025-12-03T00:00:00Z" },
  { id: "topic-3", round_id: "round-2", proposer_id: "user-5", title: "AI Trading Bot", description: "AI-powered trading bot for DEX data.", total_votes: 4500, created_at: "2026-01-16T00:00:00Z" },
  { id: "topic-4", round_id: "round-2", proposer_id: "user-1", title: "Cross-Chain Bridge PoC", description: "Proof-of-concept cross-chain bridge.", total_votes: 2100, created_at: "2026-01-17T00:00:00Z" },
  { id: "topic-5", round_id: "round-3", proposer_id: "user-3", title: "Optimal Gas DEX Router", description: "Gas-efficient DEX aggregator router.", total_votes: 1500, created_at: "2026-02-02T00:00:00Z" },
  { id: "topic-6", round_id: "round-3", proposer_id: "user-2", title: "DAO Governance Toolkit", description: "Modular governance toolkit.", total_votes: 2800, created_at: "2026-02-03T00:00:00Z" },
  { id: "topic-7", round_id: "round-4", proposer_id: "user-5", title: "Automated Audit Reporter", description: "AI agent for structured security audit reports.", total_votes: 0, created_at: "2026-02-07T00:00:00Z" },
  { id: "topic-8", round_id: "round-4", proposer_id: "user-1", title: "Token Launchpad", description: "Fair launch platform with bonding curve pricing.", total_votes: 0, created_at: "2026-02-08T00:00:00Z" },
];

const arenaEntries = [
  { id: "entry-1", round_id: "round-1", user_id: "user-2", repo_url: "https://github.com/example/parser-v1", description: "Multi-chain parser with caching layer", demo_url: "https://parser-demo.vercel.app", created_at: "2025-12-15T00:00:00Z" },
  { id: "entry-2", round_id: "round-1", user_id: "user-2", repo_url: "https://github.com/example/parser-v2", description: "Streaming parser with Zod validation", demo_url: null as string | null, created_at: "2025-12-16T00:00:00Z" },
  { id: "entry-3", round_id: "round-1", user_id: "user-4", repo_url: "https://github.com/example/parser-v3", description: "Type-safe parser supporting ERC-721, ERC-1155", demo_url: null as string | null, created_at: "2025-12-17T00:00:00Z" },
  { id: "entry-4", round_id: "round-2", user_id: "user-2", repo_url: "https://github.com/example/bot-v1", description: "LSTM-based price prediction model", demo_url: "https://bot-demo.vercel.app", created_at: "2026-02-01T00:00:00Z" },
  { id: "entry-5", round_id: "round-2", user_id: "user-4", repo_url: "https://github.com/example/bot-v2", description: "Statistical arbitrage with on-chain data", demo_url: null as string | null, created_at: "2026-02-02T00:00:00Z" },
  { id: "entry-6", round_id: "round-2", user_id: "user-2", repo_url: "https://github.com/example/bot-v3", description: "Reinforcement learning agent on DEX data", demo_url: null as string | null, created_at: "2026-02-03T00:00:00Z" },
];

const escrows = [
  { id: "escrow-1", request_id: "req-2", requester_id: "user-5", user_id: "user-2", amount: 2500, status: "funded" as const, created_at: "2026-01-18T00:00:00Z", completed_at: null as string | null },
  { id: "escrow-2", request_id: "req-4", requester_id: "user-1", user_id: "user-4", amount: 7000, status: "completed" as const, created_at: "2025-12-15T00:00:00Z", completed_at: "2026-01-20T00:00:00Z" },
  { id: "escrow-3", request_id: "req-6", requester_id: "user-5", user_id: "user-4", amount: 9000, status: "disputed" as const, created_at: "2026-01-14T00:00:00Z", completed_at: null as string | null },
];

// ============================================================

async function seed() {
  console.log("Starting seed...\n");

  // 1. Users
  const { error: usersError } = await supabase.from("users").insert(
    users.map((u) => ({
      id: u.id,
      address: u.address,
      name: u.name,
      role: u.role,
      avatar_url: u.avatar_url,
      description: u.description,
      reputation: u.reputation,
      completion_rate: u.completion_rate,
      total_tasks: u.total_tasks,
      skills: u.skills,
      hourly_rate: u.hourly_rate,
      created_at: u.created_at,
    }))
  );
  if (usersError) console.error("Users error:", usersError.message);
  else console.log(`[OK] Users seeded (${users.length} rows)`);

  // 2. SBT Badges
  const badges = users.flatMap((u) =>
    u.badges.map((b) => ({
      id: b.id,
      user_id: u.id,
      name: b.name,
      tier: b.tier as "bronze" | "silver" | "gold",
      issued_at: b.issued_at,
    }))
  );
  const { error: badgesError } = await supabase.from("sbt_badges").insert(badges);
  if (badgesError) console.error("Badges error:", badgesError.message);
  else console.log(`[OK] SBT Badges seeded (${badges.length} rows)`);

  // 3. Task Requests
  const { error: requestsError } = await supabase.from("task_requests").insert(
    requests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      budget: r.budget,
      deadline: r.deadline,
      status: r.status,
      requester_id: r.requester_id,
      assigned_user_id: r.assigned_user_id,
      created_at: r.created_at,
    }))
  );
  if (requestsError) console.error("Requests error:", requestsError.message);
  else console.log(`[OK] Task Requests seeded (${requests.length} rows)`);

  // 4. Proposals
  const { error: proposalsError } = await supabase.from("proposals").insert(
    proposals.map((p) => ({
      id: p.id,
      request_id: p.request_id,
      user_id: p.user_id,
      price: p.price,
      estimated_days: p.estimated_days,
      message: p.message,
      status: p.status,
      created_at: p.created_at,
    }))
  );
  if (proposalsError) console.error("Proposals error:", proposalsError.message);
  else console.log(`[OK] Proposals seeded (${proposals.length} rows)`);

  // 5. Rounds (without selected_topic_id to avoid circular FK)
  const { error: roundsError } = await supabase.from("rounds").insert(
    rounds.map((r) => ({
      id: r.id,
      round_number: r.round_number,
      prize: r.prize,
      status: r.status,
      winner_id: r.winner_id,
      created_at: r.created_at,
    }))
  );
  if (roundsError) console.error("Rounds error:", roundsError.message);
  else console.log(`[OK] Rounds seeded (${rounds.length} rows)`);

  // 6. Topics
  const { error: topicsError } = await supabase.from("topics").insert(topics);
  if (topicsError) console.error("Topics error:", topicsError.message);
  else console.log(`[OK] Topics seeded (${topics.length} rows)`);

  // 6b. Update rounds with selected_topic_id
  for (const r of rounds) {
    if (r.selected_topic_id) {
      const { error } = await supabase
        .from("rounds")
        .update({ selected_topic_id: r.selected_topic_id })
        .eq("id", r.id);
      if (error) console.error(`Round ${r.id} topic update error:`, error.message);
    }
  }
  console.log("[OK] Rounds selected_topic_id updated");

  // 7. Arena Entries
  const { error: entriesError } = await supabase.from("arena_entries").insert(arenaEntries);
  if (entriesError) console.error("Entries error:", entriesError.message);
  else console.log(`[OK] Arena Entries seeded (${arenaEntries.length} rows)`);

  // 8. Escrow Deals
  const { error: escrowsError } = await supabase.from("escrow_deals").insert(escrows);
  if (escrowsError) console.error("Escrows error:", escrowsError.message);
  else console.log(`[OK] Escrow Deals seeded (${escrows.length} rows)`);

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
