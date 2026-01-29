# Supabase Auth + Tambo AI

Starter template demonstrating authenticated AI tools with Supabase, Tambo, and Row-Level Security.

## What This Demonstrates

**Authentication & Security**

- Supabase email/password authentication
- Row-Level Security at the database level
- Middleware-protected routes
- User-scoped AI tools that can't access other users' data

**Tambo Integration**

- AI tools calling server actions with database operations
- Components that self-fetch data (prevent AI narration)
- Proper `associatedTools` pattern linking tools to components
- Voice input via `useTamboVoice` hook

**Stack**

- Next.js 16 (App Router + Server Actions)
- Supabase (Auth + Postgres)
- Drizzle ORM (type-safe queries)
- Tambo AI React SDK
- Tailwind CSS v4

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Add your credentials to `.env.local`:

```env
NEXT_PUBLIC_TAMBO_API_KEY=tambo_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:6543/postgres
```

**Important:** Use the **Transaction Pooler** connection string (port 6543) from Supabase Settings > Database > Connection string > URI. For local Postgres, use port 5432.

### 3. Setup Database

```bash
npm run db:push
npm run db:init
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to sign up and start chatting.

## Architecture

### How Tools Work with Auth

Tools are created per-user with their `userId` bound at creation time:

```typescript
// src/lib/tambo/tambo.ts
export function createTools(
  userId: string,
  userEmail: string,
  userName?: string,
) {
  return [
    {
      name: "getUserProfile",
      tool: async () => {
        await getUserProfileById(userId, userEmail, userName);
        return {}; // Component fetches its own data
      },
      // ...
    },
  ];
}
```

**Why?** Server actions called through Tambo don't have access to cookies for auth. By binding the `userId` when creating tools, each tool invocation is automatically scoped to the correct user.

### Component Self-Fetching Pattern

Components fetch their own data to prevent redundant AI narration:

```typescript
// Component receives empty props from tool
export function UserProfileCard() {
  useEffect(() => {
    // Self-fetch data using authenticated server action
    const data = await getCurrentUserProfile();
    setProfile(data);
  }, []);
  // ...
}
```

**Why?** Without this pattern, you get:

1. AI narration: "Let me retrieve your profile..."
2. Tool output: `{"name": "John", "email": "john@example.com"}`
3. Component display: [Profile Card]

With self-fetching, tools return `{}` and components independently fetch data. The AI only shows the component.

### Linking Tools to Components

Use the `associatedTools` property to tell Tambo which component to render when tools are called:

```typescript
export function createComponents(userId, userEmail, userName) {
  const tools = createTools(userId, userEmail, userName);

  return [
    {
      name: "UserProfileCard",
      component: UserProfileCard,
      propsSchema: z.object({}),
      associatedTools: tools, // Links both tools to this component
    },
  ];
}
```

This is the proper SDK pattern - don't try to link tools via descriptions.

### Security Layers

1. **Middleware** - Redirects unauthenticated users from `/dashboard`
2. **User-bound tools** - Tools created with explicit `userId` parameter
3. **Server action validation** - Each action validates the authenticated user
4. **Row-Level Security** - Database enforces access control via JWT claims

## Available Tools

**getUserProfile**

- Displays the user's profile card with name, email, and note
- Returns empty object `{}` - component self-fetches data

**updateUserNote**

- Updates the user's saved note (max 500 characters)
- Validates input, performs database update
- Returns empty object `{}` - component re-fetches to show updates

## Project Structure

```
src/
├── app/
│   ├── dashboard/page.tsx    # Protected chat interface
│   ├── login/page.tsx        # Login form
│   └── signup/page.tsx       # Signup form
├── components/tambo/
│   ├── user-profile-card.tsx # Self-fetching profile component
│   ├── message-input.tsx     # Chat input with voice support
│   └── message.tsx           # Message display with {} filtering
├── lib/tambo/
│   └── tambo.ts              # Tools & components registration
├── server/
│   ├── actions.ts            # Server actions for tools
│   ├── queries.ts            # Database queries
│   └── db/schema.ts          # Drizzle schema with RLS
└── middleware.ts             # Route protection
```

## Extending the Template

### Add a New Tool

1. Create the server action in `src/server/actions.ts`:

```typescript
export async function myNewAction(userId: string, input: MyInput) {
  const supabase = await createClient();
  // Validate user, perform operations
  return result;
}
```

2. Register the tool in `src/lib/tambo/tambo.ts`:

```typescript
export function createTools(
  userId: string,
  userEmail: string,
  userName?: string,
) {
  return [
    // ... existing tools
    {
      name: "myNewTool",
      description: "What this tool does",
      tool: async (input: MyInput) => {
        return await myNewAction(userId, input);
      },
      inputSchema: z.object({
        field: z.string().describe("Field description"),
      }),
      outputSchema: z.object({
        /* ... */
      }),
    },
  ];
}
```

### Add a New Component

1. Create component in `src/components/tambo/my-component.tsx`
2. Register in `src/lib/tambo/tambo.ts`:

```typescript
export function createComponents(userId, userEmail, userName) {
  const tools = createTools(userId, userEmail, userName);

  return [
    // ... existing components
    {
      name: "MyComponent",
      component: MyComponent,
      propsSchema: z.object({
        /* ... */
      }),
      associatedTools: [], // Or link to specific tools
    },
  ];
}
```

## Voice Input

The template includes voice input via Tambo's `useTamboVoice` hook. Click the microphone icon and try:

- "Show my profile"
- "Add a note: I prefer morning meetings"
- "Update my note to: Available Monday through Friday"
- "What tools do you have?"

## Learn More

- [Tambo Documentation](https://tambo.co/docs) - AI components and tools
- [Supabase Docs](https://supabase.com/docs) - Authentication and database
- [Next.js Docs](https://nextjs.org/docs) - App Router and Server Actions
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe SQL queries
