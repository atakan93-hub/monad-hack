# Phase 4: Page Implementations

> 5 core pages + feature components with mock data

---

## Pages

### 4.1 Landing Page (`app/page.tsx`)
- Hero: "Forge Intelligence. Automate Tasks." + gradient overlay
- Features section: Arena / Market / Escrow cards
- Stats section: hardcoded numbers (120+ Agents, 500+ Tasks, etc.)
- CTA section with Connect Wallet button

### 4.2 Arena Page (`app/arena/page.tsx`)
- BountyCard grid layout (3 columns)
- Status filter tabs: Voting / Active / Completed / All
- Bounty detail modal with entries and voting UI

### 4.3 Marketplace
- **List** (`app/market/page.tsx`): FilterSidebar (category, status, budget) + RequestCard grid
- **Detail** (`app/market/[id]/page.tsx`): Request info + proposal list + ProposalForm

### 4.4 Agent Profile (`app/agent/[id]/page.tsx`)
- AgentProfile header (avatar with glow, name, description, skill badges)
- AgentStats (4 stat cards: reputation, completion rate, total tasks, hourly rate)
- SBT badges display + completed tasks list

### 4.5 Dashboard (`app/dashboard/page.tsx`)
- 4 StatCards (total requests, active, proposals, total spent)
- Active requests list
- Received proposals list

---

## Feature Components

### features/arena/
| Component | Description |
|-----------|-------------|
| BountyCard | Bounty card (status badge, title, reward, entries count, votes) |
| VoteButton | Token amount input + vote button |

### features/market/
| Component | Description |
|-----------|-------------|
| FilterSidebar | Category checkboxes, status radio, budget range |
| RequestCard | Request card (category badge, title, budget, status, proposals count) |
| ProposalForm | Price, estimated days, message, agent select, submit |
| ProposalCard | Agent info, price, duration, message, accept button |

### features/agent/
| Component | Description |
|-----------|-------------|
| AgentProfile | Avatar (xl, glow) + name + description + skills |
| AgentStats | 4 stat cards grid |

### features/common/
| Component | Description |
|-----------|-------------|
| StatCard | Icon + large number + label |

---

## Route Map

| Path | File | Description |
|------|------|-------------|
| `/` | `app/page.tsx` | Landing |
| `/arena` | `app/arena/page.tsx` | Arena |
| `/market` | `app/market/page.tsx` | Request list |
| `/market/[id]` | `app/market/[id]/page.tsx` | Request detail |
| `/agent/[id]` | `app/agent/[id]/page.tsx` | Agent profile |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard |

---

## Completion Checklist

- [ ] Landing hero + CTA buttons navigate correctly
- [ ] Arena filter tabs work
- [ ] Arena voting UI functional
- [ ] Bounty detail modal opens on card click
- [ ] Market filter sidebar applies filters
- [ ] Request detail shows proposals
- [ ] ProposalForm submits and adds to list
- [ ] Agent profile renders with stats + SBT
- [ ] Dashboard shows stats
- [ ] All navigation works
- [ ] `npm run build` 0 errors

---

## Dependencies
- Phase 5 (Wallet) → after Phase 4 (Navbar modification)
- Phase 7 (Integration) → Phase 4 + Phase 6
