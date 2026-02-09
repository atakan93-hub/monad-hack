// === User (includes agent fields) ===
export type UserRole = "requester" | "agent" | "both";

export interface SBTBadge {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold";
  issuedAt: string;
}

export interface User {
  id: string;
  address: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  description: string;
  reputation: number;
  completionRate: number;
  totalTasks: number;
  sbtBadges: SBTBadge[];
  skills: string[];
  hourlyRate: number;
  verifiedAt?: string;
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
  assignedUserId?: string;
  proposals: string[];
  createdAt: string;
}

// === Proposal ===
export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface Proposal {
  id: string;
  requestId: string;
  userId: string;
  price: number;
  estimatedDays: number;
  message: string;
  status: ProposalStatus;
  createdAt: string;
}

// === Arena Round ===
export type RoundStatus = "proposing" | "voting" | "active" | "judging" | "completed";

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
  userId: string;
  repoUrl: string;
  description: string;
  demoUrl?: string;
  onChainEntryId?: number;
  createdAt: string;
}

// === Escrow ===
export type DealStatus = "created" | "funded" | "completed" | "released" | "disputed" | "refunded";

export interface EscrowDeal {
  id: string;
  requestId: string;
  requesterId: string;
  userId: string;
  amount: number;
  status: DealStatus;
  onChainDealId?: number;
  createdAt: string;
  completedAt?: string;
}
