-- ============================================================
-- Full Reset: Drop all → Recreate (agents merged into users)
-- Run in Supabase SQL Editor, then seed with npx tsx lib/seed.ts
-- ============================================================

DROP TABLE IF EXISTS escrow_deals CASCADE;
DROP TABLE IF EXISTS arena_entries CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS rounds CASCADE;
DROP TABLE IF EXISTS sbt_badges CASCADE;
DROP TABLE IF EXISTS task_requests CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. users (agent fields merged)
-- ============================================================
CREATE TABLE users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  address text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'requester' CHECK (role IN ('requester', 'agent', 'both')),
  avatar_url text,
  description text DEFAULT '',
  reputation numeric DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  total_tasks integer DEFAULT 0,
  skills text[] DEFAULT '{}',
  hourly_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. sbt_badges
-- ============================================================
CREATE TABLE sbt_badges (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. task_requests
-- ============================================================
CREATE TABLE task_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('smart-contract', 'frontend', 'data-analysis', 'audit', 'other')),
  budget numeric NOT NULL DEFAULT 0,
  deadline timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'disputed')),
  requester_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. proposals
-- ============================================================
CREATE TABLE proposals (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id text NOT NULL REFERENCES task_requests(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  estimated_days integer NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. rounds
-- ============================================================
CREATE TABLE rounds (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  round_number integer NOT NULL UNIQUE,
  prize numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'proposing' CHECK (status IN ('proposing', 'voting', 'active', 'completed')),
  selected_topic_id text,  -- FK added after topics table
  winner_id text REFERENCES users(id) ON DELETE SET NULL,
  on_chain_round_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. topics
-- ============================================================
CREATE TABLE topics (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  round_id text NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  proposer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  total_votes numeric DEFAULT 0,
  on_chain_topic_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add circular FK for rounds.selected_topic_id
ALTER TABLE rounds
  ADD CONSTRAINT rounds_selected_topic_id_fkey
  FOREIGN KEY (selected_topic_id) REFERENCES topics(id) ON DELETE SET NULL;

-- ============================================================
-- 7. arena_entries
-- ============================================================
CREATE TABLE arena_entries (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  round_id text NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_url text NOT NULL,
  description text DEFAULT '',
  demo_url text,
  on_chain_entry_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. escrow_deals
-- ============================================================
CREATE TABLE escrow_deals (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id text NOT NULL REFERENCES task_requests(id) ON DELETE CASCADE,
  requester_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'funded', 'completed', 'released', 'disputed', 'refunded')),
  on_chain_deal_id integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 9. Helper function: increment topic votes
-- ============================================================
CREATE OR REPLACE FUNCTION increment_votes(topic_id text, weight numeric)
RETURNS void AS $$
BEGIN
  UPDATE topics SET total_votes = total_votes + weight WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. RLS (allow all for hackathon)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbt_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sbt_badges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON task_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON arena_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON escrow_deals FOR ALL USING (true) WITH CHECK (true);
