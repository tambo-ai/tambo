-- ============================================
-- Supabase Database Setup for Sessions App
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Step 1: Drop the old notes table if it exists (optional)
-- Only run this if you want to remove the old notes table
DROP TABLE IF EXISTS public.notes CASCADE;

-- Step 2: Create the sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy (single policy for all operations)
-- This replaces the old multiple policies with one unified policy
CREATE POLICY "Users can manage their own sessions"
  ON public.sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Verification Queries (optional)
-- ============================================

-- Check if table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'sessions';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'sessions';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'sessions';
