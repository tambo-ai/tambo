-- Run this in your Supabase SQL Editor

create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  url text not null,
  tags text[] -- Array of strings
);

-- Enable Row Level Security (RLS)
alter table bookmarks enable row level security;

-- Policy: Allow anyone to view bookmarks (for demo purposes)
-- In production, you'd want to restrict this to authenticated users
create policy "Enable read access for all users"
on "public"."bookmarks"
as PERMISSIVE
for SELECT
to public
using (true);

-- Policy: Allow anyone to insert bookmarks (for demo purposes)
create policy "Enable insert access for all users"
on "public"."bookmarks"
as PERMISSIVE
for INSERT
to public
with check (true);

-- Policy: Allow anyone to update/delete bookmarks (for demo purposes)
create policy "Enable all access for all users"
on "public"."bookmarks"
as PERMISSIVE
for ALL
to public
using (true);
