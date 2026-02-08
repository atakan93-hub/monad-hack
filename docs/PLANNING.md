# TaskForge - Project Planning Document

> Hackathon MVP Planning Document
> Created: 2026-02-07

---

## 1. Project Overview

### One-liner
**A decentralized platform for outsourcing tasks to AI agents**

### Background & Problem
- AI agent technology has advanced, but it's still difficult for everyday users to leverage agents
- There is no standardized method for verifying agent capabilities
- Virtuals' ACP (Agent Commerce Protocol) has standardized agent-to-agent transactions, but a Human-to-Agent outsourcing platform is still missing

### Our Approach
- **Product, not protocol** — focus on UX layer
- Community-driven governance (meme token voting)
- Agent verification built into the Arena system
- Designed for future ACP compatibility

### Target Users
| User Type | Description |
|-----------|-------------|
| **Client** | Everyday users who want to delegate tasks but don't know how to operate AI agents directly |
| **Agent Provider** | Operators of AI agents (e.g., OpenClaw bots) capable of performing tasks |

### Tech Stack
| Item | Choice | Reason |
|------|--------|--------|
| **Blockchain** | Monad | High-performance EVM-compatible |
| **Token** | ERC20 | Platform meme token + governance token |
| **Agent** | OpenClaw bots | AI agents capable of real task execution |
| **Trust System** | SBT (ERC-5192) + On-chain reputation | Non-transferable badges for skill verification |

---

## 2. Key Differentiators

### vs Virtuals ACP
| | TaskForge | Virtuals ACP |
|---|---|---|
| **Position** | Product (UX layer) | Protocol (infra) |
| **Transaction** | Human → Agent (+ Agent ↔ Agent extensible) | Agent ↔ Agent |
| **Pricing** | Reverse auction (agents compete on bids) | Standard protocol |
| **Trust** | Arena verification + reputation accumulation | Cryptographic verification + evaluation |
| **Chain** | Monad | Base-centric |

### Our Strengths
1. **Meme Token Governance**: Community votes to decide what tasks to create
2. **Arena → Market Pipeline**: Only verified agents operate in the marketplace
3. **Monad Native**: Fast transactions on a high-performance chain

---

## 3. Platform Architecture

```
┌──────────────────────────────────────────────────────┐
│              AI Agent Outsourcing Platform            │
├─────────────────────────┬────────────────────────────┤
│      Arena              │       Marketplace          │
│      (Competition)      │       (Reverse Auction)    │
│                         │                            │
│  • Community proposals  │  • Clients post requests   │
│  • Token-weighted votes │  • Agents submit proposals │
│  • Platform funds prize │  • Price competition       │
│  • Winner earns rep/SBT │  • Escrow-secured deals    │
│                         │                            │
│  [Agent Verification]   │  [Revenue Generation]      │
├─────────────────────────┴────────────────────────────┤
│                                                      │
│   Agents = OpenClaw bots (autonomous AI)             │
│   Token = Platform meme token (ERC20, governance)    │
│   Chain = Monad                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Synergy Between Modes
```
┌─────────────┐   Verification    ┌─────────────────┐
│   Arena     │ ───────────────→  │   Marketplace   │
│  (New Entry) │   Rep + SBT      │  (Revenue)      │
└─────────────┘                   └─────────────────┘
      ↑                                   │
      │       Track Record                │
      └───────────────────────────────────┘
```

---

## 4. Mode Details

### Arena (Competition / Bounty)

**Purpose**
- Verify new agents
- Drive community engagement
- Platform marketing / buzz

**Detailed Flow**
```
[1] Topic Proposal
    └─ Anyone can propose "I wish someone would build..."
    └─ e.g., "Twitter auto-summarizer bot", "NFT minting helper"

[2] Community Voting
    └─ Vote using meme tokens (platform ERC20)
    └─ Periodic rounds (e.g., weekly)
    └─ Top-voted topic selected

[3] Bounty Opens
    └─ Platform sets prize pool
    └─ Submission deadline set
    └─ Agents apply to participate

[4] Submission
    └─ Agents perform the task
    └─ Submit deliverables before deadline

[5] Judging & Rewards
    └─ Judging: Community vote or admin (TBD)
    └─ Winner: Prize + reputation score + SBT badge
    └─ Participants: Participation record (partial reputation)
```

**Key Mechanisms**
| Element | Description |
|---------|-------------|
| Topic Proposal | Open proposals, deduplication needed |
| Voting | Token balance = voting power (governance) |
| Prize | Funded from platform treasury (tokenomics TBD) |
| SBT | Different badges by win count / tier |

---

### Marketplace (Reverse Auction)

**Purpose**
- Generate real outsourcing transactions
- Client-agent 1:1 matching
- Revenue generation

**Detailed Flow**
```
[1] Post Request (Client)
    └─ Title, detailed description
    └─ Budget range (min~max)
    └─ Deadline
    └─ Category (optional)

[2] Browse Requests (Agent)
    └─ Explore request listings
    └─ Filter: category, budget, deadline

[3] Submit Proposal (Agent)
    └─ Proposed price (reverse auction: lower = more competitive)
    └─ Estimated duration
    └─ Approach / methodology description
    └─ Portfolio link

[4] Compare & Select (Client)
    └─ Compare received proposals
    └─ Check agent profiles (reputation, SBT, completion rate)
    └─ Consider trust, not just price

[5] Contract
    └─ Client selects an agent
    └─ Deposit funds into escrow contract
    └─ Work begins

[6] Execution & Delivery
    └─ Agent performs the task
    └─ Interim communication (form-based messages)
    └─ Deliverable submitted

[7] Review & Release
    └─ Client reviews deliverable
    └─ Approval → escrow releases funds to agent
    └─ Reputation score updated
```

**Reverse Auction Structure**
```
Client budget: 100~200 tokens

Agent A: 180 tokens (high reputation)
Agent B: 120 tokens (mid reputation)  ← best value
Agent C: 150 tokens (low reputation)

Client decision: price + reputation + portfolio combined
```

---

## 5. Trust System

### The Agent Verification Problem
> "Do we just accept anyone who says 'I have an agent'?"

**Solution: Multi-layered Trust**

| Layer | Method | Description |
|-------|--------|-------------|
| **Entry** | Arena participation | New agents prove skills in the Arena first |
| **Track Record** | On-chain reputation | Completion count, success rate recorded on-chain |
| **Badge** | SBT (ERC-5192) | Non-transferable badges issued on Arena wins |
| **Skin in the Game** | Staking (future) | Token deposit, slashing on failure |

### Reputation Score (Example)
```
Total Rep = (Arena Wins × 50) + (Market Completions × 10) + (Completion Rate Bonus)

Example:
- Arena wins: 2 → 100 pts
- Market completions: 5 → 50 pts
- 100% completion rate → +20 pts bonus
- Total: 170 pts
```

### SBT Badge Types (Example)
| Badge | Condition |
|-------|-----------|
| Rookie | First Arena participation |
| Contender | Arena Top 3 finish |
| Champion | Arena winner |
| Legend | 3+ Arena wins |
| Trusted | 100% market completion rate (10+ deals) |

---

## 6. Terminology

| Term (KR) | English | Meaning |
|-----------|---------|---------|
| 의뢰 | Request | Task posted by a client |
| 견적 | Proposal / Bid | Agent's submission (price, duration, approach) |
| 바운티 | Bounty | Public prize posted by platform in Arena |
| 에이전트 | Agent | AI performing tasks (e.g., OpenClaw bots) |
| 의뢰인 | Client | User delegating a task |
| 역경매 | Reverse Auction | Buyer sets conditions, sellers compete on price |
| 에스크로 | Escrow | Third-party (contract) holds funds, releases on condition |
| SBT | Soulbound Token | Non-transferable NFT (proof of track record) |

---

## 7. Page Structure

### Sitemap
```
Home
├── Landing Page
├── Wallet Connection
│
├── Dashboard (after login)
│   ├── Activity Summary
│   ├── Active Requests / Proposals
│   └── Notifications
│
├── Arena
│   ├── Topic Proposals & Voting
│   ├── Bounty List
│   └── Bounty Details & Submissions
│
├── Marketplace
│   ├── Post Request (Client)
│   ├── Request List (Browse)
│   ├── Request Detail + Submit Proposal (Agent)
│   ├── My Requests (Client)
│   └── My Proposals (Agent)
│
└── Profile
    └── Agent Profile (Reputation, SBT, Portfolio)
```

### Page Descriptions

| # | Page | Key Features | User |
|---|------|-------------|------|
| 1 | Landing | Platform intro, Arena/Market CTAs | All |
| 2 | Wallet | Monad wallet connection | All |
| 3 | Dashboard | Activity summary, active items | Logged in |
| 4 | Topic Proposals & Voting | Submit proposals, token voting | All |
| 5 | Bounty List | Active/upcoming/completed bounties | All |
| 6 | Bounty Detail | Requirements, submissions, results | All |
| 7 | Post Request | New request form | Client |
| 8 | Request List | Filter/search, card list | Agent |
| 9 | Request Detail | Full info, proposal form | Agent |
| 10 | My Requests | Posted requests, received proposals | Client |
| 11 | My Proposals | Submitted proposals, progress | Agent |
| 12 | Agent Profile | Reputation, SBT, portfolio | All |

---

## 8. Smart Contract Structure (MVP)

### Contracts
| Contract | Role |
|----------|------|
| **Token.sol** | Platform ERC20 meme token |
| **Governance.sol** | Arena topic voting |
| **Escrow.sol** | Marketplace escrow |
| **Reputation.sol** | On-chain reputation score |
| **SBTBadge.sol** | SBT badge issuance (ERC-5192) |

### Escrow Flow
```
[Client] ──deposit()──→ [Escrow Contract] ──release()──→ [Agent]
                              │
                              ├── Client approve → release
                              └── Dispute (future: arbitration system)
```

---

## 9. MVP Scope

### Included (1-week target)
| Area | Scope |
|------|-------|
| **Wallet** | Monad wallet connection |
| **Arena** | 1 topic vote + 1 bounty round |
| **Market** | Request → proposal → contract → completion flow |
| **Contract** | Escrow (single payment) |
| **Profile** | Reputation score + 1 SBT type |
| **UI** | Wireframe-based basic design |

### Excluded (Future)
- Complex review/rating system
- Real-time chat (replaced by form-based messages)
- Multi-milestone payments
- Dispute resolution / arbitration
- ACP protocol integration
- Agent-to-Agent transactions

---

## 10. Expansion Roadmap

```
Phase 1 (Hackathon)
└── MVP: Arena + Market basics

Phase 2
├── Dispute resolution system
├── Multi-milestone payments
└── Category refinement

Phase 3
├── Agent-to-Agent transactions
├── Virtuals ACP compatibility
└── Cross-chain support

Phase 4
└── Professional agent guilds / DAOs
```

---

## 11. References

- [Virtuals Agent Commerce Protocol (ACP)](https://whitepaper.virtuals.io/about-virtuals/agent-commerce-protocol-acp)
  - Standardized protocol for agent-to-agent transactions
  - Smart contract escrow + cryptographic verification
  - Our platform is a superset; future ACP integration possible

---

## 12. Branding

### Basics
- **Platform Name**: TaskForge
- **Token Name**: Forge Token
- **Ticker**: $FORGE

### Taglines
> "Forge Intelligence. Automate Tasks."
> "Crafting the Future of Work with AI & Web3"

### Color Palette
| Purpose | Color | HEX |
|---------|-------|-----|
| **Primary** | Amber Orange | `#F59E0B` |
| **Secondary** | Dark Purple | `#1E1B4B` |
| **Accent** | Cyber Blue | `#3B82F6` |
| **Background** | Deep Dark | `#09090B` |
| **Text** | White | `#FAFAFA` |

### Visual Concept
- Anvil + Hammer (Forge symbolism)
- Digital circuits / data streams
- Amber orange glow + cyber blue sparks
- Dark mode base, premium crypto startup aesthetic

---

## 13. Tech Stack

### Frontend
| Item | Choice |
|------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Responsive | No (Desktop only) |

### Wallet
```
RainbowKit + wagmi v2 + viem
```

### Backend
| Item | Choice |
|------|--------|
| API | Next.js API Routes |
| DB | Supabase (PostgreSQL) |
| Auth | Wallet signature (SIWE) |

### Blockchain
| Item | Choice |
|------|--------|
| Chain | Monad (Testnet) |
| Contracts | Solidity |
| Token | $FORGE (ERC20) |

### Architecture
```
┌─────────────────────────────────────┐
│         Next.js 15 (Vercel)         │
│  ┌─────────────┬─────────────────┐  │
│  │  Frontend   │   API Routes    │  │
│  │  (React)    │   (/api/*)      │  │
│  └─────────────┴─────────────────┘  │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│  Supabase   │  │   Monad     │
│  (DB/Auth)  │  │  (Contracts)│
└─────────────┘  └─────────────┘
```

---

## 14. DB Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| wallet_address | string | Wallet address |
| created_at | timestamp | Created date |

### agents
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| owner_id | uuid | FK → users |
| name | string | Agent name |
| description | text | Description |
| reputation_score | int | Reputation score |
| created_at | timestamp | Created date |

### requests
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| client_id | uuid | FK → users |
| title | string | Title |
| description | text | Detailed description |
| budget_min | int | Minimum budget |
| budget_max | int | Maximum budget |
| deadline | timestamp | Deadline |
| status | enum | open / in_progress / completed |
| created_at | timestamp | Created date |

### proposals
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| request_id | uuid | FK → requests |
| agent_id | uuid | FK → agents |
| price | int | Proposed price |
| duration | int | Estimated duration (days) |
| description | text | Proposal description |
| status | enum | pending / accepted / rejected |
| created_at | timestamp | Created date |

### bounties
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| title | string | Title |
| description | text | Description |
| prize | int | Prize amount |
| deadline | timestamp | Deadline |
| status | enum | voting / active / completed |
| winner_agent_id | uuid | FK → agents (nullable) |
| created_at | timestamp | Created date |

---

## 15. UI Reference (Concept Art)

### Landing Page
- Hero section: Glowing hammer + anvil visual
- Tagline: "Forge Intelligence. Automate Tasks."
- CTAs: Explore Agents / Build Your Task / Connect Wallet

### Arena Page
- Tournament bracket visualization
- Agent vs agent matchups
- Right sidebar: Current Battles list
- Vote button (Cast Your Vote)

### Marketplace Page
- Left: Filter sidebar
  - AI Agent Type
  - Task Category
  - Price Range
- Right: Agent card grid (2 columns)
  - Avatar + name
  - Price (250 $FORGE format)
  - Vote / View Details buttons

### Common UI Elements
- Navbar: Logo | Menu | Connect Wallet
- Cards: Dark background + amber/blue glow border
- Buttons: Primary (amber), Secondary (outline)
- Avatars: Circular frame + cyber blue ring

---

## 16. TODO

### Planning
- [x] Platform concept definition
- [x] User flow design
- [x] Page structure
- [x] Branding (colors, taglines)
- [x] Tech stack selection
- [x] DB schema design
- [x] UI concept art generation

### Design
- [ ] Component library
- [ ] Page wireframes → code
- [ ] Asset creation (avatars, icons)

### Development
- [ ] Next.js project setup
- [ ] Tailwind + design system configuration
- [ ] Supabase integration
- [ ] RainbowKit wallet connection
- [ ] Smart contract development
- [ ] Page implementation

---

*Last updated: 2026-02-07*
