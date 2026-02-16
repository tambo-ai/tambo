# Technology Stack

**Analysis Date:** 2026-02-11

## Languages

**Primary:**

- TypeScript 5.9.3 - All source code, full strict mode enforcement
- JavaScript - Build tools and scripts

**Secondary:**

- SQL - Drizzle ORM migrations and PostgreSQL operations
- MDX - Documentation site content (`docs/src/`)

## Runtime

**Environment:**

- Node.js 22.22.0 - Development and production runtime
- npm 11.7.0 - Package manager

**Package Manager:**

- npm 11.7.0 - Workspace-managed via corepack
- Lockfile: `package-lock.json` (present)

## Frameworks & Runtimes

**Frontend (React SDK):**

- React 18.3.1 / 19.0.0 - UI library with hooks
- Next.js 15.5.11 - App Router for web dashboard (`apps/web/`)
- Tailwind CSS 3.4.19 - Utility-first styling with PostCSS

**Backend:**

- NestJS 11.1.13 - OpenAPI server framework (`apps/api/`)
- Express.js - Underlying HTTP adapter for NestJS

**CLI & Dev Tools:**

- TypeScript Compiler (tsc) - Dual CJS/ESM build outputs
- Turborepo 2.8.3 - Monorepo orchestration

**Testing:**

- Jest 30.2.0 - Unit/integration test runner with ts-jest
- Testing Library 16.3.2 - React component testing
- Supertest 7.2.2 - HTTP API endpoint testing
- Vitest - Alternative test runner (available)

**Build & Dev:**

- Concurrently 9.2.1 - Parallel task runner
- tsx 4.21.0 - TypeScript runtime for Node
- ESLint 9.39.2 - Code linting with TypeScript support
- Prettier 3.8.1 - Code formatting

## Key Dependencies

**Core Frameworks & Libraries:**

- `@tanstack/react-query` 5.90.16 - Data fetching and caching
- `react-hook-form` 7.71.1 - Form state management
- `zod` 3.25.76 or 4.0.0 - Runtime schema validation
- `drizzle-orm` 0.45.1 - TypeScript ORM for PostgreSQL
- `@hookform/resolvers` 5.2.2 - Form validation resolvers

**AI & LLM Integrations:**

- `ai` 5.0.129 - Vercel AI SDK (core LLM abstraction layer)
- `@ai-sdk/openai` 2.0.89 - OpenAI provider
- `@ai-sdk/anthropic` 2.0.60 - Anthropic Claude provider
- `@ai-sdk/google` 2.0.52 - Google Gemini provider
- `@ai-sdk/groq` 2.0.34 - Groq inference provider
- `@ai-sdk/mistral` 2.0.27 - Mistral AI provider
- `@ai-sdk/openai-compatible` 1.0.32 - Generic OpenAI-compatible endpoints
- `openai` 6.16.0 - OpenAI direct client (for embeddings, direct calls)
- `langfuse` 3.38.6 - LLM observability and tracing
- `gpt-tokenizer` 3.2.0 - Token counting for OpenAI models

**AI Agent Frameworks:**

- `@ag-ui/client` 0.0.43 - AG UI client utilities
- `@ag-ui/core` 0.0.43 - AG UI core (event types, streaming)
- `@ag-ui/crewai` 0.0.3 - CrewAI integration
- `@ag-ui/llamaindex` 0.1.5 - LlamaIndex integration
- `@ag-ui/mastra` 0.2.0 - Mastra framework integration
- `@mastra/core` 0.20.2 - Mastra agent framework
- `@modelcontextprotocol/sdk` 1.26.0 - Model Context Protocol SDK (optional peer)

**Cloud & Infrastructure:**

- `@aws-sdk/client-s3` 3.700.0 - AWS S3 file storage
- `@aws-sdk/s3-request-presigner` 3.700.0 - Presigned URL generation
- `pg` 8.17.2 - PostgreSQL client driver
- `jose` 5.10.0 - JWT signing and verification

**Email & Communications:**

- `resend` 6.9.1 - Email service API
- `@react-email/components` 1.0.7 - React email template components

**Monitoring & Analytics:**

- `@sentry/nestjs` 10.38.0 - Sentry error tracking (API server)
- `@sentry/nextjs` 10.38.12 - Sentry error tracking (Next.js app)
- `@sentry/profiling-node` 10.38.0 - Node.js profiling
- `posthog-node` 5.24.9 - PostHog analytics server SDK
- `posthog-js` 1.336.4 - PostHog analytics client SDK
- `@opentelemetry/sdk-node` 0.211.0 - OpenTelemetry tracing
- `@opentelemetry/exporter-otlp-http` 0.26.0 - OTEL HTTP export
- `@opentelemetry/auto-instrumentations-node` 0.69.0 - Auto-instrumentation
- `@langfuse/otel` 4.5.1 - Langfuse OpenTelemetry integration

**Authentication & Security:**

- `next-auth` 4.24.12 - Next.js authentication framework
- `passport` - (used via NextAuth providers)
- `jsonwebtoken` 9.0.3 - JWT creation and validation
- `helmet` 8.1.0 - Express security headers middleware
- `class-validator` 0.14.3 - DTO validation decorators

**UI Components & Styling:**

- `@radix-ui/*` - Headless UI primitives (14+ packages)
- `shadcn/ui` - Radix-based component library
- `lucide-react` 0.563.0 - Icon library
- `recharts` 3.6.0 - React charting library
- `framer-motion` 12.29.0 - Animation library
- `class-variance-authority` 0.7.0 - CSS utility composition
- `clsx` 2.1.1 - Conditional className utility
- `tailwind-merge` 2.6.1 - Tailwind class merging

**Content & Markdown:**

- `remark-*` family - Markdown processing (gfm, parse, rehype)
- `rehype-*` family - HTML processing (katex, pretty-code, raw, stringify)
- `shiki` 3.20.0 - Syntax highlighting
- `fumadocs` - Documentation framework
- `nextra` 4.6.1 - Next.js documentation framework

**Utilities & Helpers:**

- `superjson` 2.2.6 - JSON serialization with type preservation
- `fast-json-patch` 3.1.1 - JSON Patch implementation
- `nanoid` 3.3.11 - Tiny URL-friendly unique string IDs
- `uuid` 13.0.0 - UUID generation
- `ajv` 8.17.1 - JSON Schema validation
- `fast-equals` 5.3.3 - Fast deep equality checking
- `type-fest` 5.4.3 - Utility TypeScript types
- `class-transformer` 0.5.1 - Object transformation utilities
- `luxon` 3.7.2 - Date/time utilities

**CLI & File Handling:**

- `meow` 14.0.0 - CLI argument parser
- `inquirer` 13.2.1 - Interactive CLI prompts
- `ora` 9.0.0 - CLI spinner/progress
- `chalk` 5.6.0 - Terminal color output
- `open` 11.0.0 - Open files/URLs
- `cross-spawn` 7.0.6 - Cross-platform child process spawning
- `ts-morph` 27.0.2 - TypeScript AST manipulation

## Configuration

**Environment:**

- Config centralized via `@nestjs/config` (API)
- Client env via `@t3-oss/env-nextjs` (Next.js web)
- `.env` files for local development (never committed)
- Environment variables validated at runtime with Zod schemas

**Key Configs Required:**

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NEXTAUTH_SECRET` - NextAuth JWT secret (required)
- `NEXTAUTH_URL` - Auth callback URL (required)
- `API_KEY_SECRET` - API key encryption (required)
- `PROVIDER_KEY_SECRET` - OAuth provider key encryption (required)
- `SENTRY_DSN` - Error tracking (optional)
- `POSTHOG_API_KEY` - Analytics (optional)
- `RESEND_API_KEY` - Email service (optional)
- `OPENAI_API_KEY` / provider keys - LLM credentials (optional, per provider)
- `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` - OAuth (optional)

**Build:**

- `tsconfig.json` - Base TypeScript config (root)
- `packages/typescript-config/` - Shared TypeScript presets
- `tailwind.config.ts` - Tailwind customization
- `postcss.config.js` - PostCSS plugins
- `.eslintrc` - ESLint configuration via shared package
- `jest.config.ts` - Jest test configuration (per package)
- `turbo.json` - Turborepo pipeline and caching
- `mise.toml` - Tool version management (Node, npm, cspell, gh, etc.)

## Platform Requirements

**Development:**

- Node.js 22.x minimum
- npm 11.x minimum
- PostgreSQL 13+ for local dev (Docker Compose available)
- OpenSSL for key generation (`openssl rand -hex 32`)

**Production:**

- PostgreSQL database (Drizzle ORM migrations managed by drizzle-kit)
- Node.js 22+ runtime
- OpenTelemetry-compatible tracing backend (optional)
- Sentry error tracking (optional but recommended)
- PostHog analytics (optional)
- S3-compatible object storage (AWS S3 or alternative)
- Email provider (Resend or SMTP)
- LLM provider(s) for AI features (OpenAI, Anthropic, Google, etc.)

**Database Migrations:**

- Drizzle Kit manages migrations (`npm run db:generate -w packages/db`)
- Migrations stored in `packages/db/migrations/`
- RLS (Row Level Security) policies for multi-tenancy in PostgreSQL

---

_Stack analysis: 2026-02-11_
