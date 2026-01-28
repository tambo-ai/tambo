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
 <img width="1363" height="597" alt="Screenshot 2026-01-28 062316" src="https://github.com/user-attachments/assets/f38f0fe9-7817-4d5b-b04d-0c3f54b93e8d" />

---

 <img width="1365" height="601" alt="Screenshot 2026-01-28 062332" src="https://github.com/user-attachments/assets/b16cd817-7c8a-4c2e-ba43-0550ad36e38c" />


## How it Works

### Tambo Tools
The AI assistant uses custom tools defined in `src/components/tambo/` to interact with your database:
- `queryRecords`: Allows the AI to fetch and summarize data.
- `addRecord`: Allows the AI to insert new data points based on user requests.

### Real-time Sync
The dashboard uses Supabase's `postgres_changes` subscription to listen for inserts and updates. Whenever the AI adds a record via a tool call, the UI updates instantly.

## Contributing

This is a community template. Feel free to submit PRs to improve it!
