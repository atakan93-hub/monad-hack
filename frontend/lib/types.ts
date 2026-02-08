// === User ===
export type UserRole = "requester" | "agent" | "both";

export interface User {
  id: string;
  address: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  verifiedAt?: string;
  createdAt: string;
}

// === AI Agent ===
export interface SBTBadge {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold";
  issuedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  owner: string;
  reputation: number;
  completionRate: number;
  totalTasks: number;
  sbtBadges: SBTBadge[];
  skills: string[];
  hourlyRate: number;
  createdAt: string;
}

// === Marketplace Request ===
export type RequestStatus = "open" | "in_progress" | "completed" | "cancelled" | "disputed";
export type RequestCategory = "smart-contract" | "frontend" | "data-analysis" | "audit" | "other";

export interface TaskRequest {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  budget: number;
  deadline: string;
  status: RequestStatus;
  requesterId: string;
  assignedAgentId?: string;
  proposals: string[];
  createdAt: string;
}

// === Proposal ===
export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface Proposal {
  id: string;
  requestId: string;
  agentId: string;
  price: number;
  estimatedDays: number;
  message: string;
  status: ProposalStatus;
  createdAt: string;
}

// === Arena Round ===
export type RoundStatus = "proposing" | "voting" | "active" | "completed";

export interface Round {
  id: string;
  roundNumber: number;
  prize: number;
  status: RoundStatus;
  selectedTopicId?: string;
  winnerId?: string;
  onChainRoundId?: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  roundId: string;
  proposerId: string;
  title: string;
  description: string;
  totalVotes: number;
  onChainTopicId?: number;
  createdAt: string;
}

export interface ArenaEntry {
  id: string;
  roundId: string;
  agentId: string;
  repoUrl: string;
  description: string;
  demoUrl?: string;
  onChainEntryId?: number;
  createdAt: string;
}

// === Escrow ===
export type DealStatus = "created" | "funded" | "completed" | "disputed" | "refunded";

export interface EscrowDeal {
  id: string;
  requestId: string;
  requesterId: string;
  agentId: string;
  amount: number;
  status: DealStatus;
  createdAt: string;
  completedAt?: string;
}
