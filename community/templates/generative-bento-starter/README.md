# Generative Bento Starter 🍱

> **Next.js + Supabase + Tambo AI + Tailwind CSS**

A premium "Generative UI" starter kit for building context-aware CRUD applications. This template demonstrates a **Context-Aware Bookmark Manager**, but the underlying pattern (Generative List + AI Tools) can be adapted for any resource type (Notes, Contacts, Products, etc.).

## ✨ Features

- **Generative UI:** The AI dynamically renders components (like `<BookmarkList />`) inside the chat based on your conversation.
- **Supabase Backend:** Fully configured for data persistence with Row Level Security (RLS) policies.
- **AI-Powered CRUD:** Natural language tools to `create`, `read`, `update`, and `delete` records.
- **Premium Design:**
  - Glassmorphism styling
  - Framer Motion animations
  - Light/Dark mode toggle (System preference support)
- **Mock Mode:** Works out-of-the-box without API keys for quick demos.

## 🚀 Quick Start

1.  **Clone the repo:**

    ```bash
    git clone https://github.com/your-username/generative-bento-starter.git
    cd generative-bento-starter
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env.local` file with your credentials:

    ```bash
    NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_key
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    ```

    _(If you skip Supabase keys, the app will run in "Mock Mode" using local data)._

3.  **Run Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.

4.  **Database Setup (Optional but Recommended):**
    Run the provided SQL script in your Supabase Dashboard's SQL Editor to create the `bookmarks` table:
    - File: `supabase-schema.sql`

## 🛠️ How it Works

### 1. The Data Layer (`src/lib/supabase.ts`)

We export standard async functions to interact with Supabase. These are just normal TypeScript functions!

```typescript
export async function createBookmark(bookmark) { ... }
export async function deleteBookmark(id) { ... }
```

### 2. The AI Tools (`src/lib/tambo.ts`)

We register these functions as "Tools" so the AI knows how to use them.

```typescript
export const tools = [
  {
    name: "createBookmark",
    description: "Save a new bookmark",
    tool: createBookmark, // <--- The function from above
    // ...
  },
];
```

### 3. The Generative UI (`src/components/tambo/bookmark-list.tsx`)

We create a standard React component to display the data. The AI decides _when_ to show this component based on the user's request.

## 📦 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI SDK:** Tambo
- **Database:** Supabase (Postgres)
- **Styling:** Tailwind CSS, Lucide Icons
- **Animations:** Framer Motion
- **Theming:** next-themes

## 📄 License

MIT
