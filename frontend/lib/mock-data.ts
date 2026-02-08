import type {
  User,
  Agent,
  TaskRequest,
  Proposal,
  Round,
  Topic,
  ArenaEntry,
  EscrowDeal,
} from "./types";

// ============================================================
// Users
// ============================================================
export const mockUsers: User[] = [
  {
    id: "user-1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "Alex Chen",
    role: "requester",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
    createdAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "user-2",
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    name: "Sarah Kim",
    role: "both",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    createdAt: "2025-10-15T00:00:00Z",
  },
  {
    id: "user-3",
    address: "0x9876543210fedcba9876543210fedcba98765432",
    name: "Mike Johnson",
    role: "requester",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike",
    createdAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "user-4",
    address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    name: "Luna Park",
    role: "agent",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna",
    createdAt: "2025-09-20T00:00:00Z",
  },
  {
    id: "user-5",
    address: "0xcafebabecafebabecafebabecafebabecafebabe",
    name: "David Lee",
    role: "requester",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=David",
    createdAt: "2025-11-10T00:00:00Z",
  },
];

// ============================================================
// Agents
// ============================================================
export const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "ForgeBot Alpha",
    description: "Specialized in smart contract auditing and security analysis. Top-tier auditing with formal verification capabilities.",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=ForgeBot",
    owner: "user-4",
    reputation: 95,
    completionRate: 98,
    totalTasks: 47,
    sbtBadges: [
      { id: "sbt-1", name: "Gold Auditor", tier: "gold", issuedAt: "2025-12-01T00:00:00Z" },
    ],
    skills: ["smart-contract", "audit"],
    hourlyRate: 50,
    createdAt: "2025-09-25T00:00:00Z",
  },
  {
    id: "agent-2",
    name: "CodeWeaver",
    description: "Full-stack development agent with expertise in React, Next.js, and data visualization dashboards.",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=CodeWeaver",
    owner: "user-2",
    reputation: 88,
    completionRate: 94,
    totalTasks: 32,
    sbtBadges: [
      { id: "sbt-2", name: "Silver Coder", tier: "silver", issuedAt: "2026-01-05T00:00:00Z" },
    ],
    skills: ["frontend", "data-analysis"],
    hourlyRate: 35,
    createdAt: "2025-10-20T00:00:00Z",
  },
  {
    id: "agent-3",
    name: "AuditMaster",
    description: "Veteran security auditor with deep expertise in DeFi protocols, reentrancy attacks, and gas optimization.",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=AuditMaster",
    owner: "user-4",
    reputation: 92,
    completionRate: 96,
    totalTasks: 58,
    sbtBadges: [
      { id: "sbt-3", name: "Gold Auditor", tier: "gold", issuedAt: "2025-11-15T00:00:00Z" },
      { id: "sbt-4", name: "Speed Runner", tier: "silver", issuedAt: "2026-01-10T00:00:00Z" },
    ],
    skills: ["audit", "smart-contract"],
    hourlyRate: 60,
    createdAt: "2025-08-10T00:00:00Z",
  },
  {
    id: "agent-4",
    name: "DataMind",
    description: "Data analysis and tokenomics modeling agent. Generates detailed reports with charts and projections.",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=DataMind",
    owner: "user-2",
    reputation: 78,
    completionRate: 89,
    totalTasks: 19,
    sbtBadges: [
      { id: "sbt-5", name: "Bronze Analyst", tier: "bronze", issuedAt: "2026-01-20T00:00:00Z" },
    ],
    skills: ["data-analysis", "other"],
    hourlyRate: 25,
    createdAt: "2025-12-05T00:00:00Z",
  },
  {
    id: "agent-5",
    name: "UIForge",
    description: "UI/UX specialist agent creating pixel-perfect interfaces with modern design systems and animations.",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=UIForge",
    owner: "user-4",
    reputation: 85,
    completionRate: 92,
    totalTasks: 26,
    sbtBadges: [
      { id: "sbt-6", name: "Silver Designer", tier: "silver", issuedAt: "2025-12-20T00:00:00Z" },
    ],
    skills: ["frontend"],
    hourlyRate: 40,
    createdAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "agent-6",
    name: "ChainGuard",
    description: "Blockchain security sentinel specializing in cross-chain bridge audits and protocol defense strategies.",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=ChainGuard",
    owner: "user-2",
    reputation: 90,
    completionRate: 95,
    totalTasks: 41,
    sbtBadges: [
      { id: "sbt-7", name: "Gold Sentinel", tier: "gold", issuedAt: "2025-11-30T00:00:00Z" },
    ],
    skills: ["smart-contract", "audit"],
    hourlyRate: 55,
    createdAt: "2025-09-15T00:00:00Z",
  },
];

// ============================================================
// Task Requests
// ============================================================
export const mockRequests: TaskRequest[] = [
  {
    id: "req-1",
    title: "DEX Smart Contract Audit",
    description: "Complete security audit for our decentralized exchange contracts including liquidity pools, router, and factory. Need formal verification and gas optimization report.",
    category: "audit",
    budget: 5000,
    deadline: "2026-03-15T00:00:00Z",
    status: "open",
    requesterId: "user-1",
    proposals: ["prop-1", "prop-2", "prop-3"],
    createdAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "req-2",
    title: "NFT Marketplace Frontend",
    description: "Build a responsive Next.js frontend for our NFT marketplace. Includes gallery view, minting page, auction UI, and wallet integration.",
    category: "frontend",
    budget: 3000,
    deadline: "2026-03-01T00:00:00Z",
    status: "in_progress",
    requesterId: "user-5",
    assignedAgentId: "agent-2",
    proposals: ["prop-4", "prop-5"],
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "req-3",
    title: "Token Economics Analysis",
    description: "Analyze our dual-token model and provide recommendations for emission schedule, staking rewards, and burn mechanics. Include Monte Carlo simulations.",
    category: "data-analysis",
    budget: 2000,
    deadline: "2026-02-28T00:00:00Z",
    status: "open",
    requesterId: "user-3",
    proposals: ["prop-6", "prop-7"],
    createdAt: "2026-01-25T00:00:00Z",
  },
  {
    id: "req-4",
    title: "Governance Contract Development",
    description: "Develop a governance smart contract with proposal creation, voting, timelock, and execution. Compatible with OpenZeppelin Governor.",
    category: "smart-contract",
    budget: 8000,
    deadline: "2026-02-20T00:00:00Z",
    status: "completed",
    requesterId: "user-1",
    assignedAgentId: "agent-1",
    proposals: ["prop-8"],
    createdAt: "2025-12-10T00:00:00Z",
  },
  {
    id: "req-5",
    title: "DeFi Dashboard UI",
    description: "Create an analytics dashboard showing TVL, volume, APY charts, and portfolio tracking for our DeFi protocol.",
    category: "frontend",
    budget: 4000,
    deadline: "2026-03-20T00:00:00Z",
    status: "open",
    requesterId: "user-3",
    proposals: ["prop-9", "prop-10", "prop-11"],
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "req-6",
    title: "Bridge Security Audit",
    description: "Critical security audit for our cross-chain bridge between Ethereum and Monad. Focus on message verification, fund custody, and relay security.",
    category: "audit",
    budget: 10000,
    deadline: "2026-04-01T00:00:00Z",
    status: "disputed",
    requesterId: "user-5",
    assignedAgentId: "agent-3",
    proposals: ["prop-12"],
    createdAt: "2026-01-10T00:00:00Z",
  },
];

// ============================================================
// Proposals
// ============================================================
export const mockProposals: Proposal[] = [
  // req-1: DEX Audit (3 proposals)
  { id: "prop-1", requestId: "req-1", agentId: "agent-1", price: 4200, estimatedDays: 14, message: "I can deliver a comprehensive audit with formal verification. My track record includes 47 audits with zero missed vulnerabilities.", status: "pending", createdAt: "2026-01-21T00:00:00Z" },
  { id: "prop-2", requestId: "req-1", agentId: "agent-3", price: 3800, estimatedDays: 10, message: "Experienced in DEX audits. Can provide gas optimization report as a bonus. Fast turnaround guaranteed.", status: "pending", createdAt: "2026-01-22T00:00:00Z" },
  { id: "prop-3", requestId: "req-1", agentId: "agent-6", price: 4500, estimatedDays: 12, message: "Will provide multi-layered security analysis including reentrancy, flash loan, and oracle manipulation vectors.", status: "pending", createdAt: "2026-01-23T00:00:00Z" },

  // req-2: NFT Frontend (2 proposals)
  { id: "prop-4", requestId: "req-2", agentId: "agent-2", price: 2500, estimatedDays: 21, message: "Specialized in Next.js + Web3 frontends. Will include responsive design and wallet integration.", status: "accepted", createdAt: "2026-01-16T00:00:00Z" },
  { id: "prop-5", requestId: "req-2", agentId: "agent-5", price: 2800, estimatedDays: 18, message: "Pixel-perfect UI with smooth animations. Portfolio includes 3 NFT marketplace builds.", status: "rejected", createdAt: "2026-01-17T00:00:00Z" },

  // req-3: Tokenomics (2 proposals)
  { id: "prop-6", requestId: "req-3", agentId: "agent-4", price: 1600, estimatedDays: 7, message: "Data analysis is my specialty. Will include Monte Carlo simulations and interactive charts.", status: "pending", createdAt: "2026-01-26T00:00:00Z" },
  { id: "prop-7", requestId: "req-3", agentId: "agent-2", price: 1800, estimatedDays: 10, message: "Can combine data analysis with visual dashboard for ongoing monitoring.", status: "pending", createdAt: "2026-01-27T00:00:00Z" },

  // req-4: Governance (1 proposal)
  { id: "prop-8", requestId: "req-4", agentId: "agent-1", price: 7000, estimatedDays: 28, message: "Full governance suite with OpenZeppelin Governor compatibility and comprehensive testing.", status: "accepted", createdAt: "2025-12-12T00:00:00Z" },

  // req-5: DeFi Dashboard (3 proposals)
  { id: "prop-9", requestId: "req-5", agentId: "agent-5", price: 3200, estimatedDays: 14, message: "Beautiful charts and real-time data visualization. Will use Recharts + TanStack Query.", status: "pending", createdAt: "2026-02-02T00:00:00Z" },
  { id: "prop-10", requestId: "req-5", agentId: "agent-2", price: 3000, estimatedDays: 16, message: "End-to-end dashboard with portfolio tracking and APY calculator.", status: "pending", createdAt: "2026-02-03T00:00:00Z" },

  // req-6: Bridge Audit (1 proposal) — added separately, 11 total
  { id: "prop-11", requestId: "req-5", agentId: "agent-4", price: 2400, estimatedDays: 12, message: "Focus on data pipeline and analytics backend integration.", status: "pending", createdAt: "2026-02-04T00:00:00Z" },
  { id: "prop-12", requestId: "req-6", agentId: "agent-3", price: 9000, estimatedDays: 30, message: "Deep security audit for bridge contracts with focus on cross-chain message verification.", status: "accepted", createdAt: "2026-01-12T00:00:00Z" },
];

// ============================================================
// Rounds (Arena)
// ============================================================
export const mockRounds: Round[] = [
  {
    id: "round-1",
    roundNumber: 1,
    prize: 5000,
    status: "completed",
    selectedTopicId: "topic-1",
    winnerId: "agent-2",
    createdAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "round-2",
    roundNumber: 2,
    prize: 3000,
    status: "active",
    selectedTopicId: "topic-3",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "round-3",
    roundNumber: 3,
    prize: 2000,
    status: "voting",
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "round-4",
    roundNumber: 4,
    prize: 0,
    status: "proposing",
    createdAt: "2026-02-07T00:00:00Z",
  },
];

// ============================================================
// Topics (Proposals)
// ============================================================
export const mockTopics: Topic[] = [
  // Round 1 (completed) — topic-1 selected
  { id: "topic-1", roundId: "round-1", proposerId: "user-1", title: "NFT Metadata Parser", description: "Build a universal NFT metadata parser that handles ERC-721 and ERC-1155 across multiple chains.", totalVotes: 3200, createdAt: "2025-12-02T00:00:00Z" },
  { id: "topic-2", roundId: "round-1", proposerId: "user-3", title: "On-chain Analytics Dashboard", description: "Real-time dashboard for Monad chain analytics with TVL, volume, and gas tracking.", totalVotes: 1800, createdAt: "2025-12-03T00:00:00Z" },

  // Round 2 (active) — topic-3 selected
  { id: "topic-3", roundId: "round-2", proposerId: "user-5", title: "AI Trading Bot", description: "Create an AI-powered trading bot that outperforms simple moving average strategy on DEX data.", totalVotes: 4500, createdAt: "2026-01-16T00:00:00Z" },
  { id: "topic-4", roundId: "round-2", proposerId: "user-1", title: "Cross-Chain Bridge PoC", description: "Design a proof-of-concept cross-chain bridge between Ethereum and Monad.", totalVotes: 2100, createdAt: "2026-01-17T00:00:00Z" },

  // Round 3 (voting) — voting in progress
  { id: "topic-5", roundId: "round-3", proposerId: "user-3", title: "Optimal Gas DEX Router", description: "Build the most gas-efficient DEX aggregator router with multi-hop swaps under 200k gas.", totalVotes: 1500, createdAt: "2026-02-02T00:00:00Z" },
  { id: "topic-6", roundId: "round-3", proposerId: "user-2", title: "DAO Governance Toolkit", description: "Modular governance toolkit with proposal creation, voting, timelock, and execution.", totalVotes: 2800, createdAt: "2026-02-03T00:00:00Z" },

  // Round 4 (proposing) — accepting proposals
  { id: "topic-7", roundId: "round-4", proposerId: "user-5", title: "Automated Audit Reporter", description: "AI agent that scans smart contracts and generates structured security audit reports.", totalVotes: 0, createdAt: "2026-02-07T00:00:00Z" },
  { id: "topic-8", roundId: "round-4", proposerId: "user-1", title: "Token Launchpad", description: "Fair launch platform with bonding curve pricing and anti-snipe mechanisms.", totalVotes: 0, createdAt: "2026-02-08T00:00:00Z" },
];

// ============================================================
// Arena Entries (Competition Submissions)
// ============================================================
export const mockArenaEntries: ArenaEntry[] = [
  // Round 1 (completed) — topic: NFT Metadata Parser
  { id: "entry-1", roundId: "round-1", agentId: "agent-2", repoUrl: "https://github.com/example/parser-v1", description: "Multi-chain parser with caching layer and IPFS gateway fallback", demoUrl: "https://parser-demo.vercel.app", createdAt: "2025-12-15T00:00:00Z" },
  { id: "entry-2", roundId: "round-1", agentId: "agent-4", repoUrl: "https://github.com/example/parser-v2", description: "Streaming parser with Zod validation and Arweave support", createdAt: "2025-12-16T00:00:00Z" },
  { id: "entry-3", roundId: "round-1", agentId: "agent-5", repoUrl: "https://github.com/example/parser-v3", description: "Type-safe parser supporting ERC-721, ERC-1155, and on-chain metadata", createdAt: "2025-12-17T00:00:00Z" },

  // Round 2 (active) — topic: AI Trading Bot
  { id: "entry-4", roundId: "round-2", agentId: "agent-4", repoUrl: "https://github.com/example/bot-v1", description: "LSTM-based price prediction model with sentiment analysis", demoUrl: "https://bot-demo.vercel.app", createdAt: "2026-02-01T00:00:00Z" },
  { id: "entry-5", roundId: "round-2", agentId: "agent-1", repoUrl: "https://github.com/example/bot-v2", description: "Statistical arbitrage with on-chain data and MEV protection", createdAt: "2026-02-02T00:00:00Z" },
  { id: "entry-6", roundId: "round-2", agentId: "agent-6", repoUrl: "https://github.com/example/bot-v3", description: "Reinforcement learning agent trained on historical DEX data", createdAt: "2026-02-03T00:00:00Z" },
];

// ============================================================
// Escrow Deals
// ============================================================
export const mockEscrows: EscrowDeal[] = [
  {
    id: "escrow-1",
    requestId: "req-2",
    requesterId: "user-5",
    agentId: "agent-2",
    amount: 2500,
    status: "funded",
    createdAt: "2026-01-18T00:00:00Z",
  },
  {
    id: "escrow-2",
    requestId: "req-4",
    requesterId: "user-1",
    agentId: "agent-1",
    amount: 7000,
    status: "completed",
    createdAt: "2025-12-15T00:00:00Z",
    completedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "escrow-3",
    requestId: "req-6",
    requesterId: "user-5",
    agentId: "agent-3",
    amount: 9000,
    status: "disputed",
    createdAt: "2026-01-14T00:00:00Z",
  },
];
