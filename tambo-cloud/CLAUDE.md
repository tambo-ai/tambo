# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For comprehensive coding standards and patterns, see @AGENTS.md which contains detailed instructions for AI agents working in this codebase.

## Repository Overview

Tambo Cloud is a monorepo for the Tambo platform, an AI-powered agent system. The repository uses Turborepo for build orchestration and includes both frontend (Next.js) and backend (NestJS) applications, with shared packages for database access, utilities, and LLM integration.

## Key Commands

### Development

```bash
npm run dev                 # Run API and web in dev mode (ports 3001/3000)
npm run build              # Build all apps and packages
npm run lint               # Lint all workspaces
npm run lint:fix           # Lint with auto-fix
npm run check-types        # TypeScript type checking across workspace
npm run format             # Format code with Prettier
npm run prettier-check     # Check formatting without changes
npm test                   # Run tests across all packages
```

### Database (Drizzle ORM)

```bash
npm run db:generate        # Generate migrations from schema changes
npm run db:migrate         # Apply pending migrations
npm run db:check           # Check migration status
npm run db:studio          # Open Drizzle Studio for DB visualization
```

### API-Specific

```bash
npm run build:api          # Build only the API app
npm run hydra-api:start    # Start API in production mode
```

### Running Tests in Specific Packages

```bash
# In apps/api
cd apps/api && npm test

# In packages/core
cd packages/core && npm test

# Run specific test file
cd apps/api && npm test -- threads.service.test.ts
```

### Docker Environment

```bash
./scripts/tambo-setup.sh      # Initial Docker setup
./scripts/tambo-start.sh      # Start Docker stack
./scripts/init-database.sh    # Initialize database
```

Docker runs on alternate ports to avoid conflicts:

- Web: http://localhost:3210 (vs local:3000)
- API: http://localhost:3211 (vs local:3001)
- PostgreSQL: localhost:5433 (vs local:5432)

## Architecture

### Monorepo Structure

The repository follows a standard Turborepo pattern with apps and packages:

**Applications (`apps/`)**

- `apps/api` - NestJS backend API server with OpenAPI/Swagger documentation
- `apps/web` - Next.js frontend with App Router, tRPC, and Shadcn UI
- `apps/mcp-proxy` - MCP (Model Context Protocol) proxy service
- `apps/docs-mcp` - Documentation MCP server
- `apps/test-mcp-server` - Testing MCP server

**Shared Packages (`packages/`)**

- `packages/db` - Drizzle ORM schema, migrations, and database operations
- `packages/core` - Pure utilities with no database dependencies (validation, JSON, crypto, threading)
- `packages/backend` - LLM/agent-side helpers and streaming utilities
- `packages/testing` - Shared testing utilities
- `packages/eslint-config` - ESLint configurations
- `packages/typescript-config` - TypeScript configurations

### Technology Stack

**Frontend (apps/web)**

- Next.js 15 (App Router)
- React 18
- tRPC for type-safe API calls
- Tailwind CSS + Shadcn UI components
- Next-Auth for authentication
- React Query for data fetching
- Geist fonts (Sans, Mono) and Sentient for headings

**Backend (apps/api)**

- NestJS with modular architecture
- OpenAPI/Swagger documentation at `/api`
- Class-validator for DTOs
- OpenTelemetry and Sentry for observability
- Helmet for security headers

**Database**

- PostgreSQL
- Drizzle ORM with TypeScript schema
- Schema source of truth: `packages/db/src/schema.ts`

**Observability**

- Sentry for error tracking
- Langfuse for LLM observability
- OpenTelemetry for distributed tracing

### Backend Architecture (apps/api)

The API follows NestJS modular patterns:

- **Modules**: Each domain has its own module (threads, projects, users, etc.)
- **Controllers**: Handle HTTP routing and validation
- **Services**: Contain business logic
- **DTOs**: Use class-validator for input validation
- **Guards**: Handle authentication and authorization

Key modules:

- `ai/` - LLM integration and agent orchestration
- `threads/` - Message threads and conversation management
- `projects/` - Project/workspace management
- `users/` - User management and authentication
- `common/` - Shared utilities, filters, guards, and interceptors

Entry point: `apps/api/src/main.ts` initializes Sentry, OpenTelemetry, Swagger, and global pipes/filters.

### Frontend Architecture (apps/web)

Next.js App Router structure:

- `app/` - Route definitions with App Router conventions
  - `(authed)/` - Protected routes requiring authentication
  - `(marketing)/` - Public marketing pages
  - `api/` - API route handlers (avoid creating new ones, use tRPC instead)
- `components/` - Reusable React components (Shadcn UI)
- `lib/` - Client-side utilities and configurations
- `hooks/` - Custom React hooks
- `providers/` - React context providers
- `trpc/` - tRPC client and router setup
- `styles/` - Global styles and Tailwind configuration

**Important Patterns:**

- Use tRPC for API calls, not REST endpoints
- Follow loading state patterns from [devdocs/LOADING_STATES.md](devdocs/LOADING_STATES.md)
- Follow naming conventions from [devdocs/NAMING_CONVENTIONS.md](devdocs/NAMING_CONVENTIONS.md)
- Prefer named exports over default exports
- Use Skeleton components during loading states

### Database Package (packages/db)

- **Schema**: `src/schema.ts` is the single source of truth
- **Migrations**: Generated via `npm run db:generate`, never hand-edited
- **Operations**: `src/operations/` contains reusable database queries
- **Type-safe**: Full TypeScript types generated from schema

### Core Package (packages/core)

Pure utilities with no external dependencies:

- `async-queue.ts` - Async queue implementation
- `json.ts` - JSON utilities
- `encrypt.ts` - Encryption helpers
- `email.ts` - Email validation
- `llm-config-types.ts` - LLM configuration types

**Rule**: This package must NOT depend on database or framework-specific code.

### Backend Package (packages/backend)

LLM and agent integration:

- `tambo-backend.ts` - Main backend orchestration
- `services/` - LLM service implementations
- `prompt/` - Prompt templates and utilities
- `util/` - Backend-specific utilities

## Environment Configuration

Required environment files:

- `apps/api/.env` - API server configuration
- `apps/web/.env.local` - Web app configuration (use `.env.example` as template)
- `packages/db/.env` - Database connection string
- `docker.env` - Docker environment variables (created by setup script)

Key environment variables (see `turbo.json` for full list):

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for LLM
- `NEXT_PUBLIC_TAMBO_API_KEY` - API key for frontend
- `NEXTAUTH_SECRET` - NextAuth secret for sessions
- `LANGFUSE_*` - Langfuse observability keys
- `SENTRY_DSN` - Sentry error tracking

## Development Workflow

### Making Changes

1. Read relevant code first (see [AGENTS.md](AGENTS.md))
2. Follow existing patterns and naming conventions
3. Run type checks: `npm run check-types`
4. Run linting: `npm run lint:fix`
5. Run tests: `npm test`
6. Test locally before committing

### Database Changes

1. Modify `packages/db/src/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `packages/db/migrations/`
4. Apply migration: `npm run db:migrate`
5. Never manually edit generated migration files

### Adding New API Endpoints

1. Create/update module in `apps/api/src/`
2. Define DTOs with class-validator
3. Add controller method with Swagger decorators
4. Implement service logic
5. Update OpenAPI spec (auto-generated)

### Adding New Frontend Features

1. Create components in `apps/web/components/`
2. Use tRPC for API calls (not REST endpoints)
3. Follow loading state patterns (see devdocs/LOADING_STATES.md)
4. Use Shadcn UI components
5. Prefer server components when possible

## PR Requirements

All PRs must follow Conventional Commits:

```
<type>(scope): <description>
```

Examples:

- `feat(api): add transcript export endpoint`
- `fix(web): prevent duplicate project creation`
- `chore(db): reorganize migration files`

Types: `feat`, `fix`, `perf`, `deps`, `revert`, `docs`, `style`, `chore`, `refactor`, `test`, `build`, `ci`

Common scopes: `api`, `web`, `core`, `db`, `deps`, `ci`, `config`

**Visual changes**: Must include a short video demo (30-90s)

**Before requesting review**:

1. `npm run lint` passes
2. `npm run check-types` passes
3. `npm test` passes
4. Tests added for new functionality

## Important Rules

1. **Dependencies**: Do not add/upgrade/remove dependencies or modify tool configs unless explicitly requested
2. **No Secrets**: Never commit API keys, tokens, or credentials
3. **Database**: Always use Drizzle migrations, never hand-edit SQL
4. **API Changes**: TypeScript SDK is auto-generated by Stainless from OpenAPI spec
5. **Frontend API**: Use tRPC, not new API route handlers in apps/web
6. **Testing**: Add tests for public functions and new features

## Getting API Key for Local Development

1. Start dev servers: `npm run dev`
2. Visit http://localhost:3000/dashboard
3. Login and create a project
4. Generate API key
5. Add to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_TAMBO_API_KEY=your_generated_key_here
   ```
6. Verify at http://localhost:3000/internal/smoketest

## Helpful References

- [AGENTS.md](AGENTS.md) - Comprehensive coding guidelines
- [CONTRIBUTING.md](CONTRIBUTING.md) - PR process and requirements
- [GETTING_STARTED.md](GETTING_STARTED.md) - Setup instructions
- [RELEASING.md](RELEASING.md) - Release process
- [devdocs/LOADING_STATES.md](devdocs/LOADING_STATES.md) - Loading state patterns
- [devdocs/NAMING_CONVENTIONS.md](devdocs/NAMING_CONVENTIONS.md) - React naming conventions
- [DOCKER_README.md](DOCKER_README.md) - Docker deployment guide

## External Resources

- Docs site: https://docs.tambo.co
- React SDK: https://github.com/tambo-ai/tambo
- Issue tracker: https://github.com/tambo-ai/tambo-cloud/issues
