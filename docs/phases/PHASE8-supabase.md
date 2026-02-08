# Phase A: Supabase DB + API

> Replace mock-api.ts's 25 functions with real Supabase-based DB API

---

## Work Order

```
A.1 Create Supabase project and setup
A.2 Create 9 table schemas (RLS + RPC)
A.3 Create 6 new files
A.4 Implement supabase-api.ts (25 functions)
A.5 Replace import paths (6 files)
A.6 Seed data and verify
```

---

## A.1 Create Supabase Project

### Sign up and create project
1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Click New Project
   - **Organization**: Personal account
   - **Project Name**: taskforge-mvp
   - **Database Password**: Strong password (save it!)
   - **Region**: Northeast Asia (Seoul)
   - **Pricing Plan**: Free

### Get API keys
After project creation:
1. Settings → API
2. Copy these 2 values:
   - **Project URL**: `https://<project-id>.supabase.co`
   - **anon public** key: `eyJhbGc...` (JWT token format)

---

## A.2 Table Schemas (9 tables)

### Execute in SQL Editor

**Location**: Supabase Dashboard → SQL Editor → New query

Execute the following SQL scripts in order (each table block + RPC function + RLS policies).

---

### 1️⃣ users (Users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,  -- Wallet address (0x...)
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('requester', 'agent', 'both')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies (MVP: public read/write)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON users FOR SELECT USING (true);
CREATE POLICY "Public insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON users FOR UPDATE USING (true);

-- Index
CREATE INDEX idx_users_address ON users(address);
```

---

### 2️⃣ agents (AI Agents)

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  avatar_url TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reputation INTEGER DEFAULT 50 CHECK (reputation >= 0 AND reputation <= 100),
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  total_tasks INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',  -- Array: ["smart-contract", "audit", ...]
  hourly_rate INTEGER DEFAULT 0,  -- Based on FORGE token
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON agents FOR SELECT USING (true);
CREATE POLICY "Public insert" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON agents FOR UPDATE USING (true);

CREATE INDEX idx_agents_owner ON agents(owner_id);
```

---

### 3️⃣ sbt_badges (SBT Badges)

```sql
CREATE TABLE sbt_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- "Gold Auditor", "Speed Runner"
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sbt_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON sbt_badges FOR SELECT USING (true);
CREATE POLICY "Public insert" ON sbt_badges FOR INSERT WITH CHECK (true);

CREATE INDEX idx_badges_agent ON sbt_badges(agent_id);
```

---

### 4️⃣ task_requests (Market Requests)

```sql
CREATE TABLE task_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('smart-contract', 'frontend', 'data-analysis', 'audit', 'other')),
  budget INTEGER NOT NULL,  -- FORGE token
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'disputed')),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON task_requests FOR SELECT USING (true);
CREATE POLICY "Public insert" ON task_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON task_requests FOR UPDATE USING (true);

CREATE INDEX idx_requests_requester ON task_requests(requester_id);
CREATE INDEX idx_requests_status ON task_requests(status);
CREATE INDEX idx_requests_category ON task_requests(category);
```

---

### 5️⃣ proposals (Quotes/Proposals)

```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES task_requests(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,  -- FORGE token
  estimated_days INTEGER NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON proposals FOR SELECT USING (true);
CREATE POLICY "Public insert" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON proposals FOR UPDATE USING (true);

CREATE INDEX idx_proposals_request ON proposals(request_id);
CREATE INDEX idx_proposals_agent ON proposals(agent_id);
```

---

### 6️⃣ rounds (Arena Rounds)

```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER UNIQUE NOT NULL,
  prize INTEGER DEFAULT 0,  -- FORGE token
  status TEXT DEFAULT 'proposing' CHECK (status IN ('proposing', 'voting', 'active', 'completed')),
  selected_topic_id UUID,  -- FK to topics (added below)
  winner_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON rounds FOR SELECT USING (true);
CREATE POLICY "Public insert" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON rounds FOR UPDATE USING (true);

CREATE INDEX idx_rounds_status ON rounds(status);
```

---

### 7️⃣ topics (Arena Topic Proposals)

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  proposer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON topics FOR SELECT USING (true);
CREATE POLICY "Public insert" ON topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON topics FOR UPDATE USING (true);

CREATE INDEX idx_topics_round ON topics(round_id);

-- Add rounds.selected_topic_id FK (resolve circular reference)
ALTER TABLE rounds ADD CONSTRAINT fk_selected_topic
  FOREIGN KEY (selected_topic_id) REFERENCES topics(id) ON DELETE SET NULL;
```

---

### 8️⃣ arena_entries (Arena Submissions)

```sql
CREATE TABLE arena_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,  -- GitHub repo (required)
  description TEXT NOT NULL,
  demo_url TEXT,  -- Demo link (optional)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arena_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON arena_entries FOR SELECT USING (true);
CREATE POLICY "Public insert" ON arena_entries FOR INSERT WITH CHECK (true);

CREATE INDEX idx_entries_round ON arena_entries(round_id);
CREATE INDEX idx_entries_agent ON arena_entries(agent_id);
```

---

### 9️⃣ escrow_deals (Escrow)

```sql
CREATE TABLE escrow_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES task_requests(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- FORGE token
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'funded', 'completed', 'disputed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE escrow_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON escrow_deals FOR SELECT USING (true);
CREATE POLICY "Public insert" ON escrow_deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON escrow_deals FOR UPDATE USING (true);

CREATE INDEX idx_escrows_requester ON escrow_deals(requester_id);
CREATE INDEX idx_escrows_agent ON escrow_deals(agent_id);
```

---

### RPC Function: increment_votes (atomic vote increment)

```sql
CREATE OR REPLACE FUNCTION increment_votes(topic_id UUID, voter_weight INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE topics
  SET total_votes = total_votes + voter_weight
  WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why**: Prevents race conditions during voting (atomic increment).

---

## A.3 Create New Files (6 files)

### 3-1. .env.local

**File**: `frontend/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Note**: `.env.local` is already in `.gitignore` (do not commit).

---

### 3-2. supabase.ts (Client Singleton)

**File**: `frontend/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

### 3-3. database.types.ts (Schema Types)

**File**: `frontend/lib/database.types.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          address: string;
          name: string;
          role: 'requester' | 'agent' | 'both';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      agents: {
        Row: {
          id: string;
          name: string;
          description: string;
          avatar_url: string | null;
          owner_id: string;
          reputation: number;
          completion_rate: number;
          total_tasks: number;
          skills: string[];
          hourly_rate: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agents']['Insert']>;
      };
      sbt_badges: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          tier: 'bronze' | 'silver' | 'gold';
          issued_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sbt_badges']['Row'], 'id' | 'issued_at'>;
        Update: Partial<Database['public']['Tables']['sbt_badges']['Insert']>;
      };
      task_requests: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: 'smart-contract' | 'frontend' | 'data-analysis' | 'audit' | 'other';
          budget: number;
          deadline: string;
          status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          requester_id: string;
          assigned_agent_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['task_requests']['Row'], 'id' | 'created_at' | 'status'>;
        Update: Partial<Database['public']['Tables']['task_requests']['Insert']>;
      };
      proposals: {
        Row: {
          id: string;
          request_id: string;
          agent_id: string;
          price: number;
          estimated_days: number;
          message: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at' | 'status'>;
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>;
      };
      rounds: {
        Row: {
          id: string;
          round_number: number;
          prize: number;
          status: 'proposing' | 'voting' | 'active' | 'completed';
          selected_topic_id: string | null;
          winner_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>;
      };
      topics: {
        Row: {
          id: string;
          round_id: string;
          proposer_id: string;
          title: string;
          description: string;
          total_votes: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['topics']['Row'], 'id' | 'created_at' | 'total_votes'>;
        Update: Partial<Database['public']['Tables']['topics']['Insert']>;
      };
      arena_entries: {
        Row: {
          id: string;
          round_id: string;
          agent_id: string;
          repo_url: string;
          description: string;
          demo_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['arena_entries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['arena_entries']['Insert']>;
      };
      escrow_deals: {
        Row: {
          id: string;
          request_id: string;
          requester_id: string;
          agent_id: string;
          amount: number;
          status: 'created' | 'funded' | 'completed' | 'disputed' | 'refunded';
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['escrow_deals']['Row'], 'id' | 'created_at' | 'status'>;
        Update: Partial<Database['public']['Tables']['escrow_deals']['Insert']>;
      };
    };
    Functions: {
      increment_votes: {
        Args: { topic_id: string; voter_weight: number };
        Returns: void;
      };
    };
  };
}
```

---

### 3-4. supabase-api.ts Function List (25 functions)

**File**: `frontend/lib/supabase-api.ts`

**Core Strategy**: Maintain **exact same signatures** as mock-api.ts, but implement with Supabase queries internally.

**Function List** (detailed implementation provided separately):

```typescript
// Users (2)
export async function getUsers(): Promise<User[]>
export async function getUserById(id: string): Promise<User | null>

// Agents (2)
export async function getAgents(): Promise<Agent[]>
export async function getAgentById(id: string): Promise<Agent | null>

// Requests (4)
export async function getRequests(filters?: { status?: RequestStatus; category?: RequestCategory }): Promise<TaskRequest[]>
export async function getRequestById(id: string): Promise<TaskRequest | null>
export async function createRequest(data: Omit<TaskRequest, 'id' | 'createdAt' | 'proposals' | 'status'>): Promise<TaskRequest>
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<TaskRequest>

// Proposals (4)
export async function getProposalsByRequest(requestId: string): Promise<Proposal[]>
export async function getProposalsByAgent(agentId: string): Promise<Proposal[]>
export async function submitProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'status'>): Promise<Proposal>
export async function updateProposalStatus(id: string, status: ProposalStatus): Promise<Proposal>

// Rounds (2)
export async function getRounds(filter?: { status?: RoundStatus }): Promise<Round[]>
export async function getRoundById(id: string): Promise<Round | null>

// Topics (3)
export async function getTopicsByRound(roundId: string): Promise<Topic[]>
export async function proposeTopic(data: Omit<Topic, 'id' | 'createdAt' | 'totalVotes'>): Promise<Topic>
export async function voteForTopic(topicId: string, voterWeight: number): Promise<Topic>

// Entries (2)
export async function getEntriesByRound(roundId: string): Promise<ArenaEntry[]>
export async function submitEntry(data: Omit<ArenaEntry, 'id' | 'createdAt'>): Promise<ArenaEntry>

// Escrow (3)
export async function getEscrowsByUser(userId: string): Promise<EscrowDeal[]>
export async function createEscrow(data: Omit<EscrowDeal, 'id' | 'createdAt' | 'status'>): Promise<EscrowDeal>
export async function updateEscrowStatus(id: string, status: DealStatus): Promise<EscrowDeal>

// Dashboard (1)
export async function getDashboardStats(userId: string): Promise<{
  totalRequests: number;
  activeRequests: number;
  totalProposals: number;
  totalSpent: number;
}>

// Total: 25 functions
```

**The complete implementation is ~1500 lines, so it will be provided separately. Each function follows this pattern:**

```typescript
// Example: getRequests
export async function getRequests(filters?: {
  status?: RequestStatus;
  category?: RequestCategory;
}): Promise<TaskRequest[]> {
  let query = supabase
    .from('task_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.category) query = query.eq('category', filters.category);

  const { data, error } = await query;
  if (error) throw error;

  // Populate proposals array (JOIN or separate query)
  const { data: proposalsData } = await supabase
    .from('proposals')
    .select('id, request_id');

  return data.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    budget: row.budget,
    deadline: row.deadline,
    status: row.status,
    requesterId: row.requester_id,
    assignedAgentId: row.assigned_agent_id ?? undefined,
    proposals: proposalsData.filter(p => p.request_id === row.id).map(p => p.id),
    createdAt: row.created_at,
  }));
}
```

---

### 3-5. useUser.ts (Wallet connection → users table upsert)

**File**: `frontend/lib/hooks/useUser.ts`

```typescript
'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

export function useUser() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      // Upsert user (insert if not exists, do nothing if exists)
      supabase
        .from('users')
        .upsert(
          {
            address,
            name: `User ${address.slice(0, 6)}`,
            role: 'requester',
          },
          { onConflict: 'address', ignoreDuplicates: true }
        )
        .then(({ error }) => {
          if (error) console.error('User upsert error:', error);
        });
    }
  }, [address, isConnected]);

  return { address, isConnected };
}
```

**Usage**: Call `useUser()` at the top of each page component → automatically adds user to users table on wallet connection.

---

### 3-6. seed.ts (Seed data injection script)

**File**: `frontend/lib/seed.ts`

```typescript
import { supabase } from './supabase';
import {
  mockUsers,
  mockAgents,
  mockRequests,
  mockProposals,
  mockRounds,
  mockTopics,
  mockArenaEntries,
  mockEscrows,
} from './mock-data';

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Users
  const { error: usersError } = await supabase.from('users').insert(
    mockUsers.map((u) => ({
      id: u.id,
      address: u.address,
      name: u.name,
      role: u.role,
      avatar_url: u.avatarUrl ?? null,
      created_at: u.createdAt,
    }))
  );
  if (usersError) console.error('Users error:', usersError);
  else console.log('✅ Users seeded');

  // 2. Agents
  const { error: agentsError } = await supabase.from('agents').insert(
    mockAgents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      avatar_url: a.avatarUrl ?? null,
      owner_id: a.owner,
      reputation: a.reputation,
      completion_rate: a.completionRate,
      total_tasks: a.totalTasks,
      skills: a.skills,
      hourly_rate: a.hourlyRate,
      created_at: a.createdAt,
    }))
  );
  if (agentsError) console.error('Agents error:', agentsError);
  else console.log('✅ Agents seeded');

  // 3. SBT Badges
  const badges = mockAgents.flatMap((a) =>
    a.sbtBadges.map((b) => ({
      id: b.id,
      agent_id: a.id,
      name: b.name,
      tier: b.tier,
      issued_at: b.issuedAt,
    }))
  );
  const { error: badgesError } = await supabase.from('sbt_badges').insert(badges);
  if (badgesError) console.error('Badges error:', badgesError);
  else console.log('✅ Badges seeded');

  // 4. Task Requests
  const { error: requestsError } = await supabase.from('task_requests').insert(
    mockRequests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      budget: r.budget,
      deadline: r.deadline,
      status: r.status,
      requester_id: r.requesterId,
      assigned_agent_id: r.assignedAgentId ?? null,
      created_at: r.createdAt,
    }))
  );
  if (requestsError) console.error('Requests error:', requestsError);
  else console.log('✅ Requests seeded');

  // 5. Proposals
  const { error: proposalsError } = await supabase.from('proposals').insert(
    mockProposals.map((p) => ({
      id: p.id,
      request_id: p.requestId,
      agent_id: p.agentId,
      price: p.price,
      estimated_days: p.estimatedDays,
      message: p.message,
      status: p.status,
      created_at: p.createdAt,
    }))
  );
  if (proposalsError) console.error('Proposals error:', proposalsError);
  else console.log('✅ Proposals seeded');

  // 6. Rounds
  const { error: roundsError } = await supabase.from('rounds').insert(
    mockRounds.map((r) => ({
      id: r.id,
      round_number: r.roundNumber,
      prize: r.prize,
      status: r.status,
      selected_topic_id: r.selectedTopicId ?? null,
      winner_id: r.winnerId ?? null,
      created_at: r.createdAt,
    }))
  );
  if (roundsError) console.error('Rounds error:', roundsError);
  else console.log('✅ Rounds seeded');

  // 7. Topics
  const { error: topicsError } = await supabase.from('topics').insert(
    mockTopics.map((t) => ({
      id: t.id,
      round_id: t.roundId,
      proposer_id: t.proposerId,
      title: t.title,
      description: t.description,
      total_votes: t.totalVotes,
      created_at: t.createdAt,
    }))
  );
  if (topicsError) console.error('Topics error:', topicsError);
  else console.log('✅ Topics seeded');

  // 8. Arena Entries
  const { error: entriesError } = await supabase.from('arena_entries').insert(
    mockArenaEntries.map((e) => ({
      id: e.id,
      round_id: e.roundId,
      agent_id: e.agentId,
      repo_url: e.repoUrl,
      description: e.description,
      demo_url: e.demoUrl ?? null,
      created_at: e.createdAt,
    }))
  );
  if (entriesError) console.error('Entries error:', entriesError);
  else console.log('✅ Entries seeded');

  // 9. Escrow Deals
  const { error: escrowsError } = await supabase.from('escrow_deals').insert(
    mockEscrows.map((e) => ({
      id: e.id,
      request_id: e.requestId,
      requester_id: e.requesterId,
      agent_id: e.agentId,
      amount: e.amount,
      status: e.status,
      created_at: e.createdAt,
      completed_at: e.completedAt ?? null,
    }))
  );
  if (escrowsError) console.error('Escrows error:', escrowsError);
  else console.log('✅ Escrows seeded');

  console.log('🎉 Seed complete!');
}

seed();
```

**How to run**:
```bash
cd frontend
npx tsx lib/seed.ts
```

---

## A.4 Same Signature Strategy

**Core Principle**: All functions in `supabase-api.ts` maintain **exact same function names, parameters, return types** as `mock-api.ts`.

**Benefits**:
- Switch complete by just changing import paths in page files
- No need to modify existing page logic
- Zero type errors

**Example**:
```typescript
// Before (mock-api.ts)
import { getRequests, getRequestById } from '@/lib/mock-api';

// After (supabase-api.ts)
import { getRequests, getRequestById } from '@/lib/supabase-api';
```

---

## A.5 Replace Import Paths (6 files)

Change `@/lib/mock-api` → `@/lib/supabase-api` in these 6 files:

| File | Changes |
|------|---------|
| `app/arena/page.tsx` | getRounds, getTopicsByRound, getEntriesByRound |
| `app/market/page.tsx` | getRequests, getAgents |
| `app/market/[id]/page.tsx` | getRequestById, getProposalsByRequest |
| `app/agent/[id]/page.tsx` | getAgentById |
| `app/dashboard/page.tsx` | getDashboardStats, getRequests |
| `components/features/market/ProposalForm.tsx` | submitProposal |

**Additional task**: Add `useUser()` call at the top of each page.

```typescript
'use client';

import { useUser } from '@/lib/hooks/useUser';

export default function Page() {
  useUser(); // Auto-register user to users table on wallet connection
  // ...
}
```

---

## A.6 Seed and Verify

### Run seed
```bash
cd frontend
npm install @supabase/supabase-js tsx
npx tsx lib/seed.ts
```

**Check**: Supabase Dashboard → Table Editor → Verify data in 9 tables.

### Verification Checklist

| # | Item | Method |
|---|------|--------|
| 1 | 9 tables created | Supabase Table Editor |
| 2 | users 5 rows | SELECT COUNT(*) FROM users; → 5 |
| 3 | agents 6 rows + badges | SELECT COUNT(*) FROM agents; → 6 |
| 4 | task_requests 6 rows | SELECT COUNT(*) FROM task_requests; → 6 |
| 5 | proposals 12 rows | SELECT COUNT(*) FROM proposals; → 12 |
| 6 | rounds 4 rows | SELECT COUNT(*) FROM rounds; → 4 |
| 7 | topics 8 rows | SELECT COUNT(*) FROM topics; → 8 |
| 8 | arena_entries 6 rows | SELECT COUNT(*) FROM arena_entries; → 6 |
| 9 | escrow_deals 3 rows | SELECT COUNT(*) FROM escrow_deals; → 3 |
| 10 | Arena page loads | Verify rounds list displays |
| 11 | Market page loads | Verify requests list displays |
| 12 | Request detail page | Verify proposals list displays |
| 13 | Proposal submission | Verify submitProposal works |
| 14 | Voting function | Verify voteForTopic works (increment_votes RPC) |
| 15 | `npm run build` | 0 errors |

---

## Completion Criteria

- [ ] Supabase project created (URL + anon key obtained)
- [ ] 9 table schemas created (SQL Editor)
- [ ] increment_votes RPC function created
- [ ] RLS policies applied (public read/write)
- [ ] 6 new files created
- [ ] supabase-api.ts 25 functions implemented
- [ ] 6 page files import paths replaced
- [ ] useUser() hook applied (6 pages)
- [ ] Seed data injected
- [ ] All pages display Supabase data
- [ ] `npm run build` 0 errors

---

## Estimated Time
- A.1 Project creation: ~5 min
- A.2 Schema creation: ~20 min
- A.3~A.4 File creation: ~60 min
- A.5 Import replacement: ~10 min
- A.6 Seed and verify: ~15 min
- **Total: ~110 min (about 2 hours)**

---

## Next Phase Dependencies
- Phase B (Contract deployment) → Independent from Phase A, can be done in parallel
- Phase D (Admin page) → Requires Phase A completion (uses Supabase API)

---

## Notes

### Supabase Client Library

**Install**:
```bash
npm install @supabase/supabase-js
```

**Version**: Latest stable (v2.x)

### RLS Policy Notes

Currently set to public (`USING (true)`) for MVP.
For production, change to:

```sql
-- Example: users table production RLS
CREATE POLICY "Users can read all" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid() = id);
```

### Complete supabase-api.ts Implementation

The complete supabase-api.ts implementation is ~1500 lines, so it will be provided separately during actual development. Each function follows this pattern:

1. Execute query with Supabase client
2. Convert snake_case → camelCase
3. Convert null → undefined
4. JOIN or fetch related data separately
5. Return matching types.ts types

Following this pattern ensures complete compatibility with mock-api.ts.
