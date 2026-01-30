# Tambo SupaBase Nextjs Starter Template

A production-ready community template for building AI-powered dashboards using **Next.js**, **Supabase**, and **Tambo**.

## Features

- **Natural Language Data Management**: Query and insert records into Supabase using natural language.
- **Real-time Updates**: The dashboard automatically reflects changes made by the AI.
- **Tambo Integration**: Seamlessly integrated with `@tambo-ai/react`.
- **Tailwind CSS**: Clean, minimal, and dependency-free styling.

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

Copy `example.env.local` to `.env.local` and fill in your credentials

```bash
cp example.env.local .env.local
```

You will need:
- **Supabase URL & Anon Key**: From your Supabase project settings.
- **Tambo API Key**: From your Tambo dashboard.

### 3. Database Setup

Run the following SQL in your Supabase SQL Editor to create the necessary table:

```sql
create table analytics (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  label text not null,
  value numeric not null,
  category text not null
);

-- Enable Realtime for the table
alter publication supabase_realtime add table analytics;
```

### 4. Run Locally

```bash
npm run dev
```
### 5. Demo Video

- [Tambo+Nextjs+Supabase](https://youtu.be/U5AOfX0DVtA)
  
### 6. Screenshots
 <img width="1316" height="648" alt="Screenshot 2026-01-30 022143" src="https://github.com/user-attachments/assets/60bb2e80-825f-4902-9a31-a0aad8b2d86c" />

---

 <img width="759" height="476" alt="Screenshot 2026-01-30 053505" src="https://github.com/user-attachments/assets/15924b4c-f2a7-45bb-9312-101ae579241a" />


## How it Works

### Tambo Tools
The AI assistant uses custom tools defined in `src/components/tambo/` to interact with your database:
- `queryRecords`: Allows the AI to fetch and summarize data.
- `addRecord`: Allows the AI to insert new data points based on user requests.

### Real-time Sync
The dashboard uses Supabase's `postgres_changes` subscription to listen for inserts and updates. Whenever the AI adds a record via a tool call, the UI updates instantly.

## Contributing

This is a community template. Feel free to submit PRs to improve it!
