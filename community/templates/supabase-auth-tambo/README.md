# Supabase Auth + Tambo AI Starter Template

A production-ready Next.js template combining **Supabase authentication**, **Tambo AI** (agentic reasoning), and **real database tools** for building intelligent, data-aware applications.

## Features

- ✅ **Secure Authentication** — Email/password signup & login with Supabase Auth
- ✅ **Database Tools** — Read/write user data via natural language using Tambo AI
- ✅ **Email Verification** — Built-in signup confirmation flow
- ✅ **Protected Routes** — Middleware-enforced auth, automatic redirects
- ✅ **RLS Policies** — Row-level security ensures users only access their own data

## Quick Start

### Prerequisites

- Node.js ≥22 (or use [mise](https://mise.jdx.dev) for automatic version management)
- npm ≥11
- Supabase account (free tier works great)
- Tambo API key (get at [tambo.ai](https://tambo.ai))

### 1. Clone & Install

```bash
git clone https://github.com/vivek-bandi/tambo community/templates/supabase-auth-tambo
cd community/templates/supabase-auth-tambo
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **Anon Key** from Settings → API
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TAMBO_API_KEY=your-tambo-api-key
```

4. **Create the database schema** — Go to Supabase SQL Editor and run [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
   - Creates `user_profiles` table
   - Sets up Row-Level Security (RLS) policies
   - Adds auto-updating `updated_at` trigger

### 3. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building!

## How It Works

### Authentication Flow

```
User signs up (email, password, name)
         ↓
Supabase Auth creates account (auth.users table)
         ↓
App inserts profile (user_profiles table)
         ↓
Email verification link sent
         ↓
User clicks link → Session created → Dashboard access
```

**Key points:**

- Passwords are hashed by Supabase (you never see them)
- Session persists in browser cookies
- Middleware enforces route protection
- `/login` and `/signup` redirect to `/dashboard` if already authenticated

### Database Tools

Users can ask the AI to read/write their profile data:

**"Show my profile"** → Calls `getUserProfile()` tool

- Fetches current user's name, email, note from database
- Returns formatted profile display

**"Save a note saying hello world"** → Calls `updateUserNote()` tool

- Writes to user's `note` column
- Auto-creates profile row if missing

**How it's secure:**

- Tools fetch `userId` from Supabase session (not user input)
- RLS policies prevent cross-user data access
- Each user can only read/write their own rows

### Architecture

```
┌─────────────────────────────────────────┐
│         Next.js 15 (App Router)         │
├─────────────────────────────────────────┤
│  /dashboard      /login      /signup    │
│  ├─ TamboProvider                       │
│  │  ├─ ChatInterface (streaming)        │
│  │  ├─ UserProfileCard (component)      │
│  │  └─ Sidebar (tips, tools, shortcuts) │
│  └─ DatabaseSetup (guide for new users) │
├─────────────────────────────────────────┤
│         Supabase Auth & Database        │
│  ├─ auth.users (managed by Supabase)   │
│  ├─ user_profiles (your table)         │
│  └─ RLS policies (user isolation)      │
├─────────────────────────────────────────┤
│  Tambo AI (tools via @tambo-ai/react)  │
│  ├─ getUserProfile (read tool)         │
│  ├─ updateUserNote (write tool)        │
│  └─ UserProfileCard (custom component) │
└─────────────────────────────────────────┘
```

## Key Files Explained

### `src/lib/supabase-tools.ts`

Defines Tambo tools that read/write Supabase:

```typescript
// Tool 1: Fetch user profile
export async function getUserProfile(): Promise<GetUserProfileOutput>;
// Gets userId from session, queries user_profiles, returns {name, email, note}

// Tool 2: Save user note
export async function updateUserNote(input: {
  note: string;
}): Promise<UpdateUserNoteOutput>;
// Gets userId from session, upserts user_profiles row, confirms success
```

Both tools are **self-authenticating** — they fetch the user from the session instead of relying on input parameters.

### `src/contexts/auth-context.tsx`

Manages Supabase auth state:

- `signUp()` — Creates auth user + profile row
- `signIn()` — Password-based login
- `signOut()` — Clears session
- `onAuthStateChange()` — Syncs auth state across tabs

### `src/app/dashboard/page.tsx`

Main app UI with:

- `TamboProvider` — Initializes Tambo with tools + components
- `ChatInterface` — Chat input + streaming responses
- Sidebar cards (Quick tips, Tooling, Shortcuts)
- Database setup guide (shown if `user_profiles` table missing)

## Common Tasks

### Add a New Tool

1. Create function in `src/lib/supabase-tools.ts`:

```typescript
export async function myNewTool(input: { param: string }): Promise<MyOutput> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Your logic here...
  return { result: "success" };
}
```

2. Register in `src/lib/tambo.ts`:

```typescript
export const tools = [
  {
    id: "myNewTool",
    handler: myNewTool,
    inputSchema: {
      type: "object",
      properties: {
        param: { type: "string", description: "Your param" },
      },
      required: ["param"],
    },
    description: "What your tool does",
  },
  // ... existing tools
];
```

3. Optionally add a custom React component in `components/tambo/` and register in `src/lib/tambo.ts`:

```typescript
export const components = [
  { id: "UserProfileCard", component: UserProfileCard },
  // ... existing components
];
```

### Customize Auth UI

Edit `src/components/auth/signup-form.tsx` and `login-form.tsx`:

- Change colors, spacing, field labels
- Add terms of service
- Add social login buttons (Google, GitHub, etc. via Supabase providers)

### Change Database Schema

1. Edit `DATABASE_SCHEMA.md` (add/remove columns)
2. Re-run SQL in Supabase SQL Editor
3. Update types in `src/types/supabase.ts` (optional, types inferred from DB)
4. Update `supabase-tools.ts` to match new schema

## Troubleshooting

### "Could not find table 'public.user_profiles'"

→ You haven't created the database schema yet. See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) and run the SQL in Supabase.

### "Missing NEXT_PUBLIC_TAMBO_API_KEY"

→ Your `.env.local` doesn't have `NEXT_PUBLIC_TAMBO_API_KEY`. Get one at [tambo.ai](https://tambo.ai).

### "Not authenticated" when calling tools

→ Your session expired. Log out and log back in, or clear cookies.

### Tools not appearing in chat

→ Check `src/lib/tambo.ts` — tools must be in the `tools` array with valid `id`, `handler`, `inputSchema`, `description`.

### UI looks broken after deployment

→ Tailwind CSS might not be built. Ensure `npm run build` succeeds locally first.

## Environment Variables

| Variable                        | Required | Example                      |
| ------------------------------- | -------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | `eyJ...` (long string)       |
| `NEXT_PUBLIC_TAMBO_API_KEY`     | Yes      | `sk_live_...`                |

All are public (prefixed with `NEXT_PUBLIC_`), so they can be exposed to the browser. **Never put secrets here** — use server-only env vars for sensitive data.

## Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Auth**: Supabase (email/password, session management, RLS)
- **Database**: PostgreSQL (Supabase-managed)
- **AI**: Tambo AI (@tambo-ai/react SDK)
- **Deployment**: Vercel, Netlify, or self-hosted Node.js

## Performance

- **First Load**: ~102KB (shared chunks) + page-specific code
- **Middleware**: <80KB (auth check on every request)
- **API**: Serverless functions (Supabase + Tambo API)
- **Database**: Indexed queries, RLS at database layer (no extra API calls)

## Security

- ✅ Passwords hashed by Supabase (never stored plaintext)
- ✅ RLS policies enforce user isolation at database level
- ✅ Session tokens in secure HTTP-only cookies
- ✅ Middleware validates auth before rendering protected pages
- ✅ Tools fetch userId from session, not user input
- ✅ Email verification prevents account takeover
- ✅ CSRF protection via Next.js built-in

## Contributing

This is a starter template! Feel free to:

- Add more tools (read/write other tables)
- Customize the UI (colors, fonts, layout)
- Add features (profile editing, payment, notifications, etc.)
- Deploy and share your own version

## License

MIT — Use this freely in your projects!

## Support

- **Tambo Docs**: [docs.tambo.ai](https://docs.tambo.ai)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Built with ❤️ for the Tambo community**
https://docs.tambo.co/](https://docs.tambo.co/
