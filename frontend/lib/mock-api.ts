import type {
  TaskRequest,
  Proposal,
  Agent,
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
} from "./types";

import {
  mockUsers as _users,
  mockAgents as _agents,
  mockRequests as _requests,
  mockProposals as _proposals,
  mockRounds as _rounds,
  mockTopics as _topics,
  mockArenaEntries as _entries,
  mockEscrows as _escrows,
} from "./mock-data";

// Mutable local copies
const users = [..._users];
const agents = [..._agents];
let requests = [..._requests];
let proposals = [..._proposals];
const rounds = [..._rounds];
let topics = [..._topics];
let arenaEntries = [..._entries];
let escrows = [..._escrows];

const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================
// Users
// ============================================================
export async function getUsers(): Promise<User[]> {
  await delay();
  return [...users];
}

export async function getUserById(id: string): Promise<User | null> {
  await delay();
  return users.find((u) => u.id === id) ?? null;
}

// ============================================================
// Agents
// ============================================================
export async function getAgents(): Promise<Agent[]> {
  await delay();
  return [...agents];
}

export async function getAgentById(id: string): Promise<Agent | null> {
  await delay();
  return agents.find((a) => a.id === id) ?? null;
}

// ============================================================
// Requests
// ============================================================
export async function getRequests(filters?: {
  status?: RequestStatus;
  category?: RequestCategory;
}): Promise<TaskRequest[]> {
  await delay();
  let result = [...requests];
  if (filters?.status) result = result.filter((r) => r.status === filters.status);
  if (filters?.category) result = result.filter((r) => r.category === filters.category);
  return result;
}

export async function getRequestById(id: string): Promise<TaskRequest | null> {
  await delay();
  return requests.find((r) => r.id === id) ?? null;
}

export async function createRequest(
  data: Omit<TaskRequest, "id" | "createdAt" | "proposals" | "status">
): Promise<TaskRequest> {
  await delay(300);
  const newRequest: TaskRequest = {
    ...data,
    id: `req-${Date.now()}`,
    status: "open",
    proposals: [],
    createdAt: new Date().toISOString(),
  };
  requests = [...requests, newRequest];
  return newRequest;
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<TaskRequest> {
  await delay();
  requests = requests.map((r) => (r.id === id ? { ...r, status } : r));
  const updated = requests.find((r) => r.id === id);
  if (!updated) throw new Error(`Request ${id} not found`);
  return updated;
}

// ============================================================
// Proposals
// ============================================================
export async function getProposalsByRequest(requestId: string): Promise<Proposal[]> {
  await delay();
  return proposals.filter((p) => p.requestId === requestId);
}

export async function getProposalsByAgent(agentId: string): Promise<Proposal[]> {
  await delay();
  return proposals.filter((p) => p.agentId === agentId);
}

export async function submitProposal(
  data: Omit<Proposal, "id" | "createdAt" | "status">
): Promise<Proposal> {
  await delay(300);
  const newProposal: Proposal = {
    ...data,
    id: `prop-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  proposals = [...proposals, newProposal];

  // Also add to the request's proposals array
  requests = requests.map((r) =>
    r.id === data.requestId
      ? { ...r, proposals: [...r.proposals, newProposal.id] }
      : r
  );

  return newProposal;
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus
): Promise<Proposal> {
  await delay();
  proposals = proposals.map((p) => (p.id === id ? { ...p, status } : p));
  const updated = proposals.find((p) => p.id === id);
  if (!updated) throw new Error(`Proposal ${id} not found`);
  return updated;
}

// ============================================================
// Rounds
// ============================================================
export async function getRounds(filter?: {
  status?: RoundStatus;
}): Promise<Round[]> {
  await delay();
  let result = [...rounds];
  if (filter?.status) result = result.filter((r) => r.status === filter.status);
  return result;
}

export async function getRoundById(id: string): Promise<Round | null> {
  await delay();
  return rounds.find((r) => r.id === id) ?? null;
}

// ============================================================
// Topics
// ============================================================
export async function getTopicsByRound(roundId: string): Promise<Topic[]> {
  await delay();
  return topics.filter((t) => t.roundId === roundId);
}

export async function proposeTopic(
  data: Omit<Topic, "id" | "createdAt" | "totalVotes">
): Promise<Topic> {
  await delay(300);
  const newTopic: Topic = {
    ...data,
    id: `topic-${Date.now()}`,
    totalVotes: 0,
    createdAt: new Date().toISOString(),
  };
  topics = [...topics, newTopic];
  return newTopic;
}

export async function voteForTopic(
  topicId: string,
  voterWeight: number
): Promise<Topic> {
  await delay(300);
  topics = topics.map((t) =>
    t.id === topicId ? { ...t, totalVotes: t.totalVotes + voterWeight } : t
  );
  const updated = topics.find((t) => t.id === topicId);
  if (!updated) throw new Error(`Topic ${topicId} not found`);
  return updated;
}

// ============================================================
// Arena Entries
// ============================================================
export async function getEntriesByRound(roundId: string): Promise<ArenaEntry[]> {
  await delay();
  return arenaEntries.filter((e) => e.roundId === roundId);
}

export async function submitEntry(
  data: Omit<ArenaEntry, "id" | "createdAt">
): Promise<ArenaEntry> {
  await delay(300);
  const newEntry: ArenaEntry = {
    ...data,
    id: `entry-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  arenaEntries = [...arenaEntries, newEntry];
  return newEntry;
}

// ============================================================
// Escrow
// ============================================================
export async function getEscrowsByUser(userId: string): Promise<EscrowDeal[]> {
  await delay();
  return escrows.filter(
    (e) => e.requesterId === userId || e.agentId === userId
  );
}

export async function createEscrow(
  data: Omit<EscrowDeal, "id" | "createdAt" | "status">
): Promise<EscrowDeal> {
  await delay(300);
  const newEscrow: EscrowDeal = {
    ...data,
    id: `escrow-${Date.now()}`,
    status: "created",
    createdAt: new Date().toISOString(),
  };
  escrows = [...escrows, newEscrow];
  return newEscrow;
}

export async function updateEscrowStatus(
  id: string,
  status: DealStatus
): Promise<EscrowDeal> {
  await delay();
  escrows = escrows.map((e) =>
    e.id === id
      ? {
          ...e,
          status,
          completedAt: status === "completed" ? new Date().toISOString() : e.completedAt,
        }
      : e
  );
  const updated = escrows.find((e) => e.id === id);
  if (!updated) throw new Error(`Escrow ${id} not found`);
  return updated;
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
  await delay();
  const userRequests = requests.filter((r) => r.requesterId === userId);
  const userEscrows = escrows.filter((e) => e.requesterId === userId);
  return {
    totalRequests: userRequests.length,
    activeRequests: userRequests.filter((r) => r.status === "in_progress" || r.status === "open").length,
    totalProposals: userRequests.reduce((sum, r) => sum + r.proposals.length, 0),
    totalSpent: userEscrows
      .filter((e) => e.status === "completed")
      .reduce((sum, e) => sum + e.amount, 0),
  };
}
