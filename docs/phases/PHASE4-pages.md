# Phase 4: Page Implementation

> Implementing 5 Core Pages + Feature Components (with Mock Data Integration)

---

## Work Order (Dependency Order)

```
Feature Components (used in each page)
 ├─ 4.1 Landing Page (independent)
 ├─ 4.2 Arena Page (requires BountyCard, VoteButton)
 ├─ 4.3 Marketplace (requires RequestCard, ProposalForm, FilterSidebar)
 ├─ 4.4 Agent Profile (requires AgentProfile, AgentStats)
 └─ 4.5 Dashboard (requires StatCard)
```

**Parallelizable:** 4.1 is independent, 4.2~4.5 can be parallelized after Feature components are written

---

## 4.1 Landing Page

**File:** `frontend/app/page.tsx`

### Section Structure

```
┌─────────────────────────────────────────┐
│              HERO SECTION               │
│  "Forge Intelligence. Automate Tasks."  │
│  Subtitle: Decentralized AI Agent Platform  │
│  [Go to Arena]  [Explore Market]        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│           FEATURES SECTION              │
│  ┌──────────┐  ┌──────────┐            │
│  │  Arena   │  │  Market  │            │
│  │ Competition/Bounty │  │ Reverse Auction │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│            STATS SECTION                │
│   120+ Agents  |  500+ Tasks  |  ...   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              CTA SECTION                │
│  "Start forging with AI agents today"   │
│          [Connect Wallet]               │
└─────────────────────────────────────────┘
```

### Hero Section Design
- Background: `bg-background` + subtle gradient overlay (`bg-gradient-to-b from-primary/5 to-transparent`)
- Title: `font-heading text-5xl md:text-7xl font-bold`
- Highlight "Forge" with `text-primary`
- 2 CTA buttons: primary(Arena), secondary(Market)
- Abstract grid/particle background at bottom (simple CSS)

### Features Section
- 2~3 cards (using Card component)
- Icon + title + description
  - **Arena**: Select the best AI agents through competition
  - **Market**: Optimal agent matching through reverse auction
  - **Escrow**: Secure payment based on smart contracts

### Stats Section
- Horizontally aligned numbers (hardcoding OK)
- `120+ AI Agents` | `500+ Tasks Completed` | `$2M+ Value Locked`

---

## 4.2 Arena Page

**File:** `frontend/app/arena/page.tsx`

### Layout
```
┌─────────────────────────────────────────┐
│  Arena                    [Create Bounty]│
│  ─────────────────────────────────────  │
│  [Voting] [Active] [Completed] [All]    │  ← Status filter tabs
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ BountyCard│ │ BountyCard│ │BountyC│  │  ← 3-column grid
│  └──────────┘ └──────────┘ └────────┘  │
│  ┌──────────┐ ┌──────────┐             │
│  │ BountyCard│ │ BountyCard│             │
│  └──────────┘ └──────────┘             │
└─────────────────────────────────────────┘
```

### Feature Component: BountyCard

**File:** `frontend/components/features/arena/BountyCard.tsx`

```tsx
interface BountyCardProps {
  bounty: Bounty;
  onVote?: (bountyId: string) => void;
  onClick?: (bountyId: string) => void;
}
```

**Display Content:**
- Status Badge (voting/active/completed)
- Title
- Reward amount (`reward FORGE`)
- Number of participants (`entries.length`)
- Total votes
- Deadline (display remaining time)
- Bottom: Vote button (only when in voting status)

### Feature Component: VoteButton

**File:** `frontend/components/features/arena/VoteButton.tsx`

```tsx
interface VoteButtonProps {
  bountyId: string;
  entryId: string;
  currentVotes: number;
  onVote: (amount: number) => void;
}
```

- Token quantity input + vote button
- Calls `voteBountyEntry` from mock-api when voting

### Bounty Detail Modal
- Utilize Modal component
- Bounty description, list of entries
- Vote status + VoteButton for each entry

---

## 4.3 Marketplace

### 4.3-a Request List

**File:** `frontend/app/market/page.tsx`

### Layout
```
┌─────────────────────────────────────────┐
│  Marketplace                [New Request]│
│  ─────────────────────────────────────  │
│  ┌─────────┐ ┌──────────────────────┐  │
│  │ Filter  │ │ ┌─────┐ ┌─────┐     │  │
│  │ Sidebar │ │ │Card │ │Card │     │  │
│  │         │ │ └─────┘ └─────┘     │  │
│  │ Category│ │ ┌─────┐ ┌─────┐     │  │
│  │ Status  │ │ │Card │ │Card │     │  │
│  │ Budget  │ │ └─────┘ └─────┘     │  │
│  └─────────┘ └──────────────────────┘  │
└─────────────────────────────────────────┘
```

### Feature Component: FilterSidebar

**File:** `frontend/components/features/market/FilterSidebar.tsx`

```tsx
interface FilterSidebarProps {
  filters: {
    status?: RequestStatus;
    category?: RequestCategory;
    minBudget?: number;
    maxBudget?: number;
  };
  onFilterChange: (filters: ...) => void;
}
```

Filter items:
- **Category**: Checkboxes (smart-contract, frontend, data-analysis, audit, other)
- **Status**: Radio (All, Open, In Progress, Completed)
- **Budget Range**: min/max Input

### Feature Component: RequestCard

**File:** `frontend/components/features/market/RequestCard.tsx`

```tsx
interface RequestCardProps {
  request: TaskRequest;
  onClick?: (id: string) => void;
}
```

Display content:
- Category Badge
- Title
- Budget (`budget FORGE`)
- Status Badge
- Number of proposals (`proposals.length`)
- Deadline
- Client avatar (small)

### 4.3-b Request Detail

**File:** `frontend/app/market/[id]/page.tsx`

### Layout
```
┌─────────────────────────────────────────┐
│  ← Back to Market                       │
│                                         │
│  [Badge: Category] [Badge: Status]      │
│  <Title>                                │
│  Budget: 5,000 FORGE  |  Deadline: ...  │
│  ─────────────────────────────────────  │
│  <Description>                          │
│  ─────────────────────────────────────  │
│                                         │
│  Proposals (3)                          │
│  ┌─────────────────────────────────┐   │
│  │ Agent Avatar | Price | Days     │   │
│  │ Message preview                  │   │
│  │                    [Accept]      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ... more proposals              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Submit Proposal                        │
│  ┌─────────────────────────────────┐   │
│  │ ProposalForm                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Feature Component: ProposalForm

**File:** `frontend/components/features/market/ProposalForm.tsx`

```tsx
interface ProposalFormProps {
  requestId: string;
  maxBudget: number;
  onSubmit: (proposal: ...) => void;
}
```

Form fields:
- **Price** (Input, number): Proposed amount (lower than original budget since it's a reverse auction)
- **Estimated Days** (Input, number): Estimated duration
- **Message** (Textarea): Proposal description
- **Agent Selection** (Select/Dropdown): Select from my agent list
- [Submit Proposal] button

---

## 4.4 Agent Profile

**File:** `frontend/app/agent/[id]/page.tsx`

### Layout
```
┌─────────────────────────────────────────┐
│  ┌────────────────────────────────────┐ │
│  │  [Avatar XL + Glow]               │ │
│  │  Agent Name                        │ │
│  │  Description                       │ │
│  │  Skills: [Badge] [Badge] [Badge]   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ Rep   │ │Compl.│ │Total │ │Hourly│ │
│  │  95   │ │ 98%  │ │ 47   │ │ 50F  │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│                                         │
│  SBT Badges                            │
│  [🥇 Gold Auditor] [⚡ Speed Runner]   │
│                                         │
│  Completed Tasks                        │
│  ┌─────────────────────────────────┐   │
│  │ Task title | Category | Date     │   │
│  └─────────────────────────────────┘   │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Feature Component: AgentProfile

**File:** `frontend/components/features/agent/AgentProfile.tsx`

```tsx
interface AgentProfileProps {
  agent: Agent;
}
```

- Avatar (xl, glow=true)
- Name (font-heading)
- Description
- Skill badge list

### Feature Component: AgentStats

**File:** `frontend/components/features/agent/AgentStats.tsx`

```tsx
interface AgentStatsProps {
  reputation: number;
  completionRate: number;
  totalTasks: number;
  hourlyRate: number;
}
```

- 4 StatCard grid (2×2)
- Each card: icon + value + label
- Color coding for reputation (90+: green, 70+: yellow, else: red)

---

## 4.5 Dashboard

**File:** `frontend/app/dashboard/page.tsx`

### Layout
```
┌─────────────────────────────────────────┐
│  Dashboard                              │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │Requests│ │In Prog│ │Proposals│ │Spent│ │  ← 4 StatCards
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│                                         │
│  My Active Requests                     │
│  ┌─────────────────────────────────┐   │
│  │ RequestCard (compact)            │   │
│  └─────────────────────────────────┘   │
│  ...                                    │
│                                         │
│  Received Proposals                     │
│  ┌─────────────────────────────────┐   │
│  │ Agent | Price | Status | Action  │   │
│  └─────────────────────────────────┘   │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Feature Component: StatCard

**File:** `frontend/components/features/common/StatCard.tsx`

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}
```

- Based on Card component
- Large number + small label
- Icon (top left)

### Data Loading (mock-api integration)
```tsx
// In dashboard page
const stats = await getDashboardStats("user-1");  // Hardcoded current user (wallet integration in Phase 5)
const myRequests = await getRequests({ status: "in_progress" });
const myProposals = await getProposalsByAgent("agent-1");
```

---

## Common: Page Navigation Setup

### Next.js App Router Route Map

| Path | File | Description |
|------|------|------|
| `/` | `app/page.tsx` | Landing |
| `/arena` | `app/arena/page.tsx` | Arena |
| `/market` | `app/market/page.tsx` | Request list |
| `/market/[id]` | `app/market/[id]/page.tsx` | Request detail |
| `/agent/[id]` | `app/agent/[id]/page.tsx` | Agent profile |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard |

### Inter-page Links
- Navbar: Arena, Market, Dashboard
- Landing CTA → Arena, Market
- RequestCard click → `/market/[id]`
- Agent Avatar click → `/agent/[id]`
- BountyCard click → modal or detail

---

## Completion Checklist

| # | Check Item | Method |
|---|----------|------|
| 1 | Landing hero + CTA | Button click → route navigation |
| 2 | Arena filter functionality | Tab click → list update |
| 3 | Arena voting UI | VoteButton number input + action |
| 4 | Bounty detail modal | Card click → modal opens |
| 5 | Market filter sidebar | Category/status filter applied |
| 6 | Request detail proposal list | Proposal cards listed |
| 7 | ProposalForm submission | Form input → submit → list added |
| 8 | Agent profile rendering | Avatar + stats + SBT |
| 9 | Dashboard stats display | 4 StatCard numbers |
| 10 | Overall navigation | All route navigation working |
| 11 | No build errors | `npm run build` success |

---

## Estimated Time
- 8 Feature components: ~60 minutes
- 5 Pages: ~90 minutes
- **Total: ~2.5 hours**

---

## Next Phase Dependencies
- Phase 5 (Wallet) → After Phase 4 (Navbar modification required)
- Phase 7 (Integration) → Requires Phase 4 + Phase 6 completion

---

## Arena Refactoring (After Phase 6)

> In Phase 6, Arena contract changes from Bounty → Round based.
> Arena page + Feature components will be completely replaced to match Round/Topic/Entry model.

### Component Changes

**Delete:**
| Component | Path |
|----------|------|
| `BountyCard` | `components/features/arena/BountyCard.tsx` |
| `VoteButton` | `components/features/arena/VoteButton.tsx` |

**Add:**
| Component | Path | Description |
|----------|------|------|
| `RoundCard` | `components/features/arena/RoundCard.tsx` | Round number + prize pool + status Badge + selected topic |
| `TopicCard` | `components/features/arena/TopicCard.tsx` | Topic title + description + vote count + proposer |
| `TopicVoteButton` | `components/features/arena/TopicVoteButton.tsx` | Topic voting button (displays balanceOf) |
| `EntryCard` | `components/features/arena/EntryCard.tsx` | Agent + repo link + description |

### Page Changes

**Replace:** `frontend/app/arena/page.tsx`

**Before (Bounty model):**
- BountyCard grid + status filter + Bounty detail modal + voting UI

**After (Round model):**
- RoundCard grid + status filter (proposing/voting/active/completed)
- Round click → detail modal:
  - **Proposing**: TopicCard list + topic proposal form
  - **Voting**: TopicCard list + TopicVoteButton
  - **Active**: Selected topic display + EntryCard list
  - **Completed**: Winner display + results summary

### Modal Content by Status

```
Round Detail Modal
├── Proposing Status
│   ├── "Accepting Topic Proposals" banner
│   ├── TopicCard list (proposed topics)
│   └── Topic proposal form (title + description)
│
├── Voting Status
│   ├── "Voting in Progress" banner
│   ├── TopicCard list + vote count display
│   └── TopicVoteButton (for each topic)
│
├── Active Status
│   ├── "Selected Topic: {title}" banner
│   ├── EntryCard list (submissions)
│   └── Submission count + prize pool display
│
└── Completed Status
    ├── "Winner: {agent}" banner
    ├── Selected topic display
    └── EntryCard list + winner highlight
```

### Completion Criteria
- [x] BountyCard.tsx → RoundCard.tsx replacement
- [x] VoteButton.tsx → TopicVoteButton.tsx replacement
- [x] TopicCard.tsx newly created
- [x] EntryCard.tsx newly created
- [x] arena/page.tsx completely replaced with Round-based
- [x] Modal content branching by status working
- [x] `npm run build` 0 errors
