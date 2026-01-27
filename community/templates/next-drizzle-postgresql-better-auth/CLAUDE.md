# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Project Context

**This is a Next.js 16 application with Tambo AI SDK, Drizzle ORM, PostgreSQL, and Better Auth.**

## Essential Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix

# Database (Drizzle ORM)
npm run db:generate  # Generate SQL migrations from schema
npm run db:migrate   # Apply migrations to the database
npm run db:push      # Push schema changes directly to DB (prototyping)
npm run db:studio    # Open Drizzle Studio to view/edit data
```

## Architecture Overview

### Core Technologies

- **Next.js 16.1.6** with App Router
- **React 19.2.4**
- **Drizzle ORM** & **PostgreSQL**
- **Better Auth** for authentication
- **Tailwind CSS v4**
- **Tambo AI SDK** (legacy/template context)

### Key Directories

- `src/lib/db`: Database configuration and schema definitions (`schema.ts`).
- `src/lib/auth`: Better Auth configuration (`auth.ts`, `auth-client.ts`).
- `drizzle`: SQL migration files.
- `src/components/ui`: Shadcn UI components.

## When Working on This Codebase

1. **Database Changes**
   - Modify `src/lib/db/schema.ts`.
   - Run `npm run db:generate` to create migration files.
   - Run `npm run db:migrate` to apply changes.

2. **Authentication**
   - Configuration is in `src/lib/auth/auth.ts`.
   - Client-side auth is in `src/lib/auth/auth-client.ts`.

3. **Styling**
   - Use Tailwind CSS v4 classes.
   - Files are located in `src/app` and `src/components`.
