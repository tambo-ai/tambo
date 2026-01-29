# Remix + Supabase Bookmark Manager

A Tambo template for building an AI-powered bookmark manager with Remix and Supabase.

### Screenshot

<img width="1915" height="1076" alt="image" src="https://github.com/user-attachments/assets/91c1c940-d64d-4894-9302-660b2eeca064" />

### Video demo

https://github.com/user-attachments/assets/d79c5dde-f58e-45d4-ae47-3f05c7328221

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Supabase account](https://supabase.com) (free tier works)
- [Tambo API key](https://tambo.co)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to **SQL Editor** and run the migration:

   ```sql
   -- Create bookmarks table
   CREATE TABLE bookmarks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     title TEXT,
     category TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Enable Row Level Security
   ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

   -- Users can only access their own bookmarks
   CREATE POLICY "Users can manage own bookmarks"
     ON bookmarks FOR ALL
     USING (auth.uid() = user_id);
   ```

   - Copy your **Project URL** and **anon key** from **Settings > API**

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SESSION_SECRET=any-random-string-for-cookies
   TAMBO_API_KEY=your-tambo-api-key
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

## What's Included

- **Remix** - Full-stack React framework with Vite
- **Supabase** - PostgreSQL database with email/password auth and Row Level Security
- **Tambo** - AI chat with streaming responses and generative UI components

## Tambo Integration

### Components

Three generative UI components registered in `app/tambo/components.ts`:

- `BookmarkCard` - Displays a single bookmark with favicon and category
- `BookmarkList` - Shows multiple bookmarks in a list
- `CategorySummary` - Visual breakdown of bookmark categories

### Tools

Seven tools for natural language bookmark management in `app/tambo/tools.ts`:

| Tool                          | Description                   |
| ----------------------------- | ----------------------------- |
| `add_bookmark`                | Save a new bookmark           |
| `search_bookmarks`            | Find bookmarks by keyword     |
| `update_bookmark`             | Edit bookmark properties      |
| `delete_bookmark`             | Remove a bookmark             |
| `categorize_bookmarks`        | Bulk update categories        |
| `get_uncategorized_bookmarks` | List items without categories |
| `get_category_stats`          | View category breakdown       |

## Project Structure

```
app/
├── components/
│   ├── bookmark-card.tsx       # Generative UI components
│   ├── message-thread-full.tsx # Chat interface with thread history
│   └── tambo-chat.client.tsx   # TamboProvider wrapper
├── tambo/
│   ├── components.ts           # Component registration
│   └── tools.ts                # Tool definitions
├── routes/
│   ├── chat.tsx                # Main chat page
│   ├── login.tsx               # Auth page
│   └── _index.tsx              # Landing page
└── lib/
    └── supabase.server.ts      # Supabase client
```

## Learn More

- [Tambo Docs](https://tambo.co/docs)
- [Remix Docs](https://remix.run/docs)
- [Supabase Docs](https://supabase.com/docs)
