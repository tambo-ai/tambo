-- Migration: Create users table for the demo
-- This table stores user information for the Tambo AI chat demo

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for demo purposes
-- In production, replace with proper user-scoped policies
CREATE POLICY "Allow all operations for demo" ON public.users
  FOR ALL USING (true);

-- Add some sample data (optional)
-- INSERT INTO public.users (name, email) VALUES
--   ('Demo User', 'demo@example.com');
