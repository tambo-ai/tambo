# Tambo AI Notes App Template

An AI-powered notes application that lets users create and manage notes using natural language, with real-time synchronization powered by Convex and authentication via Clerk. Uses a **neutral design** (grays, whites, subtle accents) and **side-by-side layout** on desktop so notes stay visible while you chat.

## Prerequisites

Before you begin, you'll need:

- **Node.js 22+** and **npm 11+** installed
- A **Tambo AI account** (sign up at [tambo.co](https://tambo.co) - free tier available)
- A **Clerk account** (sign up at [clerk.com](https://clerk.com) - free tier available)
- A **Convex account** (sign up at [convex.dev](https://convex.dev) - free tier available)

## Setup Steps

### 1. Navigate to the template directory

```bash
cd community/templates/tambo-nextjs-clerk-convex-template
```

### 2. Install dependencies

```bash
npm install
```

Use the **latest `@tambo-ai/react`** (e.g. `npm install @tambo-ai/react@latest`). The z.record validation fix is in the latest release; do not copy workarounds from `apps/web/lib/tambo/tools/` into this template.

### 3. Get your Tambo AI API key

1. Sign up or log in at [tambo.co](https://tambo.co)
2. Go to Dashboard → Your Project → API Keys
3. Copy your API key

### 4. Get your Clerk credentials

1. Sign up or log in at [clerk.com](https://clerk.com)
2. Create a new application or use an existing one
3. Go to API Keys and copy:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)
4. Go to JWT Templates and copy the JWT Issuer Domain (e.g., `https://your-app.clerk.accounts.dev`)

### 5. Get your Convex deployment URL

1. Sign up or log in at [convex.dev](https://convex.dev)
2. Create a new project
3. Install Convex CLI:
   ```bash
   npm install -g convex
   ```
4. Link your project:
   ```bash
   npx convex dev
   ```
5. Copy the deployment URL shown in the terminal (e.g., `https://your-project.convex.cloud`)

### 6. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=dev
NEXT_PUBLIC_TAMBO_API_KEY=tambo_your_key_here
```

### 7. Start Convex development server

In a separate terminal:

```bash
npx convex dev
```

Keep this running while developing.

### 8. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Included

This template includes the following technologies and their purposes:

- **Next.js 16** - React framework with App Router for server-side rendering and routing
- **Clerk** - Authentication and user management (handles sign-in, user sessions, and JWT tokens)
- **Convex** - Real-time backend database (stores notes, provides instant sync across clients, handles queries and mutations)
- **Tambo AI** - AI-powered generative UI (renders interactive components based on natural language, provides chat interface for note creation)
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **shadcn/ui** - Accessible React component library (buttons, dialogs, cards, drawers, etc.)
- **React 19** - Latest React features and performance improvements

## Features

- 🤖 **AI-Powered Note Creation**: Create notes by describing them in natural language
- 🎤 **Voice Input**: Use the microphone in the chat input (via `useTamboVoice` and the dictation button) to speak notes
- 📝 **Manual Note Creation**: Form-based note creation from the header
- ✏️ **Editable Notes**: Click any note to edit title and content
- 📌 **Pin & Archive**: Organize notes with pin and archive features
- 🔄 **Real-time Sync**: Notes and chat side-by-side on desktop so you see Convex updates while chatting
- 🎯 **Type-Safe**: Full TypeScript support with auto-generated Convex types

## Project Structure

```
tambo-nextjs-clerk-convex-template/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main page
├── components/
│   ├── providers/         # React context providers
│   │   ├── convex-provider.tsx    # Convex + Clerk integration
│   │   └── tambo-provider.tsx     # Tambo AI provider
│   ├── tambo/             # Tambo AI components
│   │   ├── ai-notes-page.tsx      # Main page (side-by-side layout)
│   │   ├── ask-tambo-sheet.tsx    # AI chat panel (inline on desktop, drawer on mobile)
│   │   ├── ask-tambo-trigger.tsx  # Button to open chat
│   │   ├── chat-input.tsx         # Chat input + voice (dictation-button)
│   │   ├── create-note-dialog.tsx # Manual note creation
│   │   ├── dictation-button.tsx   # Voice input (useTamboVoice)
│   │   ├── edit-note-dialog.tsx   # Note editing
│   │   ├── message-list.tsx       # AI conversation display
│   │   ├── note-card.tsx          # Individual note card
│   │   └── notes-grid.tsx         # Notes grid layout
│   └── ui/                # shadcn/ui components
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema definition
│   ├── notes.ts           # Database queries and mutations
│   └── auth.config.ts     # Clerk authentication config
├── lib/
│   ├── tambo/
│   │   ├── index.ts       # Tambo component registry
│   │   └── tools.ts       # Tambo AI tools (createNote, updateNote, deleteNote)
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Troubleshooting

### Convex Types Not Updating

If you see TypeScript errors about missing Convex types:

```bash
npx convex dev
```

This regenerates the types automatically.

### Clerk Authentication Not Working

- Verify your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct
- Ensure `CLERK_JWT_ISSUER_DOMAIN` matches your Clerk dashboard
- Check that your Clerk app is in development mode for localhost

### Tambo AI Not Responding

- Verify your `NEXT_PUBLIC_TAMBO_API_KEY` is correct
- Check that your Tambo project is active
- Ensure you have API credits available

### Notes Not Appearing

- Make sure `npx convex dev` is running
- Check that your Convex deployment URL is correct
- Verify you're signed in with Clerk

## Learn More

- [Tambo AI Documentation](https://docs.tambo.co)
- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This template is created by **Honey Paptan** and is available for commercial and personal use. You are free to use, modify, and distribute this template for any purpose, including commercial projects.
