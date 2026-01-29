# Generative Bento Starter 🍱

> **Next.js + Supabase + Tambo AI + Tailwind CSS**

A premium "Generative UI" starter kit for building context-aware CRUD applications. This template demonstrates a **Context-Aware Bookmark Manager**, but the underlying pattern (Generative List + AI Tools) can be adapted for any resource type (Notes, Contacts, Products, etc.).

<div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
  <img src="/screenshot-1.png" height="300" alt="Generative Bento Screenshot 1" />
  <img src="/screenshot-2.png" height="300" alt="Generative Bento Screenshot 2" />
  <img src="/screenshot-3.png" height="300" alt="Generative Bento Screenshot 3" />
</div>

<video src="/demo.mp4" controls width="100%"></video>

## 📂 Project Structure

```bash
├── public/              # Static assets (images, icons)
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── chat/        # Chat interface
│   │   ├── page.tsx     # Main dashboard
│   │   └── layout.tsx   # Root layout & providers
│   ├── components/
│   │   ├── tambo/       # AI-generative components (<BookmarkList>)
│   │   └── theme-toggle # UI components
│   └── lib/
│       ├── supabase.ts  # Supabase client & CRUD functions
│       └── tambo.ts     # AI Tools registry
├── tailwind.config.ts   # Styling configuration
└── supabase-schema.sql  # Database setup script
```

## ✨ Features

- **✨ Generative UI:** The AI intelligently decides _when_ and _customizes_ how to show your data (e.g., Grid View vs List View).
- **🗄️ Supabase Backend:** Production-ready PostgreSQL database with RLS policies security.
- **🤖 AI Agent Tools:** Pre-configured tools for `Create`, `Read`, `Update`, `Delete` actions via natural language.
- **🌗 Dark/Light Mode:** First-class theme support with system preference detection and manual toggle.
- **⚡ Real-time Interactivity:** UI updates instantly as you chat or modify data.
- **🎨 Premium Bento Design:**
  - Glassmorphism effects & blur backgrounds
  - Smooth `framer-motion` entrance animations
  - Responsive Grid Layout
- **🛡️ Fallback Support:** Gracefully degrades to "Mock Mode" if no API keys are present (great for testing).

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
