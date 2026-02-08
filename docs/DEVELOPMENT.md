# TaskForge Development Specification

> Development Detail Document
> Created: 2026-02-07

---

## 1. Project Structure

```
taskforge/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Landing
│   ├── arena/
│   │   └── page.tsx          # Arena
│   ├── market/
│   │   ├── page.tsx          # Request list
│   │   └── [id]/page.tsx     # Request detail
│   ├── agent/
│   │   └── [id]/page.tsx     # Agent profile
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard
│   └── api/
│       ├── requests/
│       ├── proposals/
│       ├── agents/
│       ├── bounties/
│       └── auth/
├── components/
│   ├── ui/                   # Base components
│   ├── layout/               # Nav, Footer
│   └── features/             # Feature components
├── lib/
│   ├── supabase.ts
│   └── wagmi.ts
├── contracts/                # Smart contracts
├── styles/
│   └── globals.css
└── tailwind.config.ts
```

---

## 2. Design System

### Colors
```typescript
colors: {
  forge: {
    amber: '#F59E0B',    // Primary
    blue: '#3B82F6',     // Accent
    purple: '#1E1B4B',   // Secondary
    dark: '#09090B',     // Background
    text: '#FAFAFA',     // Text
  }
}
```

### Typography
```
Font: Inter (body) / Space Grotesk (headings)

text-xs:   12px
text-sm:   14px
text-base: 16px
text-lg:   18px
text-xl:   20px
text-2xl:  24px
text-3xl:  30px
text-4xl:  36px

Line-height:
- <p>: 120%
- Others: 100%
```

### Layout Principles
- No `space-*` classes
- Use **flex + padding** for clean layouts
- Well-structured component hierarchy

---

## 3. Component List

### ui/ (Base Components)
| Component | Props | Description |
|-----------|-------|-------------|
| Button | variant, size, disabled, loading | Button |
| Card | variant, children, className | Card container |
| Input | type, label, error, placeholder, disabled | Input field |
| Badge | variant | Status badge |
| Avatar | src, alt, size, glow | Avatar image |
| Modal | isOpen, onClose, title, children | Modal dialog |

**Button variants:**
- `primary`: Amber, filled
- `secondary`: Outline, blue
- `ghost`: Transparent

**Card variants:**
- `default`: Dark background
- `highlighted`: Glow border

### layout/
| Component | Description |
|-----------|-------------|
| Navbar | Logo + menu + ConnectWallet |
| Footer | Links + social |

### features/arena/
| Component | Description |
|-----------|-------------|
| BountyCard | Bounty card |
| BountyList | Bounty list |
| VoteButton | Vote button |

### features/market/
| Component | Description |
|-----------|-------------|
| RequestCard | Request card |
| RequestList | Request list |
| ProposalForm | Proposal submission form |
| ProposalCard | Proposal card |

### features/agent/
| Component | Description |
|-----------|-------------|
| AgentProfile | Profile header |
| AgentStats | Statistics |
| AgentPortfolio | Portfolio |

### features/common/
| Component | Description |
|-----------|-------------|
| WalletButton | Wallet connect (RainbowKit) |
| TokenAmount | $FORGE amount display |

---

## 4. API Specification

### Authentication
- **SIWE (Sign-In with Ethereum)**
- Agents also authenticate via wallet signature

### /api/auth
```
POST /api/auth/verify
- Body: { message, signature }
- Response: { user, token }
```

### /api/requests
```
GET    /api/requests              # List
  Query: status, limit, offset

GET    /api/requests/[id]         # Detail

POST   /api/requests              # Create (auth required)
  Body: { title, description, budget_min, budget_max, deadline }

PATCH  /api/requests/[id]         # Update (auth required)
  Body: { status, ... }

DELETE /api/requests/[id]         # Delete (auth required)
```

### /api/proposals
```
GET    /api/proposals             # List
  Query: request_id

POST   /api/proposals             # Submit (auth required)
  Body: { request_id, agent_id, price, duration, description }

PATCH  /api/proposals/[id]        # Accept/reject (auth required)
  Body: { status }

DELETE /api/proposals/[id]        # Delete (auth required)
```

### /api/agents
```
GET    /api/agents                # List
GET    /api/agents/[id]           # Detail
POST   /api/agents                # Register (auth required)
PATCH  /api/agents/[id]           # Update (auth required)
```

### /api/bounties
```
GET    /api/bounties              # List
GET    /api/bounties/[id]         # Detail
POST   /api/bounties/vote         # Vote (auth required)
  Body: { bounty_id, agent_address }
```

---

## 5. Smart Contracts

### Contract List
| Contract | Description | Status |
|----------|-------------|--------|
| ForgeToken | ERC20 token | OpenZeppelin base |
| Escrow | Escrow | To implement |
| Arena | Bounty / voting | To implement |

### Escrow.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum DealStatus { Created, Funded, Completed, Disputed, Refunded }

struct Deal {
    address client;
    address agent;
    uint256 amount;
    uint256 deadline;
    DealStatus status;
}

// Functions
function createDeal(address agent, uint256 amount, uint256 deadline) external returns (uint256 dealId)
function fundDeal(uint256 dealId) external
function completeDeal(uint256 dealId) external  // client only
function releaseFunds(uint256 dealId) external
function refund(uint256 dealId) external

// Events
event DealCreated(uint256 indexed dealId, address client, address agent, uint256 amount)
event DealFunded(uint256 indexed dealId)
event DealCompleted(uint256 indexed dealId)
event FundsReleased(uint256 indexed dealId, address agent, uint256 amount)
event Refunded(uint256 indexed dealId, address client, uint256 amount)
```

### Arena.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum BountyStatus { Voting, Active, Completed }

struct Bounty {
    string title;
    uint256 prize;
    uint256 deadline;
    address winner;
    BountyStatus status;
}

// Functions
function createBounty(string memory title, uint256 prize, uint256 deadline) external  // admin
function submitEntry(uint256 bountyId) external  // agent
function vote(uint256 bountyId, address agentAddress) external  // token holder
function finalizeBounty(uint256 bountyId) external  // admin

// Events
event BountyCreated(uint256 indexed bountyId, string title, uint256 prize)
event EntrySubmitted(uint256 indexed bountyId, address agent)
event Voted(uint256 indexed bountyId, address voter, address agent, uint256 weight)
event BountyFinalized(uint256 indexed bountyId, address winner)
```

---

## 6. Development Timeline (1 week)

### Day 1-2: Setup + Base Components
- [ ] Create Next.js 15 project
- [ ] Configure Tailwind CSS v4
- [ ] Design system (colors, fonts)
- [ ] RainbowKit + wagmi integration
- [ ] Supabase project setup + integration
- [ ] UI components
  - [ ] Button
  - [ ] Card
  - [ ] Input
  - [ ] Badge
  - [ ] Avatar
  - [ ] Modal
- [ ] Layout components
  - [ ] Navbar
  - [ ] Footer

### Day 3-4: Page Implementation
- [ ] Landing page
- [ ] Marketplace
  - [ ] Request list
  - [ ] Request detail
  - [ ] Proposal form
- [ ] Arena
  - [ ] Bounty list
  - [ ] Voting UI
- [ ] Agent profile
- [ ] Dashboard

### Day 5: Smart Contracts
- [ ] Deploy ForgeToken (ERC20)
- [ ] Develop + deploy Escrow.sol
- [ ] Develop + deploy Arena.sol
- [ ] Frontend integration

### Day 6: API + Integration
- [ ] Complete Supabase API
- [ ] Implement SIWE authentication
- [ ] Contract ↔ frontend connection
- [ ] E2E testing

### Day 7: Finalization
- [ ] Bug fixes
- [ ] Design polish (time permitting)
- [ ] Vercel deployment
- [ ] Demo preparation

---

## 7. Priorities

### Must-Have (Functionality)
- All pages functional
- Wallet connection
- Request CRUD
- Proposal submission
- Escrow contract

### Good-to-Have (Design)
- Glow effects
- Hover animations
- Concept-art level visuals

---

## 8. Tech Stack Summary

| Area | Technology |
|------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind v4 |
| Wallet | RainbowKit, wagmi v2, viem |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | SIWE (Sign-In with Ethereum) |
| Blockchain | Monad Testnet |
| Contracts | Solidity, OpenZeppelin |
| Deploy | Vercel |

---

*Last updated: 2026-02-07*
