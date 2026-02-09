import { supabase } from "./supabase";
import type {
  TaskRequest,
  Proposal,
  Round,
  Topic,
  ArenaEntry,
  EscrowDeal,
  User,
  RequestStatus,
  RequestCategory,
  ProposalStatus,
  RoundStatus,
  DealStatus,
  SBTBadge,
} from "./types";

// ============================================================
// Row types (Supabase snake_case)
// ============================================================
interface UserRow { id: string; address: string; name: string; role: string; avatar_url: string | null; description: string; reputation: number; completion_rate: number; total_tasks: number; skills: string[]; hourly_rate: number; created_at: string; }
interface BadgeRow { id: string; user_id: string; name: string; tier: string; issued_at: string; }
interface RequestRow { id: string; title: string; description: string; category: string; budget: number; deadline: string; status: string; requester_id: string; assigned_user_id: string | null; created_at: string; }
interface ProposalRow { id: string; request_id: string; user_id: string; price: number; estimated_days: number; message: string; status: string; created_at: string; }
interface RoundRow { id: string; round_number: number; prize: number; status: string; selected_topic_id: string | null; winner_id: string | null; on_chain_round_id: number | null; created_at: string; }
interface TopicRow { id: string; round_id: string; proposer_id: string; title: string; description: string; total_votes: number; on_chain_topic_id: number | null; created_at: string; }
interface EntryRow { id: string; round_id: string; user_id: string; repo_url: string; description: string; demo_url: string | null; on_chain_entry_id: number | null; created_at: string; }
interface EscrowRow { id: string; request_id: string; requester_id: string; user_id: string; amount: number; status: string; on_chain_deal_id: number | null; created_at: string; completed_at: string | null; }

// ============================================================
// Helpers: DB row → app type (snake_case → camelCase)
// ============================================================

function toUser(row: UserRow, badges: SBTBadge[] = []): User {
  return {
    id: row.id,
    address: row.address,
    name: row.name,
    role: row.role as User["role"],
    avatarUrl: row.avatar_url ?? undefined,
    description: row.description,
    reputation: row.reputation,
    completionRate: row.completion_rate,
    totalTasks: row.total_tasks,
    sbtBadges: badges,
    skills: row.skills ?? [],
    hourlyRate: Number(row.hourly_rate),
    createdAt: row.created_at,
  };
}

function toBadge(row: BadgeRow): SBTBadge {
  return {
    id: row.id,
    name: row.name,
    tier: row.tier as SBTBadge["tier"],
    issuedAt: row.issued_at,
  };
}

function toRequest(row: RequestRow, proposalIds: string[]): TaskRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as TaskRequest["category"],
    budget: Number(row.budget),
    deadline: row.deadline,
    status: row.status as TaskRequest["status"],
    requesterId: row.requester_id,
    assignedUserId: row.assigned_user_id ?? undefined,
    proposals: proposalIds,
    createdAt: row.created_at,
  };
}

function toProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    requestId: row.request_id,
    userId: row.user_id,
    price: Number(row.price),
    estimatedDays: row.estimated_days,
    message: row.message,
    status: row.status as Proposal["status"],
    createdAt: row.created_at,
  };
}

function toRound(row: RoundRow): Round {
  return {
    id: row.id,
    roundNumber: row.round_number,
    prize: Number(row.prize),
    status: row.status as Round["status"],
    selectedTopicId: row.selected_topic_id ?? undefined,
    winnerId: row.winner_id ?? undefined,
    onChainRoundId: row.on_chain_round_id ?? undefined,
    createdAt: row.created_at,
  };
}

function toTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    roundId: row.round_id,
    proposerId: row.proposer_id,
    title: row.title,
    description: row.description,
    totalVotes: row.total_votes,
    onChainTopicId: row.on_chain_topic_id ?? undefined,
    createdAt: row.created_at,
  };
}

function toEntry(row: EntryRow): ArenaEntry {
  return {
    id: row.id,
    roundId: row.round_id,
    userId: row.user_id,
    repoUrl: row.repo_url,
    description: row.description,
    demoUrl: row.demo_url ?? undefined,
    onChainEntryId: row.on_chain_entry_id ?? undefined,
    createdAt: row.created_at,
  };
}

function toEscrow(row: EscrowRow): EscrowDeal {
  return {
    id: row.id,
    requestId: row.request_id,
    requesterId: row.requester_id,
    userId: row.user_id,
    amount: row.amount,
    status: row.status as EscrowDeal["status"],
    onChainDealId: row.on_chain_deal_id ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

// ============================================================
// Users
// ============================================================

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = data.map((u) => u.id);
  const { data: badgeRows, error: badgeError } = await supabase
    .from("sbt_badges")
    .select("*")
    .in("user_id", userIds);
  if (badgeError) throw badgeError;

  const badgesByUser = new Map<string, SBTBadge[]>();
  for (const b of badgeRows ?? []) {
    const list = badgesByUser.get(b.user_id) ?? [];
    list.push(toBadge(b));
    badgesByUser.set(b.user_id, list);
  }

  return data.map((row) => toUser(row, badgesByUser.get(row.id) ?? []));
}

export async function getUserByAddress(address: string): Promise<User | null> {
  const { data: row, error } = await supabase
    .from("users")
    .select("*")
    .eq("address", address)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: badgeRows, error: badgeError } = await supabase
    .from("sbt_badges")
    .select("*")
    .eq("user_id", row.id);
  if (badgeError) throw badgeError;

  return toUser(row, (badgeRows ?? []).map(toBadge));
}

export async function getUserById(id: string): Promise<User | null> {
  const { data: row, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: badgeRows, error: badgeError } = await supabase
    .from("sbt_badges")
    .select("*")
    .eq("user_id", id);
  if (badgeError) throw badgeError;

  return toUser(row, (badgeRows ?? []).map(toBadge));
}

// ============================================================
// Requests
// ============================================================

export async function getRequests(filters?: {
  status?: RequestStatus;
  category?: RequestCategory;
}): Promise<TaskRequest[]> {
  let query = supabase
    .from("task_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category", filters.category);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const requestIds = data.map((r) => r.id);
  const { data: proposalRows, error: propError } = await supabase
    .from("proposals")
    .select("id, request_id")
    .in("request_id", requestIds);
  if (propError) throw propError;

  const proposalsByRequest = new Map<string, string[]>();
  for (const p of proposalRows ?? []) {
    const list = proposalsByRequest.get(p.request_id) ?? [];
    list.push(p.id);
    proposalsByRequest.set(p.request_id, list);
  }

  return data.map((row) => toRequest(row, proposalsByRequest.get(row.id) ?? []));
}

export async function getRequestById(id: string): Promise<TaskRequest | null> {
  const { data: row, error } = await supabase
    .from("task_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: proposalRows, error: propError } = await supabase
    .from("proposals")
    .select("id")
    .eq("request_id", id);
  if (propError) throw propError;

  return toRequest(row, (proposalRows ?? []).map((p) => p.id));
}

export async function createRequest(
  data: Omit<TaskRequest, "id" | "createdAt" | "proposals" | "status">
): Promise<TaskRequest> {
  const { data: row, error } = await supabase
    .from("task_requests")
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      deadline: data.deadline,
      requester_id: data.requesterId,
      assigned_user_id: data.assignedUserId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toRequest(row, []);
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<TaskRequest> {
  const { data: row, error } = await supabase
    .from("task_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  const { data: proposalRows, error: propError } = await supabase
    .from("proposals")
    .select("id")
    .eq("request_id", id);
  if (propError) throw propError;

  return toRequest(row, (proposalRows ?? []).map((p) => p.id));
}

// ============================================================
// Proposals
// ============================================================

export async function getProposalsByRequest(requestId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toProposal);
}

export async function getProposalsByUser(userId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toProposal);
}

export async function submitProposal(
  data: Omit<Proposal, "id" | "createdAt" | "status">
): Promise<Proposal> {
  const { data: row, error } = await supabase
    .from("proposals")
    .insert({
      request_id: data.requestId,
      user_id: data.userId,
      price: data.price,
      estimated_days: data.estimatedDays,
      message: data.message,
    })
    .select()
    .single();
  if (error) throw error;
  return toProposal(row);
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus
): Promise<Proposal> {
  const { data: row, error } = await supabase
    .from("proposals")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toProposal(row);
}

// ============================================================
// Rounds
// ============================================================

export async function getRounds(filter?: {
  status?: RoundStatus;
}): Promise<Round[]> {
  let query = supabase
    .from("rounds")
    .select("*")
    .order("round_number", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toRound);
}

export async function getRoundById(id: string): Promise<Round | null> {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toRound(data) : null;
}

export async function createRoundRecord(
  data: { roundNumber: number; prize: number }
): Promise<Round> {
  const { data: row, error } = await supabase
    .from("rounds")
    .insert({
      round_number: data.roundNumber,
      prize: data.prize,
      status: "proposing",
    })
    .select()
    .single();
  if (error) throw error;
  return toRound(row);
}

export async function updateRoundStatus(
  id: string,
  status: RoundStatus
): Promise<Round> {
  const { data: row, error } = await supabase
    .from("rounds")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toRound(row);
}

export async function updateRoundWinner(
  id: string,
  winnerId: string
): Promise<Round> {
  const { data: row, error } = await supabase
    .from("rounds")
    .update({ status: "completed", winner_id: winnerId })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toRound(row);
}

// ============================================================
// Topics
// ============================================================

export async function getTopicsByRound(roundId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("round_id", roundId)
    .order("total_votes", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTopic);
}

export async function proposeTopic(
  data: Omit<Topic, "id" | "createdAt" | "totalVotes">
): Promise<Topic> {
  const { data: row, error } = await supabase
    .from("topics")
    .insert({
      round_id: data.roundId,
      proposer_id: data.proposerId,
      title: data.title,
      description: data.description,
    })
    .select()
    .single();
  if (error) throw error;
  return toTopic(row);
}

export async function voteForTopic(
  topicId: string,
  voterWeight: number
): Promise<Topic> {
  const { error: rpcError } = await supabase.rpc("increment_votes", {
    topic_id: topicId,
    weight: voterWeight,
  });
  if (rpcError) throw rpcError;

  const { data: row, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();
  if (error) throw error;
  return toTopic(row);
}

// ============================================================
// Arena Entries
// ============================================================

export async function getEntriesByRound(roundId: string): Promise<ArenaEntry[]> {
  const { data, error } = await supabase
    .from("arena_entries")
    .select("*")
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toEntry);
}

export async function submitEntry(
  data: Omit<ArenaEntry, "id" | "createdAt">
): Promise<ArenaEntry> {
  const { data: row, error } = await supabase
    .from("arena_entries")
    .insert({
      round_id: data.roundId,
      user_id: data.userId,
      repo_url: data.repoUrl,
      description: data.description,
      demo_url: data.demoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toEntry(row);
}

// ============================================================
// Escrow
// ============================================================

export async function getEscrowsByUser(userId: string): Promise<EscrowDeal[]> {
  const { data, error } = await supabase
    .from("escrow_deals")
    .select("*")
    .or(`requester_id.eq.${userId},user_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toEscrow);
}

export async function createEscrow(
  data: Omit<EscrowDeal, "id" | "createdAt" | "status">
): Promise<EscrowDeal> {
  const { data: row, error } = await supabase
    .from("escrow_deals")
    .insert({
      request_id: data.requestId,
      requester_id: data.requesterId,
      user_id: data.userId,
      amount: data.amount,
    })
    .select()
    .single();
  if (error) throw error;
  return toEscrow(row);
}

export async function updateEscrowStatus(
  id: string,
  status: DealStatus
): Promise<EscrowDeal> {
  const updateData: { status: DealStatus; completed_at?: string } = { status };
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: row, error } = await supabase
    .from("escrow_deals")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toEscrow(row);
}

// ============================================================
// Dashboard
// ============================================================

export async function getDashboardStats(userId: string): Promise<{
  totalRequests: number;
  activeRequests: number;
  totalProposals: number;
  totalSpent: number;
}> {
  const { data: userRequests, error: reqError } = await supabase
    .from("task_requests")
    .select("id, status")
    .eq("requester_id", userId);
  if (reqError) throw reqError;

  const requestIds = (userRequests ?? []).map((r) => r.id);

  let totalProposals = 0;
  if (requestIds.length > 0) {
    const { count, error: propCountError } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .in("request_id", requestIds);
    if (propCountError) throw propCountError;
    totalProposals = count ?? 0;
  }

  const { data: completedEscrows, error: escrowError } = await supabase
    .from("escrow_deals")
    .select("amount")
    .eq("requester_id", userId)
    .eq("status", "completed");
  if (escrowError) throw escrowError;

  const totalSpent = (completedEscrows ?? []).reduce((sum, e) => sum + e.amount, 0);

  return {
    totalRequests: (userRequests ?? []).length,
    activeRequests: (userRequests ?? []).filter(
      (r) => r.status === "in_progress" || r.status === "open"
    ).length,
    totalProposals,
    totalSpent,
  };
}
