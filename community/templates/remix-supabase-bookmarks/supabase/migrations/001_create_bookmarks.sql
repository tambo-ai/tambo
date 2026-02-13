-- Bookmarks table
-- Run this in your Supabase SQL editor to create the bookmarks table

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text,
  category text,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.bookmarks enable row level security;

-- Policy: Users can only see their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
create policy "Users can insert own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own bookmarks
create policy "Users can update own bookmarks"
  on public.bookmarks
  for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- Index for faster queries by user_id
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);

-- Index for faster queries by category
create index if not exists bookmarks_category_idx on public.bookmarks(category);
