A minimal Next.js starter template with Clerk authentication and Tambo AI integration.

## Screenshots

![App Screenshot](https://github.com/user-attachments/assets/d8489fbb-aed9-425a-90fc-ac2566d775ac)

## Video Demo

[Watch Demo Video](https://github.com/user-attachments/assets/d726fdc0-b0d6-45ef-b997-471256f50311) 



## What's Included

- **Next.js 14** with App Router
- **Clerk** authentication with middleware protection
- **Tambo** AI-powered generative UI
- **TypeScript** with strict mode
- **Tailwind CSS** for styling

## Prerequisites

- Node.js 18+
- [Clerk account](https://dashboard.clerk.com) (free tier available)
- [Tambo API key](https://tambo.co/dashboard)

## Setup

1. Navigate to the template:

   ```bash
   cd community/templates/clerk-starter
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Add your API keys to `.env.local`:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   CLERK_SECRET_KEY=sk_test_YOUR_KEY
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Clerk sign-in/sign-up pages
│   ├── chat/                # Protected chat page
│   ├── layout.tsx           # Root layout with Clerk token
│   ├── client-layout.tsx    # Client providers (Clerk + Tambo)
│   └── page.tsx             # Landing page
├── components/tambo/
│   ├── show-user-profile.tsx # Tambo component
│   └── message-thread.tsx    # Chat interface
├── lib/
│   └── tambo.ts              # Tambo component registration
└── middleware.ts             # Route protection
```

## Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
