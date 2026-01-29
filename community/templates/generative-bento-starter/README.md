# Generative Bento Starter 🍱 (Supabase + Tambo)

A "Generative UI" starter for building CRUD apps where the interface adapts to the user's conversation. This template demonstrates a Bookmark Manager, but the pattern applies to any resource (Notes, Contacts, Products).

## ✨ The Pattern

1.  **Backend:** Supabase for data (Postgres).
2.  **Logic:** Tambo Tools for CRUD operations (`create`, `read`, `update`, `delete`).
3.  **UI:** Generative Components (`BookmarkList`) rendered by AI on demand.

## 🚀 Quick Start

1.  **Clone & Install:**

    ```bash
    git clone https://github.com/your-username/generative-bento.git
    cd generative-bento
    npm install
    ```

2.  **Setup Environment:**
    Copy `.env.local.example` to `.env.local` and add your keys:

    ```bash
    NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    ```

    _(Note: If you skip Supabase keys, the app runs in "Mock Mode" automatically!)_

3.  **Run:**

    ```bash
    npm run dev
    ```

4.  **Try it out:**
    - _"Show me my bookmarks."_
    - _"Save valid.com to my 'tools' list."_
    - _"Start a timer for 15 minutes."_ (Yes, we kept the timer widget!)

## 📂 Project Structure

```
src/
├── lib/
│   ├── supabase.ts       # Client + Mock Data Logic
│   └── tambo.ts          # 🧠 The Brain: Registers Tools & Components
├── components/
│   └── tambo/
│       └── bookmark-list.tsx  # The Generative UI Component
└── app/
    └── page.tsx          # Main Chat Interface
```

## 🛠️ How to Adapt This Template

### 1. Define Your Data

Change `src/lib/supabase.ts` to fetch your own data (e.g., `Todos`, `Notes`).

### 2. Create a Component

Build a React component in `src/components/tambo/` that displays your data.

- **Tip:** Use Tailwind for styling.
- **Tip:** Group related data (like a grid or list).

### 3. Register with Tambo

In `src/lib/tambo.ts`:

1.  Add your function to `tools` (so AI can fetch data).
2.  Add your component to `components` (so AI can render it).

```typescript
// Example Registration
export const tools = [
  {
    name: "getTodos",
    tool: getTodos,
    // ... Zod schemas
  },
];

export const components = [
  {
    name: "TodoList",
    component: TodoList,
    // ...
  },
];
```

## 📦 Tech Stack

- **Framework:** Next.js 15
- **AI:** Tambo SDK
- **Database:** Supabase
- **Styling:** Tailwind CSS v4
- **Validation:** Zod
