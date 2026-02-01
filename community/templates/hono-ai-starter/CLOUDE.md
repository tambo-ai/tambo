# Hono AI Starter Guidelines

## Core Tech Stack

- **Next.js 15** (App Router)
- **Hono** (Edge Runtime API)
- **Tambo AI SDK** (Generative UI)
- **Tailwind CSS v4**

## Component Standards

- All Generative UI components must reside in `src/components/tambo/`.
- Use **Tailwind v4** theme variables (e.g., `bg-card`, `text-primary`).
- Ensure all components are registered in `src/lib/tambo.ts` with matching Zod schemas.

## API Standards

- Routes are managed via Hono in `src/app/api/[[...route]]/route.ts`.
- Use `zValidator` for all POST/PUT requests to ensure AI-generated data is type-safe.

## Key Commands

- `npm run dev` - Start development server
- `npx tambo help` - View Tambo CLI commands
