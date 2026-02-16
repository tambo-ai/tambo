# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
tambo/
├── apps/                              # Tambo Cloud SaaS platform
│   ├── web/                          # Next.js dashboard (port 8260)
│   │   ├── app/                      # App Router routes + layouts
│   │   ├── components/               # UI components (shadcn + custom)
│   │   ├── hooks/                    # Client hooks (React Query wrappers)
│   │   ├── lib/                      # Pure utilities (formatters, env, helpers)
│   │   ├── providers/                # Client-side providers (NextAuth, Tambo, etc.)
│   │   ├── server/                   # Server-only modules (DB, tRPC, auth guards)
│   │   ├── styles/                   # Global CSS, Tailwind
│   │   ├── test/                     # Jest setup + test utilities
│   │   ├── __fixtures__/             # Shared test fixtures
│   │   ├── __mocks__/                # Jest mocks for browser APIs
│   │   ├── CLAUDE.md                 # Agent guidance
│   │   └── AGENTS.md                 # Detailed architecture + patterns
│   │
│   ├── api/                          # NestJS OpenAPI server (port 8261)
│   │   ├── src/
│   │   │   ├── main.ts              # Bootstrap, Sentry init, Helmet config
│   │   │   ├── app.module.ts        # Root module composition
│   │   │   ├── config.service.ts    # Centralized config access
│   │   │   ├── sentry.ts            # Sentry setup
│   │   │   ├── telemetry.ts         # OpenTelemetry setup
│   │   │   ├── threads/             # Thread/message lifecycle
│   │   │   │   ├── threads.controller.ts
│   │   │   │   ├── threads.service.ts
│   │   │   │   ├── guards/          # Auth guards
│   │   │   │   └── dto/             # Request/response DTOs
│   │   │   ├── projects/            # Project CRUD + API keys
│   │   │   ├── users/               # User management
│   │   │   ├── oauth/               # OAuth flows
│   │   │   ├── registry/            # Component registry webhooks
│   │   │   ├── audio/               # Audio processing + transcription
│   │   │   ├── scheduler/           # Cron + background jobs
│   │   │   ├── mcp-server/          # Model Context Protocol handler
│   │   │   ├── storage/             # S3/file storage abstraction
│   │   │   ├── v1/                  # v1 API routes (legacy compatibility)
│   │   │   └── common/              # Shared DTOs, filters, middleware, services
│   │   │       ├── filters/         # Exception filters (Sentry)
│   │   │       ├── guards/          # Common auth guards
│   │   │       ├── middleware/      # DB transaction, request logging
│   │   │       ├── services/        # Auth, email, config services
│   │   │       └── openapi/         # Swagger config generation
│   │   ├── test/                    # Integration + e2e tests
│   │   ├── CLAUDE.md                # Agent guidance
│   │   └── AGENTS.md                # Detailed architecture + patterns
│   │
│   └── docs-mcp/                     # Documentation MCP server
│       └── (Next.js based doc server)
│
├── react-sdk/                        # Core React SDK package (@tambo-ai/react)
│   ├── src/
│   │   ├── index.ts                # Public API exports (delegates to v1/)
│   │   ├── v1/                     # v1 API (stable, long-term support)
│   │   │   ├── index.ts           # v1 exports
│   │   │   ├── hooks/             # useTambo, useTamboThreadInput, etc.
│   │   │   └── ...
│   │   ├── providers/              # Context providers (nested hierarchy)
│   │   │   ├── tambo-client-provider.tsx
│   │   │   ├── tambo-registry-provider.tsx
│   │   │   ├── tambo-thread-provider.tsx
│   │   │   ├── tambo-context-attachment-provider.tsx
│   │   │   ├── tambo-prop-stream-provider/
│   │   │   └── ...
│   │   ├── hooks/                  # React hooks for SDK functionality
│   │   ├── model/                  # TypeScript interfaces + types
│   │   ├── schema/                 # Zod schemas for validation
│   │   ├── mcp/                    # Model Context Protocol integration
│   │   ├── context-helpers/        # Dynamic context generation
│   │   ├── util/                   # Internal utilities
│   │   ├── hoc/                    # Higher-order components
│   │   ├── testing/                # Test utilities
│   │   └── setupTests.ts           # Jest setup
│   ├── dist/                       # CommonJS build output
│   ├── esm/                        # ESM build output
│   ├── CLAUDE.md                   # Agent guidance
│   └── AGENTS.md                   # Detailed architecture + patterns
│
├── cli/                             # Tambo CLI package (tambo command)
│   ├── src/
│   │   ├── cli.ts                 # Main CLI router + command entry
│   │   ├── commands/              # Individual commands
│   │   │   ├── init.ts           # Initialize Tambo in project
│   │   │   ├── add/              # Component installation system
│   │   │   ├── create-app.ts     # New app scaffolding
│   │   │   ├── list/             # List available components
│   │   │   ├── update.ts         # Update components
│   │   │   └── upgrade.ts        # Upgrade dependencies
│   │   ├── lib/                   # CLI-specific utilities
│   │   ├── utils/                 # Shared utilities
│   │   ├── types/                 # TypeScript types
│   │   ├── constants/             # Shared constants
│   │   ├── templates/             # Project templates
│   │   ├── __tests__/             # CLI tests
│   │   └── __fixtures__/          # Test fixtures
│   ├── dist/                       # ESM build output
│   ├── dist/registry/              # Component registry (copied at build time)
│   ├── scripts/                    # Build scripts (copy-registry.ts)
│   ├── CLAUDE.md                   # Agent guidance
│   └── AGENTS.md                   # Detailed architecture + patterns
│
├── showcase/                        # Demo app (@tambo-ai/showcase)
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   ├── components/            # Demo components
│   │   ├── lib/                   # Showcase utilities
│   │   ├── providers/             # App providers
│   │   └── constants/             # Constants
│   └── public/                     # Static assets
│
├── docs/                            # Documentation site (@tambo-ai/docs)
│   ├── src/                        # Component UI (Fumadocs)
│   │   ├── app/                   # App Router pages
│   │   └── ...
│   ├── content/                    # MDX documentation content
│   │   └── docs/
│   │       ├── getting-started/
│   │       ├── guides/            # How-to guides
│   │       ├── concepts/          # Architecture/design docs
│   │       ├── reference/         # API reference
│   │       └── best-practices/
│   └── plans/                      # Planning documents
│
├── packages/                        # Shared packages (workspace)
│   ├── core/                       # Pure utilities (@tambo-ai/core)
│   │   ├── src/
│   │   │   ├── index.ts          # Main exports
│   │   │   ├── async-queue.ts
│   │   │   ├── attachment.ts
│   │   │   ├── encrypt.ts
│   │   │   ├── json.ts
│   │   │   ├── threads.ts        # Thread utilities
│   │   │   ├── tools.ts          # Tool parsing + execution
│   │   │   ├── mcp-client.ts     # MCP client
│   │   │   ├── mcp-utils.ts
│   │   │   ├── llms/             # LLM config/provider types
│   │   │   ├── strictness/       # Strictness level logic
│   │   │   └── auth/             # Auth utilities
│   │   ├── test/                 # Jest config + setup
│   │   └── ...
│   │
│   ├── db/                        # Database (@tambo-ai-cloud/db)
│   │   ├── src/
│   │   │   ├── index.ts          # Main exports
│   │   │   ├── schema.ts         # Drizzle ORM schema (source of truth)
│   │   │   ├── operations/       # Database operation functions
│   │   │   │   ├── index.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── threads.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── usage.ts
│   │   │   │   ├── suggestions.ts
│   │   │   │   ├── logs.ts
│   │   │   │   ├── runs.ts
│   │   │   │   └── ...
│   │   │   ├── converters/       # Data type converters
│   │   │   └── oauth/            # OAuth-related queries
│   │   ├── migrations/            # Drizzle migrations
│   │   └── ...
│   │
│   ├── backend/                   # LLM helpers (@tambo-ai-cloud/backend)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tambo-backend.ts  # Main orchestrator
│   │   │   ├── model/            # Model config interfaces
│   │   │   ├── prompt/           # Prompt generation utilities
│   │   │   ├── services/         # LLM services
│   │   │   ├── storage/          # Storage backends
│   │   │   ├── config/           # Configuration
│   │   │   ├── util/             # Internal utilities
│   │   │   └── systemTools.ts
│   │   └── ...
│   │
│   ├── ui-registry/              # Component registry (@tambo-ai/ui-registry)
│   │   ├── src/
│   │   │   ├── components/       # Registry components (source of truth)
│   │   │   │   ├── {component}/
│   │   │   │   │   ├── config.json
│   │   │   │   │   ├── {component}.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   ├── index.ts
│   │   │   └── ...
│   │   ├── __tests__/            # Registry tests
│   │   ├── scripts/              # Registry scripts
│   │   └── ...
│   │
│   ├── react-ui-base/            # Base React UI components
│   ├── vite-config/              # Shared Vite config
│   ├── testing/                  # Testing utilities
│   ├── eslint-config/            # Shared ESLint rules
│   └── typescript-config/        # Shared TypeScript config
│
├── create-tambo-app/               # App bootstrapper (create-tambo-app)
│   ├── src/
│   └── dist/
│
├── devdocs/                        # Developer documentation
│   ├── solutions/                 # Solutions to common problems
│   │   └── build-errors/
│   ├── skills/                    # Detailed how-to guides
│   │   ├── creating-styled-wrappers/
│   │   └── compound-components/
│   └── (AI skill documentation)
│
├── plugins/tambo/                  # Claude plugins for AI agents
│   ├── skills/                     # Plugin skills
│   │   ├── cli/
│   │   ├── components/
│   │   ├── threads/
│   │   ├── tools-and-context/
│   │   └── ...
│   └── .claude-plugin/
│
├── scripts/                        # Root-level scripts
│   └── (dev, build, cloud setup scripts)
│
├── .github/                        # GitHub Actions workflows
│   └── workflows/
│
├── AGENTS.md                       # Root-level architecture guidance
├── CLAUDE.md                       # Root-level agent pointer
├── CONTRIBUTING.md                 # Developer setup guide
├── OPERATORS.md                    # Self-hosting/deployment guide
├── RELEASING.md                    # Release process
├── README.md                       # Project overview
├── package.json                    # Root workspace config
├── turbo.json                      # Turborepo task pipeline
├── tsconfig.json                   # Root TypeScript config
├── eslint.config.mjs               # Root ESLint config
├── .prettierrc                     # Code formatting config
└── docker-compose.yml              # Local PostgreSQL setup
```

## Directory Purposes

**apps/web:**

- Purpose: Tambo Cloud SaaS dashboard for users to manage projects, threads, component registry
- Contains: Next.js app router routes, React components, server utilities, tRPC router definitions
- Key files: `app/layout.tsx` (root), `server/trpc.ts` (API client), `providers/` (NextAuth, Tambo, etc.)

**apps/api:**

- Purpose: RESTful API server powering Cloud dashboard, CLI, and external clients
- Contains: NestJS modules, controllers, services, database operations, guards, middleware
- Key files: `src/main.ts` (entry), `src/app.module.ts` (root module), `src/threads/` (core domain)

**react-sdk:**

- Purpose: Framework package for developers to build AI-powered React apps
- Contains: Hooks, providers, types, validation schemas, MCP client integration
- Key files: `src/index.ts` (public API), `src/v1/` (stable v1 API), `src/providers/` (context)
- Build outputs: `dist/` (CJS) and `esm/` (ES modules) for compatibility

**cli:**

- Purpose: Command-line tool for scaffolding, managing, and extending Tambo apps
- Contains: Command handlers, registry utilities, project templates, interactive prompts
- Key files: `src/cli.ts` (router), `src/commands/` (command implementations), `dist/registry/` (components)
- Note: Registry auto-copied from `packages/ui-registry/` at build time

**packages/core:**

- Purpose: Pure utilities for common operations (no database, no external state)
- Contains: Encryption, threading logic, tool parsing, MCP client, validation, attachments
- Key files: `src/index.ts` (exports), `src/threads.ts`, `src/tools.ts`, `src/mcp-client.ts`
- Used by: React SDK, API, CLI, backend services

**packages/db:**

- Purpose: Centralized database layer via Drizzle ORM
- Contains: Database schema (source of truth), migrations, operation functions
- Key files: `src/schema.ts` (Drizzle tables), `src/operations/` (query functions)
- Rule: All DB access goes through operations; never inline SQL

**packages/backend:**

- Purpose: LLM-specific helpers (prompt generation, model config, system tools, streaming)
- Contains: Model configuration, prompt templates, storage backends, streaming utilities
- Key files: `src/tambo-backend.ts` (main), `src/prompt/`, `src/services/`
- Used by: API thread/message services

**packages/ui-registry:**

- Purpose: Single source of truth for all Tambo components
- Contains: Component files, config.json metadata, CSS, dependencies
- CLI copies registry from here to `dist/registry/` at build time
- Updated by: developers adding new components; changes sync to showcase + docs

**showcase:**

- Purpose: Demo application showing all SDK features and components
- Contains: Next.js app router, example components, integration examples
- Note: Components auto-synced from CLI registry; edit registry, not showcase directly
- Port: 8262

**docs:**

- Purpose: Comprehensive documentation site for users and developers
- Contains: MDX content, API reference, guides, best practices
- Based on: Fumadocs (built on Next.js)
- Port: 8263

## Key File Locations

**Entry Points:**

- `apps/api/src/main.ts`: API server bootstrap
- `apps/web/app/layout.tsx`: Web dashboard root layout
- `apps/web/app/providers.tsx`: Provider tree for auth, Tambo, PostHog
- `react-sdk/src/index.ts`: SDK public API exports
- `cli/src/cli.ts`: CLI command router

**Configuration:**

- `packages/db/src/schema.ts`: Database schema (source of truth for entities)
- `apps/api/src/config.service.ts`: Centralized environment config
- `apps/web/lib/env.ts`: Environment validation (Next.js)
- `turbo.json`: Build pipeline and task dependencies
- `tsconfig.json`: Root TypeScript config (extended by packages)

**Core Logic:**

- `packages/core/src/threads.ts`: Thread/message utilities
- `packages/core/src/tools.ts`: Tool parsing and execution
- `packages/backend/src/tambo-backend.ts`: LLM orchestration entry
- `apps/api/src/threads/threads.service.ts`: Thread lifecycle (API)
- `react-sdk/src/providers/tambo-client-provider.tsx`: SDK client setup

**Testing:**

- `apps/api/test/jest-e2e.json`: E2E test configuration
- `apps/web/test/jest.setup.ts`: Dashboard Jest setup
- `react-sdk/jest.config.ts`: SDK Jest configuration
- Files ending in `.test.ts` or `.test.tsx`: Unit/integration tests

## Naming Conventions

**Files:**

- Components: `TamboXxx.tsx` (React SDK components), `xxx.tsx` (internal)
- Services: `xxx.service.ts` (NestJS), `xxxService.ts` (TypeScript classes)
- Controllers: `xxx.controller.ts` (NestJS)
- Tests: `xxx.test.ts` or `xxx.test.tsx` (colocated with source)
- Utilities: `xxx.ts` or `xxx.util.ts` (kebab-case for file names)
- DTOs: `xxx.dto.ts` (in `dto/` directories)
- Schemas: `xxx.schema.ts` (Zod)
- Hooks: `use-tambo-xxx.ts` (React SDK), `useXxx.ts` (internal)
- Providers: `tambo-xxx-provider.tsx` (React SDK)
- Configuration: `xxx.config.ts` or `xxx.env.*`

**Directories:**

- kebab-case for all directories except `__tests__`, `__fixtures__`, `__mocks__`
- PascalCase for class-based module directories is avoided; use kebab-case consistently
- Colocate types, interfaces in `model/` or `types/` subdirs when complex
- Colocate tests beside source files using `.test.ts` suffix

## Where to Add New Code

**New Feature (API endpoint):**

- API logic: `apps/api/src/{domain}/{domain}.service.ts`
- Controller: `apps/api/src/{domain}/{domain}.controller.ts`
- DTOs: `apps/api/src/{domain}/dto/`
- Tests: `apps/api/src/{domain}/{feature}.test.ts` or `test/`
- DB operations: `packages/db/src/operations/{domain}.ts`

**New React Component (SDK):**

- Public component: `react-sdk/src/v1/components/` (if exporting)
- Internal providers: `react-sdk/src/providers/`
- Hooks: `react-sdk/src/v1/hooks/` (if public)
- Schemas: `react-sdk/src/schema/`
- Tests: Colocate with source as `.test.tsx`

**New Shared Utility:**

- Pure logic (no DB): `packages/core/src/`
- LLM-specific: `packages/backend/src/`
- Database operations: `packages/db/src/operations/`
- Add to respective `src/index.ts` for exports

**New Component in Registry:**

- Location: `packages/ui-registry/src/components/{ComponentName}/`
- Files: `config.json` (metadata), `ComponentName.tsx`, supporting files
- Rebuild: `npm run build -w cli` to copy registry to `cli/dist/registry/`

**New CLI Command:**

- Location: `cli/src/commands/{command-name}/index.ts`
- Tests: `cli/src/commands/{command-name}/index.test.ts`
- Register in `cli/src/cli.ts` command router

**New Documentation:**

- Location: `docs/content/docs/{section}/`
- Format: MDX with frontmatter
- Auto-indexed via Fumadocs

## Special Directories

**node_modules:**

- Purpose: npm dependencies (installed via workspaces)
- Generated: Yes
- Committed: No

**.turbo:**

- Purpose: Turborepo cache metadata
- Generated: Yes
- Committed: No

**.next:**

- Purpose: Next.js build artifacts (dashboard, showcase, docs)
- Generated: Yes
- Committed: No

**dist/ and esm/:**

- Purpose: Build outputs for TypeScript packages
- Generated: Yes (via `tsc` or build scripts)
- Committed: No

**migrations/**

- Purpose: Drizzle ORM migration files
- Generated: Yes (via `npm run db:generate`)
- Committed: Yes (source of truth for schema evolution)

**plans/**

- Purpose: Long-term planning documents and proposals
- Generated: No
- Committed: Yes

**.planning/codebase/**

- Purpose: Codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by GSD agents)
- Committed: No (temporary reference)

---

_Structure analysis: 2026-02-11_
