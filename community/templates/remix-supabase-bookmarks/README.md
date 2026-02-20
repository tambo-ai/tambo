# Remix + Supabase Bookmark Manager

A Tambo template for building an AI-powered bookmark manager with Remix and Supabase.

### Screenshot

<img width="1919" height="1078" alt="image" src="https://github.com/user-attachments/assets/c9f032fb-0a8a-458f-8733-5f5dca5bff32" />

### Video demo

https://github.com/user-attachments/assets/29d57415-a1ac-46f4-9f9e-cfbf8d3c20fb

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Supabase account](https://supabase.com) (free tier works)
- [Tambo API key](https://tambo.co)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase Database**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to **SQL Editor** and run the following migration:

   ```sql
   -- Create bookmarks table
   CREATE TABLE IF NOT EXISTS public.bookmarks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     title TEXT,
     category TEXT,
     created_at TIMESTAMPTZ DEFAULT now() NOT NULL
   );

   -- Enable Row Level Security
   ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

   -- Policy: Users can view their own bookmarks
   CREATE POLICY "Users can view own bookmarks"
     ON public.bookmarks
     FOR SELECT
     USING (auth.uid() = user_id);

   -- Policy: Users can insert their own bookmarks
   CREATE POLICY "Users can insert own bookmarks"
     ON public.bookmarks
     FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- Policy: Users can update their own bookmarks
   CREATE POLICY "Users can update own bookmarks"
     ON public.bookmarks
     FOR UPDATE
     USING (auth.uid() = user_id);

   -- Policy: Users can delete their own bookmarks
   CREATE POLICY "Users can delete own bookmarks"
     ON public.bookmarks
     FOR DELETE
     USING (auth.uid() = user_id);

   -- Indexes for faster queries
   CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);
   CREATE INDEX IF NOT EXISTS bookmarks_category_idx ON public.bookmarks(category);
   ```

   > **Note**: The complete migration file is also available at `supabase/migrations/001_create_bookmarks.sql`
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

4. **Configure Tambo authentication**

   ⚠️ **Important**: Supabase doesn't support OpenID Connect auto-discovery for JWT verification.
   1. Go to your [Tambo dashboard](https://tambo.ai/dashboard)
   2. Navigate to **Settings > User Authentication**
   3. Under **Validation Mode**, select **"None"**
   4. Click **Save**

   Without this configuration, user authentication will fail and threads won't be properly scoped to individual users.

5. **Run the app**

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
