# CLAUDE.md

Guidelines for Claude Code (claude.ai/code) when touching this repo.

**Read @AGENTS.md first.** It owns architecture, naming, workflow rules, testing expectations, and anything code-related. Keep that file open—this doc just points you there.

## Three Things to Remember

1. Follow that doc for everything: repo layout, commands, coding standards, doc rules, Charlie workflow, MCP guidance, etc.
2. Use the workspace scripts it lists (see below for key commands).
3. Defer to it whenever instructions collide; if something's still unclear, ask the user.

## Key Commands

```bash
# Development (two different apps)
npm run dev:cloud        # Start Tambo Cloud (web + API) - ports 8260 + 8261
npm run dev              # Start React SDK (showcase + docs)

# Quality checks (run before commits)
npm run lint
npm run check-types
npm test

# Database (requires -w flag)
npm run db:generate -w packages/db
npm run db:migrate -w packages/db
npm run db:studio -w packages/db

# Docker (for PostgreSQL in local dev)
docker compose --env-file docker.env up postgres -d
```

## Documentation Structure

- **CONTRIBUTING.md** - Dev setup and PR workflow for contributors
- **SELF-HOSTING.md** - Self-hosting/deployment guide
- **AGENTS.md** - Coding standards, architecture (this is the source of truth)

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Tambo Skills**

A skills system for Tambo that lets developers create modular capability packs for their AI agents. Skills bundle instructions, tools, optional components, and persistent state into units that agents can activate on demand. Skills can be authored in code, created from the dashboard, or installed from a GitHub-based marketplace. This is a first-class feature that touches the React SDK, client package, API, CLI, and web dashboard.

**Core Value:** Developers can give their Tambo agents specialized capabilities (like scheduling meetings, managing payments, or searching data) without wiring everything manually -- and agents intelligently pick which capabilities to use per message.

### Constraints

- **Framework agnostic:** Skills architecture must work beyond React (Node.js, Vue, Svelte via @tambo-ai/client). No browser-specific sandboxing.
- **Backwards compatible:** Adding skills must not break existing defineTool/TamboComponent usage. Skills are additive.
- **Existing DB patterns:** Use Drizzle ORM, follow packages/db/src/operations/ pattern. Generic config table approach.
- **Build system:** CLI changes must work with existing tambo init/add patterns. Skills push integrates with build pipeline.
- **Performance:** Threshold-based routing must not add latency for small skill counts (<=5). Fast model selection for >5 must be <500ms.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.9.3 - Core language across all packages, strict mode enforced
- JavaScript (ESM) - Build outputs and runtime execution
- SQL - Database queries via Drizzle ORM migrations (`packages/db/migrations/`)
- MDX - Documentation content in `docs/` package
- CSS - Tailwind utilities in component styles

## Runtime

- Node.js >=22.22.0 - Required runtime version
- Package Manager: npm 11.7.0+ with workspace monorepo support
- Version Management: `mise` (tool versions via `mise.toml` and `.node-version`)
- `package-lock.json` - Present and synced

## Frameworks

- NestJS 11.1.16 - REST API framework (`apps/api/`)
- Express 5.0.0 - HTTP server (via NestJS)
- Next.js 15.5.11 - Web dashboard and marketing (`apps/web/`, `showcase/`, `docs/`)
- React 18.3.1 - UI components (peer dependency across all packages)
- React DOM 18.3.1 - DOM rendering
- React Query (@tanstack/react-query) 5.90.16 - Server state management
- Meow 14.0.0 - CLI command-line framework (`cli/`)
- Jest 30.3.0 - Test runner (unit + integration tests)
- ts-jest 29.4.6 - TypeScript support for Jest
- Testing Library (@testing-library/react, @testing-library/dom) 16.3.2, 10.4.1 - DOM testing utilities
- Supertest 7.2.2 - HTTP assertion library for e2e tests
- Turbo 2.8.3 - Monorepo orchestration and task caching
- TypeScript Compiler (tsc) - Type checking and transpilation
- tsc-esm-fix 3.1.2 - ESM output fixes for dual CJS/ESM builds
- Concurrently 9.2.1 - Parallel task running
- ESLint 9.39.4 with @tambo-ai/eslint-config - Code linting
- Prettier 3.8.1 - Code formatting
- husky 9.1.7 - Git hooks
- lint-staged 16.3.4 - Pre-commit linting
- Drizzle ORM 0.45.1 - Type-safe ORM and query builder
- Drizzle Kit 0.31.9 - Migration generation and management
- PostgreSQL 8.20.0 (via `pg` driver) - Primary database

## Key Dependencies

- @tambo-ai/typescript-sdk 0.94.0 - Official Tambo SDK (external)
- openai 6.16.0 - OpenAI API client for LLM calls
- ai 5.0.155 - Vercel AI SDK for streaming and provider abstraction
- zod 3.25.76 - Runtime schema validation
- jose 5.10.0 - JWT token handling
- @ai-sdk/openai 2.0.100 - OpenAI provider (GPT-4, GPT-3.5)
- @ai-sdk/anthropic 2.0.70 - Anthropic provider (Claude)
- @ai-sdk/google 2.0.62 - Google provider (Gemini)
- @ai-sdk/groq 2.0.36 - Groq provider
- @ai-sdk/mistral 2.0.29 - Mistral provider
- @ai-sdk/openai-compatible 1.0.34 - Generic OpenAI-compatible providers
- langfuse 3.38.6 - LLM observability and logging
- gpt-tokenizer 3.2.0 - Token counting for prompts
- @ag-ui/client 0.0.44 - AG-UI client utilities
- @ag-ui/core 0.0.44 - AG-UI core abstractions
- @ag-ui/crewai 0.0.3 - CrewAI integration
- @ag-ui/llamaindex 0.1.5 - LlamaIndex integration
- @ag-ui/mastra 1.0.0 - Mastra integration
- @mastra/client-js 1.1.0 - Mastra client
- @mastra/core 1.1.0 - Mastra core framework
- @aws-sdk/client-s3 3.700.0 - AWS S3 client
- @aws-sdk/s3-request-presigner 3.700.0 - S3 presigned URLs
- @modelcontextprotocol/sdk 1.27.1 - Model Context Protocol server/client
- next-auth 4.24.12 - Session-based authentication framework
- class-validator 0.14.3 - Request DTO validation
- class-transformer 0.5.1 - Data transformation
- Tailwind CSS 3.4.19 - Utility-first CSS framework
- shadcn/ui (via Radix UI) - Component library (`@radix-ui/*` versions ^1.1-^2.2)
- class-variance-authority 0.7.0 - Component variant management
- clsx 2.1.1 - Conditional className builder
- Lucide React 0.577.0 - Icon library
- Framer Motion 12.29.0 - Animation library
- Spline (@splinetool/react-spline) 4.1.0 - 3D visualization
- react-markdown 10.1.0 - Markdown rendering
- remark 11.0.0 - Markdown AST processor
- rehype 7.0.0 - HTML AST processor
- highlight.js 11.11.1 - Code syntax highlighting
- shiki 3.20.0 - Syntax highlighting
- @tiptap/react 3.20.1 - Rich text editor
- @sentry/nextjs 10.43.0 - Error tracking and monitoring
- @sentry/nestjs 10.43.0 - NestJS Sentry integration
- @sentry/profiling-node 10.43.0 - Node.js performance profiling
- posthog-js 1.360.2 - Product analytics (client)
- posthog-node 5.24.9 - Product analytics (Node.js/CLI)
- @opentelemetry/sdk-node 0.213.0 - Observability instrumentation
- @opentelemetry/exporter-otlp-http 0.26.0 - OTLP metrics export
- @opentelemetry/instrumentation-\* - Auto-instrumentation for Express, NestJS, HTTP
- resend 6.9.1 - Transactional email API
- @react-email/components 1.0.8 - React email templates
- rxjs 7.8.1 - Reactive streams library (NestJS dependency)
- superjson 2.2.6 - JSON serialization with extended types
- fast-json-patch 3.1.1 - JSON patch operations
- partial-json 0.1.7 - Streaming JSON parsing
- date-fns 4.1.0 - Date utilities
- luxon 3.7.2 - Advanced date/time library
- fast-equals 6.0.0 - Deep equality comparison
- chalk 5.6.0 - Terminal colors
- ora 9.0.0 - CLI spinner
- inquirer 13.3.0 - Interactive prompts
- cross-spawn 7.0.6 - Cross-platform process spawning
- ts-morph 27.0.2 - TypeScript AST manipulation
- memfs 4.51.0 - In-memory filesystem for testing
- nanoid 3.3.11 - ID generation
- uuid 13.0.0 - UUID generation
- js-tiktoken 1.0.21 - Token counting for OpenAI models
- mime-types 3.0.2 - MIME type detection
- helmet 8.1.0 - HTTP security headers
- deepmerge 4.3.1 - Deep object merging

## Configuration

- Configuration managed via environment variables defined in `turbo.json` globalEnv
- Key variables: DATABASE*URL, OPENAI_API_KEY, RESEND_API_KEY, S3*_, SENTRY\__, LANGFUSE*\*, POSTHOG*\*
- Validation: @t3-oss/env-nextjs for Next.js apps, NestJS ConfigService for API
- `.env` files used locally (never committed)
- `tsconfig.json` - Shared TypeScript configuration (strict mode)
- `turbo.json` - Task orchestration, caching, and environment setup
- Individual `next.config.ts`, `jest.config.ts`, `drizzle.config.ts` per package
- Dual CJS/ESM builds for SDK packages (`dist/` and `esm/`)
- TypeScript declaration files included (`*.d.ts`)
- Workspace protocol (`*`) for internal dependencies

## Platform Requirements

- Node.js 22.22.0 (enforced via `.node-version` and `volta.node` in package.json)
- npm 11.7.0+ (enforced via `volta.npm` in package.json)
- PostgreSQL database (local or cloud)
- S3-compatible storage (AWS S3, Supabase, MinIO) - optional
- Optional: mise for automatic tool version management
- Deployment targets: Vercel (Next.js), self-hosted Node.js (NestJS API)
- PostgreSQL database required
- S3-compatible storage for file uploads
- Environment variables for all external services (OpenAI, Sentry, Langfuse, etc.)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- kebab-case for file and directory names
- Examples: `use-message-images.ts`, `framework-detection.test.ts`, `async-queue.ts`
- camelCase for all functions
- Use verbs: `executeClientTool`, `tryParseJson`, `detectFramework`, `setupTailwindAndGlobals`
- Boolean-returning functions: `isInteractive`, `hasAcceptedLegal`, `canEdit`, `shouldRefresh`
- camelCase for all variables and parameters
- Descriptive names: `mockDb`, `mockedOperations`, `executeSyncCalls`, `inquirerResponses`
- PascalCase for all type names, classes, and interfaces
- React component types: `TamboMessageProps`, `StagedImage`, `UseMessageImagesReturn`
- Domain error types: `DomainError`, `InputValidationError`, `NotFoundError`
- Prefix interfaces for React: `Tambo` for components, `TamboXxxProps` for props
- PascalCase: `AsyncQueue`, `ProjectsService`, `AppController`
- NestJS services use `Service` suffix: `ProjectsService`, `AuthService`
- NestJS controllers use `Controller` suffix: `AppController`, `ProjectsController`
- Components: `TamboXxx` (e.g., `TamboProvider`, `TamboMessage`)
- Hooks: `useTamboXxx` (e.g., `useMessageImages`)
- Props interfaces: `TamboXxxProps` (e.g., `TamboMessageProps`)
- Event handler props: start with `on` (e.g., `onMessageSend`, `onUpdate`)
- Internal handler functions: start with `handle` (e.g., `handleSend`, `handleClick`)
- Context: `TamboXxxContext` (e.g., `TamboNameContext`)
- UPPER_SNAKE_CASE (e.g., `NEXT_PUBLIC_TAMBO_API_KEY`, `CI`, `GITHUB_ACTIONS`)
- Use English only; no abbreviations except standard ones (API, URL, ctx, req, res, next)

## Code Style

- Tool: Prettier
- Print Width: 80
- Tab Width: 2
- No tabs (spaces only)
- Semicolons: required
- Single quotes: false (use double quotes)
- Trailing commas: all (ES5-compatible)
- Bracket spacing: true
- Arrow function parens: always
- End of line: lf
- Tool: ESLint with `@tambo-ai/eslint-config` base configuration
- Key rules enforced:
- Strict mode enabled throughout
- No `any` type; use `unknown` when type is uncertain, then narrow
- Avoid type assertions unless truly unavoidable
- Use `satisfies` for compile-time type checking without casting
- Use built-in utility types: `Pick`, `Omit`, `Partial`, `Required`, `ReturnType`, `Parameters`
- Prefer `type-fest` for advanced type manipulation
- Use `as const` for literal type preservation
- Use `Record<string, unknown>` over `object` or `{ [key: string]: unknown }`
- Avoid `{}` type (means "non-nullish primitive"); use `unknown` or specific object types

## Import Organization

- `@/` - in CLI/apps (points to src)
- `@tambo-ai/` - React SDK and framework packages
- `@tambo-ai-cloud/` - Cloud platform packages (db, core, backend)

## Error Handling

- **Validation errors:** Throw `InputValidationError` with specific message
- **Missing resources:** Throw `NotFoundError` with context
- **Domain errors:** Use `DomainError` with semantic kind
- **Guard clauses:** Early returns for invalid conditions
- **Try/catch with context:** Never silently catch errors; add context
- **Async/await:** Always use `await` with async functions; avoid `.catch()` except in fire-and-forget scenarios
- **NestJS exceptions:** Controllers map domain errors to HTTP exceptions
- **Unknown enum/union values:** Always throw, never use catch-all defaults
- **Null/undefined returns:** Validate database operation results

## Logging

- **Console logging:** Used in CLI and utilities
- **NestJS Logger:** Used in services and controllers
- **When to log:**

## Comments

- Complex algorithms or non-obvious logic requiring explanation
- JSDoc for public APIs, hooks, and exported functions
- Rationales for unusual patterns or workarounds
- Used on public functions, hooks, and component props
- Always include `@returns` description (type inferred from code)
- Include `@param` for complex parameters
- Use for component/hook descriptions

## Function Design

- Use guard clauses to handle invalid inputs early
- Optional parameters at the end
- Group related parameters into objects for 3+ params
- Prefer immutable returns (use `...spread`, `toSorted`, new objects)
- For void functions (side effects), use `executeX` or `saveX` naming
- All async functions must be declared `async`
- Must return Promise (enforced by ESLint `@typescript-eslint/promise-function-async`)
- Always `await` calls to async functions
- Prefer `async`/`await` with `try/catch` over `.then()/.catch()`

## Module Design

- Prefer named exports
- Allow multiple related exports (component + types, functions + interfaces)
- NO barrel files (`index.ts`) for internal modules; import directly from source
- Exception: package entry points (e.g., `packages/core/src/index.ts`) are fine
- Keep files focused: one main export per file
- Group related types/utilities in dedicated files
- Use `__fixtures__` or `__mocks__` for shared test helpers

## Immutability

- Prefer `const` for all variables; avoid `let`
- Use spread operator for object/array updates: `{ ...prev, name: "new" }`
- Use `toSorted()` instead of mutating `sort()`
- Never mutate function parameters
- For state updates, create new objects/arrays

## React-Specific Conventions

- Functional components only (no classes)
- Use `React.FC<Readonly<Props>>` for explicit typing
- Props should be `Readonly<T>`
- Keep components under 200-300 lines
- Follow React hooks rules (call at top level)
- Use `useCallback` for callbacks passed to children
- Minimize `useEffect`; derive state or memoize instead
- Never use `useQuery`/`useMutation` directly; use SDK wrappers (`useTamboQuery`, etc.)
- Local UI state: `useState`
- Shared state: React Context (but prefer props for <2 levels of nesting)
- No contexts for static config; pass as props
- Use React Query wrappers from SDK
- Use loading states from `devdocs/LOADING_STATES.md` patterns
- Show Skeleton or disabled real components during loading, not just spinners
- Fonts: Sentient for headings, Geist Sans for body, Geist Mono for code
- Layout: flex/grid with `gap` for spacing
- Avoid changing margins; use `p-*` and `gap-*` instead
- Truncate overflow with `text-ellipsis`

## NestJS Backend Conventions

- One module per domain: `{domain}.module.ts`, `{domain}.controller.ts`, `{domain}.service.ts`
- Supporting files: `dto/`, `entities/`, `guards/`, `strategies/`
- Use `class-validator` decorators for validation
- Import enums from source of truth (`packages/db/src/schema`)
- Define explicit response types, not raw database rows
- Encapsulate business logic
- Keep pure (no direct HTTP/Express access)
- Delegate DB operations to `@tambo-ai-cloud/db` helpers
- Place reused operations in `common/services`
- Stay thin: validate DTOs, delegate to services, translate errors
- Add Swagger decorators for every route
- Map domain errors to HTTP exceptions in error handlers
- Fail fast with clear messages; no silent fallbacks
- Reuse `ProjectAccessOwnGuard` for project-scoped routes
- Verify ownership explicitly (don't default to first project)
- Catch domain errors and map to HTTP exceptions
- Validate operation returns (no null checks should be silent)
- For enums, throw on unknown values; don't default

## Comments and Documentation

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- **Dual runtime design**: Framework packages (@tambo-ai/\*) run in multiple environments (browser, Node, CLI); cloud platform (apps/) runs on web and NestJS servers
- **Streaming-first**: All data flows through async iterable streams with event accumulation and state management
- **Provider-based composition**: React context providers handle tool registration, MCP integration, and state synchronization
- **Separation of concerns**: Business logic in services and operations; UI components orchestrate rather than implement
- **Database-operation factoring**: All DB access through operation functions in `packages/db/src/operations/`

## Layers

- Purpose: Reusable client, utilities, and helpers for building AI applications
- Location: `packages/client/`, `packages/core/`, `packages/backend/`
- Contains: Streaming logic, tool execution, MCP handling, LLM configuration, utilities
- Depends on: Tambo TypeScript SDK, MCP SDK, validation libraries
- Used by: React SDK, CLI, cloud platform
- Purpose: Framework-agnostic streaming client with thread/tool management
- Location: `packages/client/src/`
- Contains: `TamboClient` (main orchestrator), `TamboStream` (async iterable), event accumulation, tool execution
- Depends on: Tambo SDK, MCP SDK, core utilities
- Used by: React SDK, backend services, CLI
- Purpose: React-specific hooks, providers, and components for thread management
- Location: `react-sdk/src/`
- Contains: Hooks (useTamboChat, useTamboVoice), context providers, HOCs, schema compat
- Depends on: Client library, React Query, React Recorder
- Used by: Showcase, cloud web app, customer applications
- **Web Application**: Next.js frontend on port 8260
- **API Server**: NestJS backend on port 8261
- **Database Layer**: Drizzle ORM with operations
- **Core Utilities**: `packages/core/src/`
- **Backend Helpers**: `packages/backend/src/`
- Purpose: Project setup, component generation, app bootstrapping
- Location: `cli/src/`, `create-tambo-app/`
- Contains: Commands for init, add, create-app, upgrade; framework detection; template handling
- **Showcase**: Demo Next.js app showing all components
- **Docs**: Fumadocs site with guides and API reference

## Data Flow

- **Client-side**: `useState` for UI, `React Context` for shared state, `useSyncExternalStore` for external client state
- **Server-side**: Stateless controllers, services delegate to operations
- **Thread state**: Accumulated via `streamReducer()` from stream events
- **MCP state**: In-memory cache in `MCPClient` with subscription notifications

## Key Abstractions

- Purpose: Stateful orchestrator for threads, tools, and streaming
- Location: `packages/client/src/tambo-client.ts`
- Pattern: Provides `run()` for streaming, `getState()`/`subscribe()` for external store integration
- Interface: Takes options (apiKey, tools, mcpServers), exposes async `run(message, options)` → `TamboStream`
- Purpose: Async iterable wrapping server-sent events into strongly-typed `StreamEvent` objects
- Location: `packages/client/src/tambo-stream.ts`
- Pattern: Consumes fetch response stream, emits events with automatic deserialization
- Used by: React SDK hooks, backend services for streaming integration
- Purpose: Type-safe registration of UI components with schema and event handlers
- Location: `packages/client/src/model/component-metadata.ts`
- Pattern: `{ id, component, jsonSchema, componentProperties }` with tool-like interface
- Used by: Showcase registry, API response validation
- Purpose: Runtime validation of message content (text, tool calls, component updates)
- Location: `packages/core/src/thread-message-validation.ts`
- Pattern: Schema-based validation with discriminated unions for different message types
- Purpose: Centralized database access factoring (not Service-per-entity)
- Location: `packages/db/src/operations/`
- Files: `thread.ts`, `messages.ts`, `project.ts`, `users.ts`, `runs.ts`, etc.
- Pattern: Exports pure functions that build queries, no state or dependency injection
- Purpose: Application-level errors distinct from infrastructure exceptions
- Location: `packages/core/src/domain-error.ts`
- Pattern: `throw new DomainError(message, code)` caught by filters for HTTP mapping
- Purpose: Wrapper around MCP SDK for server communication and tool bridging
- Location: `packages/client/src/mcp/mcp-client.ts`
- Pattern: Connects to MCP servers, lists resources/tools, proxies calls through TamboClient

## Entry Points

- Location: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- Triggers: Browser navigation, server-side Next.js build
- Responsibilities: Wrap with providers (NextAuth, Tambo, tRPC, theme), render layout/pages
- Location: `apps/api/src/main.ts`
- Triggers: `npm run dev:api` or Docker startup
- Responsibilities: Configure Nest app, set up global pipes/filters, start HTTP server on port 8261
- Location: `cli/src/cli.ts`
- Triggers: `npx tambo <command>` or executable
- Responsibilities: Parse args, validate Node version, execute command (init, add, create-app, upgrade)
- Location: `react-sdk/src/v1/index.ts`
- Exports: Hooks, providers, types (all public API re-exported here)
- Usage: `import { useTamboChat, TamboProvider } from '@tambo-ai/react'`
- Location: `showcase/src/app/page.tsx` (as Next.js app)
- Triggers: `npm run dev:showcase` or port 8262
- Responsibilities: Demonstrate all Tambo components and integrations

## Error Handling

- **Framework Layer**: DomainError for application logic, propagate as-is
- **Controller Layer**: Catch DomainError, throw NestJS HttpException with status code
- **Global Filters**: `DomainExceptionFilter` catches DomainError → 400/404/409; `SentryExceptionFilter` captures unknown errors
- **Client Layer**: Catch HTTP errors, throw with context (thread ID, API response body)
- **Sentry Integration**: Initialize in main.ts first, capture unhandled exceptions/rejections in process handlers
- **React Layer**: Error boundaries in providers catch streaming errors, reset client state

## Cross-Cutting Concerns

- Backend: NestJS logger injected per module
- Client: `debug` flag in RunOptions passed to TamboStream
- Console-based, structured via middleware (RequestLoggerMiddleware captures request/response)
- Input: Class-validator in NestJS DTOs (enabled globally via ValidationPipe)
- Data: Zod schemas for API responses, thread messages, JSON structure validation
- Runtime: Thread message validation before storing/streaming
- Cloud platform: NextAuth (web) + API Key/Bearer token guards (API)
- SDK: API key passed to TamboClient, injected in Authorization header
- Validation: `ApiKeyGuard`, `BearerTokenGuard` on protected routes; decoding in AuthService
- Stream chunks throttled via `throttleChunks()` utility (prevents overwhelming clients)
- Async queue in core prevents concurrent tool execution beyond maxSteps
- Tool call tracker prevents duplicate execution
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
