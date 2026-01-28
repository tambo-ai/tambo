# Supabase Auth + Tambo AI

Minimal Next.js starter demonstrating authenticated AI tools with Supabase and Tambo.

# Shots

<img width="1680" height="1050" alt="Screenshot 2026-01-28 at 6 06 22 PM" src="https://github.com/user-attachments/assets/38a2b054-c99e-45d9-b9f0-b187a77f5be5" />

---

<img width="1680" height="1050" alt="Screenshot 2026-01-28 at 6 07 20 PM" src="https://github.com/user-attachments/assets/f0063f7d-8b5e-4639-867a-f49821b75ab3" />

---

https://github.com/user-attachments/assets/bf5adac0-5c4a-448d-a1ca-ba14f24f5d08

## What It Shows

- **Supabase Auth** - Email/password signup and login
- **Row-Level Security** - Database-level auth enforcement via Drizzle
- **Tambo Tools** - `getUserProfile`, `updateUserNote` with real database operations
- **AI Components** - `UserProfileCard` component rendered by AI

## Quick Start

### 1. Setup Environment

```bash
npm install
cp .env.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_TAMBO_API_KEY=tambo_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:6543/postgres
```

> For Supabase, use the **Transaction Pooler** connection string from Settings > Database > URI (port 6543). For local Postgres, use port 5432.

### 2. Initialize Database

```bash
npm run db:push
npm run db:init
```

### 3. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to sign up and start chatting with AI using authenticated tools.

## How It Works

### Tools

The AI has access to two tools:

- **getUserProfile** - Returns user's profile data (name, email, note)
- **updateUserNote** - Updates the user's note in the database

### Components

The AI can render:

- **UserProfileCard** - Displays user profile data in a formatted layout

### Security

1. **User-Bound Tools** - Tools automatically use the authenticated user's ID
2. **Server Actions** - Tools call Next.js Server Actions which validate the user
3. **Row-Level Security** - Database queries enforce RLS via JWT claims
4. **Protected Routes** - `/dashboard` is protected by middleware

The AI cannot access other users' data because tools are bound to the authenticated user's ID and RLS enforces database-level access control.

## Tech Stack

- **Next.js 16** - App Router, Server Actions
- **Tambo AI** - AI tools and components
- **Supabase** - Auth and Postgres database
- **Drizzle ORM** - Type-safe database queries
- **Tailwind CSS v4** - Styling

## How to Extend

### Add a New Tool

1. **Register the tool** in `src/lib/tambo/tambo.ts`:

```typescript
{
  name: "myNewTool",
  description: "What this tool does",
  tool: async (input: MyInputType) => myNewTool(userId, input),
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ }),
}
```

2. **Implement the handler** in `src/server/actions.ts`:

```typescript
export async function myNewTool(userId: string, input: MyInputType) {
  // Validate user has access
  // Database operations here
  return result;
}
```

### Add a New Component

1. **Create the component** in `src/components/tambo/my-component.tsx`
2. **Register it** in `src/lib/tambo.ts`:

```typescript
components: [{ name: "MyComponent", component: MyComponent }];
```

The AI will automatically be able to render it.

## Files

- `src/app/dashboard/page.tsx` - Chat UI with Tambo integration
- `src/lib/tambo.ts` - Tools and components registration
- `src/server/actions.ts` - Server-side tool implementations
- `middleware.ts` - Route protection for `/dashboard`
- `src/server/db/schema.ts` - Database schema with RLS

## Learn More

- [Tambo Docs](https://tambo.co/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
