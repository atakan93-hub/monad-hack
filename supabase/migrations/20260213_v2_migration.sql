-- TaskForge V2 Migration
-- Run this manually in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- All changes are additive and non-destructive.

-- 1. rounds: add creator column
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS creator TEXT;

-- 2. rounds: update status CHECK to include 'judging'
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_status_check;
ALTER TABLE rounds ADD CONSTRAINT rounds_status_check
  CHECK (status IN ('proposing','voting','active','judging','completed'));

-- 3. topics: add is_winning column
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_winning BOOLEAN DEFAULT false;

-- 4. users: add erc8004_agent_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS erc8004_agent_id INTEGER;

-- 5. direct_requests table
CREATE TABLE IF NOT EXISTS direct_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES users(id),
  agent_id TEXT REFERENCES users(id),
  client_address TEXT NOT NULL,
  agent_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  escrow_id TEXT REFERENCES escrow_deals(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','escrow_created','funded','completed','released','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS for direct_requests
ALTER TABLE direct_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON direct_requests FOR ALL USING (true) WITH CHECK (true);

-- 7. Unique pending index
CREATE UNIQUE INDEX IF NOT EXISTS direct_requests_unique_pending
  ON direct_requests (client_address, agent_address) WHERE status = 'pending';
