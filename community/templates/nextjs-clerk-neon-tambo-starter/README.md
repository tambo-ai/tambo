# Next.js + Clerk + Neon + Tambo Starter

A production-ready starter template demonstrating authenticated users interacting with AI to save and retrieve data from a database.

## Screenshot

![Tambo Notes App](./public/screenshot.png)

## Video Demo

[![Watch the demo](https://img.shields.io/badge/Watch-Demo-red?logo=youtube)](https://youtu.be/7m6TLkf8hTM)

Watch the full demo showing authentication, AI interaction, and database operations in action.

## What's Included

This template demonstrates the complete integration of:

- **Next.js 15** - App Router with Server Components for optimal performance
- **Clerk** - Complete authentication solution with sign-in/sign-up flows
- **Neon** - Serverless Postgres database for data persistence
- **Tambo AI** - Generative UI framework with local tools for AI-database interaction
- **Tailwind CSS** - Modern, responsive styling with dark mode support
- **TypeScript** - Full type safety with strict mode enabled

### Key Features

✅ Real authentication with Clerk  
✅ Real database operations with Neon  
✅ AI tools that interact with authenticated user data  
✅ Three Tambo tools: `saveUserNote`, `listUserNotes`, `deleteUserNote`  
✅ Clean, modern, responsive UI  
✅ Dark mode support  
✅ Full TypeScript strict mode  
✅ No hardcoded data or fake APIs

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 22+** and **npm 11+** installed
2. **Clerk Account** - Sign up at [clerk.com](https://clerk.com)
3. **Neon Account** - Sign up at [neon.tech](https://neon.tech)
4. **Tambo API Key** - Get your free key at [tambo.co/dashboard](https://tambo.co/dashboard)

## Setup

### 1. Clone and Install

```bash
cd community/templates/nextjs-clerk-neon-tambo-starter
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Tambo AI
NEXT_PUBLIC_TAMBO_API_KEY=tambo_...
```

#### Getting Your Clerk Keys

1. Go to [clerk.com/dashboard](https://clerk.com/dashboard)
2. Create a new application
3. Copy the "Publishable key" to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Copy the "Secret key" to `CLERK_SECRET_KEY`

#### Getting Your Neon Database URL

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string from your project dashboard
4. Paste it into `DATABASE_URL`

The database schema will be created automatically on first run.

#### Getting Your Tambo API Key

1. Go to [tambo.co/dashboard](https://tambo.co/dashboard)
2. Sign up for a free account
3. Generate a new API key
4. Copy it to `NEXT_PUBLIC_TAMBO_API_KEY`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test the Integration

1. **Sign up** for a new account (or sign in)
2. **Try these prompts** in the chat:
   - "Save a note: I need to buy groceries tomorrow"
   - "Show me all my notes"
   - "Save a note: Remember to call mom on Sunday"
   - "Delete note with ID 1"

The AI will use Tambo tools to save/retrieve your notes from the Neon database!

## How It Works

### Authentication Flow

1. User visits the app → Clerk middleware checks authentication
2. Unauthenticated users are redirected to `/sign-in`
3. After sign-in, users can access the main app

### AI → Database Flow

1. User sends a message: "Save a note: Buy milk"
2. Tambo AI recognizes the intent and calls the `saveUserNote` tool
3. Tool makes authenticated API call to `/api/notes`
4. API route verifies user with Clerk and saves to Neon
5. Database returns the saved note
6. AI confirms the action to the user

### Architecture

```
User Message
    ↓
Tambo AI (analyzes intent)
    ↓
Local Tool (saveUserNote/listUserNotes/deleteUserNote)
    ↓
Next.js API Route (/api/notes)
    ↓
Clerk Auth Check
    ↓
Neon Database (PostgreSQL)
    ↓
Response flows back up the chain
```

## Project Structure

```
nextjs-clerk-neon-tambo-starter/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── notes/
│   │   │       └── route.ts          # CRUD API for notes
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx          # Sign-in page
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.tsx          # Sign-up page
│   │   ├── layout.tsx                # Root layout with ClerkProvider
│   │   ├── page.tsx                  # Main app with TamboProvider
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   └── tambo/
│   │       └── tambo-chat.tsx        # Chat interface
│   ├── lib/
│   │   ├── db.ts                     # Neon database client & queries
│   │   └── tambo.ts                  # Tambo tools configuration
│   └── middleware.ts                 # Clerk authentication middleware
├── .env.example                      # Environment variables template
├── package.json
├── tsconfig.json                     # TypeScript config (strict mode)
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

All commands must pass before deploying:

- ✅ `npm run build` - Must complete successfully
- ✅ `npm run lint` - No errors
- ✅ `npm run typecheck` - No type errors

## Customization

### Adding New Tambo Tools

Edit `src/lib/tambo.ts` to add more tools:

```typescript
export const tools: TamboTool[] = [
  // ... existing tools
  {
    name: "myNewTool",
    description: "What this tool does",
    tool: async (params) => {
      // Your logic here
    },
    inputSchema: z.object({
      /* ... */
    }),
    outputSchema: z.object({
      /* ... */
    }),
  },
];
```

### Adding Database Tables

Edit `src/lib/db.ts` to add more tables:

```typescript
export async function initDatabase() {
  await sql`CREATE TABLE IF NOT EXISTS my_table (...)`;
  // ... more tables
}
```

### Styling

All styles use Tailwind CSS. Edit `src/app/globals.css` for global styles or use Tailwind classes directly in components.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy!

### Other Platforms

This is a standard Next.js app and works on any platform that supports Next.js 15:

- Netlify
- AWS Amplify
- Railway
- Render

## Troubleshooting

### "Unauthorized" errors

- Check that your Clerk keys are correct
- Make sure you're signed in
- Verify middleware is protecting the routes

### Database errors

- Verify your `DATABASE_URL` is correct
- Check that your Neon database is active
- Ensure the connection string includes `?sslmode=require`

### Tambo not responding

- Verify `NEXT_PUBLIC_TAMBO_API_KEY` is set
- Check browser console for errors
- Ensure you have credits in your Tambo account

## Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Clerk Documentation](https://clerk.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
