# Tambo AI Analytics Dashboard Template

A production-ready community template for building AI-powered dashboards using **Next.js**, **Supabase**, and **Tambo**.

## Features

- **Natural Language Data Management**: Query and insert records into Supabase using natural language.
- **Real-time Updates**: The dashboard automatically reflects changes made by the AI.
- **Tambo Integration**: Seamlessly integrated with `@tambo-ai/react`.
- **Vanilla CSS**: Clean, minimal, and dependency-free styling.

## Tech Stack

- **Framework**: [Next.js 16 ](https://nextjs.org/)
- **Database**: [Supabase](https://supabase.com/)
- **AI SDK**: [Tambo](https://tambo.co/)
- **Language**: TypeScript

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

You will need:
- **Supabase URL & Anon Key**: From your Supabase project settings.
- **Tambo API Key**: From your Tambo dashboard.

### 3. Database Setup

Run the following SQL in your Supabase SQL Editor to create the necessary table:

```sql
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value integer not null,
  category text not null,
  created_at timestamp with time zone default now()
);

-- Enable Realtime for the table
alter publication supabase_realtime add table analytics;
```

### 4. Run Locally

```bash
npm run dev
```
### 5. Demo Video

- [Tambo+Nextjs+Supabase](https://youtu.be/-copk50gGIQ)

### 6. Screenshots
 <img width="1295" height="635" alt="Screenshot 2026-01-27 184212" src="https://github.com/user-attachments/assets/03f85159-e0a7-4c80-b5c4-7172ff80cc87" />
 
---

 <img width="1292" height="609" alt="Screenshot 2026-01-27 184233" src="https://github.com/user-attachments/assets/903655af-9d66-49a4-a839-f3266599061b" />

## How it Works

### Tambo Tools
The AI assistant uses custom tools defined in `src/components/tambo/` to interact with your database:
- `queryRecords`: Allows the AI to fetch and summarize data.
- `addRecord`: Allows the AI to insert new data points based on user requests.

### Real-time Sync
The dashboard uses Supabase's `postgres_changes` subscription to listen for inserts and updates. Whenever the AI adds a record via a tool call, the UI updates instantly.
