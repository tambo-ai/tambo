# Remix + Supabase Bookmark Manager

An AI-powered bookmark manager built with Remix, Supabase, and Tambo.

Save, organize, and search your bookmarks using natural language. The AI assistant can automatically categorize your links, find saved articles, and help manage your collection.

### Screenshot
<img width="1916" height="1079" alt="Screenshot 2026-01-28 140640" src="https://github.com/user-attachments/assets/4e0f1e40-c380-4e72-8ca5-7b9a2acf2b24" />


### Video demo
https://github.com/user-attachments/assets/73c55390-c3db-4f47-b558-4f728f62304d

## What's Included

- **Remix** - Full-stack React framework with server-side rendering
- **Supabase** - PostgreSQL database with authentication
- **Tambo** - AI-powered chat interface for managing bookmarks
- **Tailwind CSS** - Utility-first styling

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Tambo](https://tambo.co) API key

## Setup

### 1. Clone and install dependencies

```bash
cd community/templates/remix-supabase-bookmarks
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration in `supabase/migrations/001_create_bookmarks.sql`
3. Go to **Settings > API** and copy your Project URL and `anon` public key

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SESSION_SECRET=any-random-string-here
TAMBO_API_KEY=your-tambo-api-key
```

Get your Tambo API key from [tambo.co](https://tambo.co).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

## Features

### Phase 1 ✅

- [x] User authentication (sign up / sign in)
- [x] Add bookmarks manually with URL, title, and category
- [x] View and delete bookmarks
- [x] Row-level security (users only see their own bookmarks)

### Phase 2 ✅

- [x] Tambo AI chat integration
- [x] Natural language bookmark creation ("Save this React article")
- [x] Search bookmarks ("Find my cooking recipes")
- [x] Bulk categorization ("Categorize all uncategorized links")
- [x] Delete bookmarks via chat

### Phase 3 ✅

- [x] Generative UI components (BookmarkCard, BookmarkList, CategorySummary)
- [x] AI renders visual bookmark cards in chat responses
- [x] Category statistics visualization

## Project Structure

```
app/
├── components/
│   ├── bookmark-card.tsx    # Generative UI components for chat
│   ├── chat-panel.tsx       # AI chat sidebar component
│   └── tambo-chat.client.tsx # Client-only Tambo wrapper
├── lib/
│   ├── database.types.ts    # TypeScript types for Supabase
│   ├── session.server.ts    # Cookie session management
│   ├── supabase.client.ts   # Browser Supabase client
│   └── supabase.server.ts   # Server Supabase client
├── routes/
│   ├── _index.tsx           # Landing page
│   ├── bookmarks.tsx        # Main bookmarks page with AI chat
│   ├── login.tsx            # Auth page
│   └── logout.tsx           # Logout action
├── tambo/
│   ├── components.ts        # Tambo component registry
│   └── tools.ts             # AI tools for bookmark operations
├── root.tsx                 # App shell
└── tailwind.css             # Global styles
```

## AI Tools

The template includes these Tambo tools:

| Tool                          | Description                           | Example prompts                        |
| ----------------------------- | ------------------------------------- | -------------------------------------- |
| `add_bookmark`                | Save a new bookmark                   | "Save https://remix.run as Remix Docs" |
| `search_bookmarks`            | Find bookmarks by keyword or category | "Find my React articles"               |
| `update_bookmark`             | Edit title, URL, or category          | "Rename that bookmark to 'New Title'"  |
| `categorize_bookmarks`        | Update bookmark categories            | "Categorize these as Tech"             |
| `delete_bookmark`             | Remove a bookmark                     | "Delete that bookmark"                 |
| `get_uncategorized_bookmarks` | List uncategorized items              | "Show uncategorized bookmarks"         |
| `get_category_stats`          | View category breakdown               | "Show my categories"                   |
