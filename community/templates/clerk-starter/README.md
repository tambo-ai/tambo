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

## How Clerk Authentication Integrates with Tambo

This template demonstrates how to wire Clerk authentication into Tambo's runtime. The integration flow:

1. **Middleware** (`src/middleware.ts`): `clerkMiddleware()` establishes the Clerk session on every request
2. **Server Layout** (`src/app/layout.tsx`): `auth().getToken()` extracts the Clerk JWT token on the server
3. **Client Provider** (`src/app/client-layout.tsx`): The JWT is passed to `TamboProvider` as the `userToken` prop
4. **Tambo Runtime**: Tambo exchanges the Clerk JWT for a Tambo session token internally
5. **AI Messages**: All AI interactions are authenticated and scoped to the signed-in user

This ensures:
- AI messages are associated with the authenticated user
- AI-rendered components have access to user context
- Components are scoped to the signed-in user

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
