A Next.js starter template that integrates Clerk authentication with Tambo's runtime-driven UI.

## Screenshot

![Chat interface with AI-rendered profile component](https://github.com/user-attachments/assets/d8489fbb-aed9-425a-90fc-ac2566d775ac)

## Video Demo

[Watch Demo Video](https://github.com/user-attachments/assets/d726fdc0-b0d6-45ef-b997-471256f50311)

## Prerequisites

- Node.js 18+
- Clerk account ([sign up](https://dashboard.clerk.com))
- Tambo API key ([get one](https://tambo.co/dashboard))

## Setup

1. Navigate to the template directory:

   ```bash
   cd community/templates/clerk-starter
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` and add your API keys:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   CLERK_SECRET_KEY=sk_test_YOUR_KEY
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Authentication Flow

This template demonstrates a proper Clerk → Tambo authentication integration.

1. Clerk authenticates the user
2. A Clerk JWT is extracted server-side
3. The JWT is passed to `TamboProvider.userToken`
4. Tambo exchanges it for a session token via `/oauth/token`
5. All AI messages and threads are authenticated and user-scoped

The demo video shows this flow end-to-end.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Clerk sign-in/sign-up pages
│   ├── chat/                # Protected chat page
│   ├── layout.tsx           # Server: Extract Clerk JWT, pass to Tambo
│   ├── client-layout.tsx    # Client: Bridge Clerk → Tambo auth
│   └── page.tsx             # Landing page
├── components/tambo/
│   ├── show-user-profile.tsx # Runtime-driven component
│   └── message-thread.tsx    # Chat interface
├── lib/
│   └── tambo.ts              # Component registry
└── middleware.ts             # Clerk middleware
```

## Documentation

- [Tambo Documentation](https://docs.tambo.co)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
