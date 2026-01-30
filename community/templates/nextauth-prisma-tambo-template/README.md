# NextAuth + Prisma + Tambo Template

> A starter Next.js template with Tambo AI pre-configured to accelerate your AI-powered application development.

A natural language ticketing system built with **Tambo AI**, **Prisma**, and **NextAuth**. Use this template as a foundation to quickly build AI-powered applications with authentication, database persistence, and conversational interfaces.

## ScreenShots

## <img width="1920" height="929" alt="Screenshot From 2026-01-30 02-04-42" src="https://github.com/user-attachments/assets/6d63aeaf-b5ae-449c-a0bd-5dfa641a7601" />

## <img width="1920" height="929" alt="Screenshot From 2026-01-30 02-04-46" src="https://github.com/user-attachments/assets/b5a07b1a-eaf8-47a8-aaf2-b861e51bfc9a" />

## <img width="1920" height="929" alt="Screenshot From 2026-01-30 02-05-01" src="https://github.com/user-attachments/assets/ea4d65d1-ad3e-4c41-bc28-1590ae0adf41" />

<img width="1920" height="929" alt="Screenshot From 2026-01-30 02-05-27" src="https://github.com/user-attachments/assets/a8f921ae-4f88-44d0-a60d-2be5f076e749" />

## Video Link

https://youtu.be/L9T2ZLSfF98

## Pre Requisites

- Node.js 18+
- PostgreSQL database
- Tambo API key ([get one here](https://tambo.ai))
- OAuth credentials (Google and/or GitHub)

### Setup

1. **Set up environment variables**

Copy the example environment file and fill in your credentials:

```bash
cp example.env .env
```

Configure the following in your `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Tambo AI
NEXT_PUBLIC_TAMBO_API_KEY="your-tambo-api-key"
```

2. **Set up the database**

```bash
npx prisma migrate dev
```

Or just generate the Prisma client (if migrations are problematic):

```bash
npx prisma generate
```

3. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Database Schema

The Prisma schema includes:

- `User` model for OAuth authentication
- `Ticket` model with title, description, status, userId, and timestamps

## What's Included

- **Next.js 16** - React framework for production-grade applications with App Router
- **Tambo AI** - AI-powered conversational interface for natural language interactions
- **Prisma** - Type-safe ORM for database access and migrations
- **NextAuth.js** - Authentication solution with OAuth providers (Google, GitHub)
- **PostgreSQL** - Relational database for persistent data storage
- **TypeScript** - Static typing for improved developer experience and code quality
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Unstyled, accessible UI primitives for building components
- **Framer Motion** - Animation library for smooth, interactive UI transitions
- **Lucide React** - Beautiful, consistent icon set
- **TipTap** - Headless rich-text editor with mention support
