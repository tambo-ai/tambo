# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Monorepo-based layered architecture with separation between AI framework packages (React SDK, CLI, Showcase, Docs) and the Tambo Cloud SaaS platform (NestJS API, Next.js web dashboard).

**Key Characteristics:**

- Turborepo orchestrates builds, caching, and cross-package dependencies
- Strict separation of concerns between framework and platform code
- Shared configuration and database layers accessed by both API and web app
- Streaming-first AI interaction model with real-time component generation
- Model Context Protocol (MCP) integration for extending AI capabilities

## Layers

**Presentation Layer (Client-Side):**

- Purpose: User interfaces for both the React SDK and Tambo Cloud dashboard
- Location: `react-sdk/src/`, `apps/web/app/`, `showcase/src/`
- Contains: React components, hooks, providers, UI logic
- Depends on: TypeScript SDK, React Query, Zod schemas for validation
- Used by: End users building with Tambo, Cloud dashboard users

**API Layer (Backend Gateway):**

- Purpose: REST + OpenAPI interface exposing project management, threads, webhooks, OAuth, MCP server endpoints, scheduler operations
- Location: `apps/api/src/`
- Contains: NestJS controllers, route handlers, DTOs, guards, middleware
- Depends on: Database operations, services, authentication, external integrations (Sentry, OpenTelemetry)
- Used by: Web dashboard (tRPC), CLI, external clients

**Service/Business Logic Layer:**

- Purpose: Pure business logic for threads, projects, registry sync, OAuth, audio processing, scheduling
- Location: `apps/api/src/{threads,projects,oauth,audio,scheduler}/` services and `packages/backend/src/`
- Contains: Service classes, domain logic, entity transformations, tool execution
- Depends on: Database layer, external AI APIs (OpenAI), configuration
- Used by: Controllers, schedulers, MCP handlers

**Data Access Layer:**

- Purpose: Unified database access, operations, ORM abstraction
- Location: `packages/db/src/`
- Contains: Drizzle ORM schema (`schema.ts`), migrations, operation functions (`operations/`)
- Depends on: PostgreSQL, Drizzle ORM
- Used by: All API services, web dashboard server actions

**Shared Core/Utilities Layer:**

- Purpose: Pure, reusable utilities shared across frontend and backend
- Location: `packages/core/src/`
- Contains: Validation, encryption, threading logic, tool utilities, JSON helpers, attachment handling, MCP client logic, strictness levels
- Depends on: No database; third-party utilities only
- Used by: React SDK, API services, CLI, backend services

**Backend Helpers Layer:**

- Purpose: LLM-specific utilities and streaming support
- Location: `packages/backend/src/`
- Contains: Prompt generation, model configuration, system tools, storage backends, content conversion
- Depends on: Core utilities, database schema (for types)
- Used by: API thread/message services, system prompts

**Framework Packages:**

- **React SDK** (`react-sdk/src/`): Hooks, providers, component/tool registration, MCP integration, streaming state management
- **CLI** (`cli/src/`): Project initialization, component installation, scaffolding
- **Showcase** (`showcase/src/`): Demo application for SDK features
- **Docs** (`docs/src/`, `docs/content/`): MDX-based documentation site

## Data Flow

**AI Chat Interaction (User Thread):**

1. Web dashboard/SDK component submits message via `useTamboThreadInput` hook
2. HTTP request to `POST /api/threads/{id}/messages` (with project/auth guard)
3. API controller validates DTO, calls `ThreadsService.addMessage()`
4. Service applies tool/content transformations, streams to LLM via TypeScript SDK
5. LLM response streams back; content parts (text, component decisions) streamed real-time
6. Component decisions trigger `ComponentDecision` execution in service
7. Rendered components streamed to client via `useTamboComponentState` hook
8. Web dashboard or SDK re-renders with new component state

**Component Registry Sync:**

1. CLI or dashboardupdates component registry in UI Registry package
2. Build system copies registry from `packages/ui-registry/` to `cli/dist/registry/`
3. When user runs `tambo add <component>`, CLI reads from `dist/registry/`
4. Files transformed and written to user project with dependency resolution
5. Dashboard can trigger registry sync webhooks via `POST /api/registry/sync`

**OAuth/Authentication Flow:**

1. User clicks login in web dashboard
2. Redirects to `GET /api/oauth/authorize` (GitHub/Google)
3. OAuth module exchanges code for token
4. User project session created in database (via `packages/db` operations)
5. NextAuth.js manages session client-side
6. Project API key guard validates subsequent requests

**State Management:**

- **React SDK**: Context providers wrap application, hooks expose thread, component, tool state
- **Web Dashboard**: tRPC for API queries, React Query for caching, local UI state via `useState`
- **API**: Request-scoped context (Drizzle transaction, logger), stored state in PostgreSQL
- **Streaming**: Real-time updates via HTTP streaming for long-running operations (chat, component rendering)

## Key Abstractions

**TamboProvider (React SDK Core):**

- Purpose: Root provider exposing all Tambo functionality to child components
- Examples: `react-sdk/src/providers/{tambo-client-provider,tambo-registry-provider,...}.tsx`
- Pattern: Nested context providers, each managing specific subsystem (client, registry, threads, etc.)

**Thread/Message System:**

- Purpose: Represent conversation state with AI, message history, component rendering
- Examples: `apps/api/src/threads/`, `packages/core/src/threads.ts`
- Pattern: Database entities with service logic for appending messages, executing tools, streaming responses

**Component Registration:**

- Purpose: Allow users to define React components + schemas for AI to understand and generate
- Examples: `packages/ui-registry/src/`, `react-sdk/src/providers/tambo-registry-provider.tsx`
- Pattern: Metadata + component + Zod schema; registry validates props against schemas

**Tool System:**

- Purpose: Extend AI capabilities via custom functions or MCP servers
- Examples: `packages/core/src/tools.ts`, `apps/api/src/mcp-server/`
- Pattern: Tool definition with input schema + execution function; tool responses transformed to content parts

**MCP Client/Server:**

- Purpose: Enable bidirectional AI-to-tools communication via Model Context Protocol
- Examples: `packages/core/src/mcp-client.ts`, `apps/api/src/mcp-server/`
- Pattern: Client connects to MCP servers (local or remote), discovers resources/tools, executes on demand

**Guards/Middleware:**

- Purpose: Authentication, authorization, request logging, transaction management
- Examples: `apps/api/src/projects/guards/`, `apps/api/src/common/middleware/`
- Pattern: NestJS guards reject unauthorized requests early; middleware wraps entire request pipeline

## Entry Points

**API Server:**

- Location: `apps/api/src/main.ts`
- Triggers: `npm run dev` / `npm run build && npm run start:prod`
- Responsibilities: Initialize Nest.js app, Sentry/OTEL instrumentation, Helmet security headers, Swagger docs, MCP handler registration, graceful shutdown

**Web Dashboard:**

- Location: `apps/web/app/layout.tsx` (root layout), `apps/web/app/providers.tsx` (provider tree)
- Triggers: `npm run dev` / `npm run build && npm start`
- Responsibilities: Initialize Next.js app router, set up auth/Tambo/PostHog providers, route protection, error boundaries

**React SDK (Entry Points):**

- Location: `react-sdk/src/index.ts` → `react-sdk/src/v1/index.ts`
- Exports: Hooks (`useTambo`, `useTamboThreadInput`, etc.), providers, types, utilities
- Responsible for: Exporting public API; internal implementations vary by subsystem

**CLI:**

- Location: `cli/src/cli.ts` (command router), `cli/src/commands/*` (individual commands)
- Triggers: `tambo init`, `tambo add`, `tambo create-app`, etc.
- Responsibilities: Parse args, prompt user, validate inputs, execute scaffolding/installation

**Showcase:**

- Location: `showcase/src/app/` (Next.js app router)
- Triggers: `npm run dev` (port 8262)
- Responsibilities: Demonstrate SDK features, render component examples, test integration

## Error Handling

**Strategy:** Fail-fast with clear, actionable error messages. No silent fallbacks. Log warnings when skipping data intentionally.

**Patterns:**

**API Layer (Controllers → HttpException):**

- Validate DTOs with `class-validator`; invalid fields → `400 Bad Request`
- Guard rejection → `401 Unauthorized` or `403 Forbidden`
- Missing resource → `404 Not Found`
- Server error → `500 Internal Server Error` (Sentry captures)

**Service Layer (Business Logic):**

- Throw descriptive errors when invariants violated (e.g., "Required model XYZ not found")
- When mapping enums, handle all known values; throw for unknown values (not silent defaults)
- Validate database operation returns; throw if write returns null

**React SDK:**

- Graceful degradation for missing providers (e.g., no TamboProvider → hook returns error state)
- Hook errors surface via hook return objects or thrown errors (caller's choice via error boundary)

**CLI:**

- Parse errors → exit code 1 with stderr message
- User action required (non-interactive mode) → exit code 2 with guidance

## Cross-Cutting Concerns

**Logging:**

- API: Sentry for errors, request logger middleware for audit trail, OTEL spans for latency
- React SDK: Console warnings for development, user-friendly errors
- CLI: `ora` spinners for progress, `chalk` for colored output

**Validation:**

- Input schemas: Zod (React SDK, CLI), `class-validator` (API DTOs)
- Database schema enforced by Drizzle ORM
- Tool input/output: Zod schemas paired with tool registration

**Authentication:**

- API Key guards: Extract from header `X-API-Key` or query param `api_key`
- Bearer token guards: Extract from `Authorization: Bearer` header
- NextAuth sessions: Stored in database, validated client-side via hook
- MCP auth: Optional token-based, handled by MCP protocol

**Observability:**

- Sentry: Server-side error tracking, request tagging (projectId, threadId)
- OpenTelemetry: Distributed tracing via HTTP exporter (Langfuse integration)
- PostHog: Client-side analytics in web dashboard
- Swagger: Auto-generated API docs with security schemes

---

_Architecture analysis: 2026-02-11_
