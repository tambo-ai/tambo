# AGENTS.md

Detailed guidance for Claude Code agents working inside `apps/api`, the NestJS OpenAPI server that powers Tambo Cloud.

## Overview

- **Tech stack**: NestJS 11, TypeScript strict mode, Drizzle ORM (via `@tambo-ai-cloud/db`), Langfuse/Sentry instrumentation, OpenTelemetry traces, Swagger UI.
- **Purpose**: Serves the REST + Webhook surface area for projects, threads, registry sync, OAuth flows, MCP server endpoints, and scheduler workflows.
- **Entry points**: `src/main.ts` bootstraps the Nest application; `app.module.ts` wires domain modules.

## Essential Commands

```bash
npm run dev           # Start Nest in watch mode (port 8261 by default)
npm run build         # Compile to dist/ for production
npm run start:prod    # Run the compiled build
npm run generate-config # Bootstraps runtime config snapshot
npm run lint          # ESLint with @tambo-ai config
npm run check-types   # tsc --noEmit
npm test              # Jest unit tests (ts-jest)
npm run test:cov      # Generate coverage report
npm run test:e2e      # Supertest-based e2e suite (test/app.e2e-spec.ts)
npm run clean         # Remove dist/ + coverage/
```

Always align with the root-level requirement to run `npm run lint`, `npm run check-types`, and `npm test` before opening a PR.

## Directory Structure

```
apps/api/src
├── ai/             # AI orchestration services (LLM + tool routing)
├── audio/          # Audio ingestion, transcription, and media helpers
├── common/         # Shared DTOs, filters, middleware, system tools
├── extractor/      # Content extraction pipelines
├── mcp-server/     # Model Context Protocol server wiring
├── oauth/          # OAuth flows, DTOs, and controller
├── projects/       # Project CRUD, API key generation, guards
├── registry/       # Component registry sync + webhooks
├── scheduler/      # Cron + background job orchestration
├── threads/        # Thread + message lifecycle
├── users/          # User CRUD + profile helpers
├── app.module.ts   # Root module composition
└── main.ts         # Bootstrap with Sentry + OTEL
```

### Module Conventions

- Each domain folder defines `{domain}.module.ts`, `{domain}.controller.ts`, `{domain}.service.ts`, and colocated `dto/`, `entities/`, `guards/`, or `strategies/` directories.
- Services contain pure business logic and must not reach for Express request/response objects.
- Controllers stay thin: validate DTOs, delegate to services, translate domain errors into HTTP exceptions.

## Configuration & Secrets

- Env variables are documented at the repo root (`turbo.json` globalEnv). Use `.env` locally; never commit secrets.
- `src/config.service.ts` centralizes config access and should be the only way to read env vars inside modules.
- For new configuration, add validation rules there and document the variable in README + AGENTS if it impacts workflows.

## Authentication & Authorization

- Guard implementations live under `projects/guards/` (API keys, bearer tokens, project ownership) and `threads/guards/`.
- Guards must fail fast with clear messages. No silent fallbacks or defaulting to the first project.
- Reuse `ProjectAccessOwnGuard` for project-scoped routes; do not clone guard logic.
- When adding a new auth path, update Swagger decorators so docs stay accurate.

## Data Access

- All persistence goes through `@tambo-ai-cloud/db` helpers; never inline SQL.
- Prefer injectable repository/services under `src/common/services` when logic is shared between modules.
- Keep operations idempotent. If a write can happen twice (webhooks, schedulers), add guards or unique constraints at the database layer.

## DTOs & Validation

- DTOs belong in `dto/` directories in each module and must use `class-validator` decorators.
- For request bodies referencing enums or Drizzle schema enums, import the source of truth (e.g., `packages/db/src/schema`).
- DTOs mirror API responses too—define explicit response interfaces instead of returning raw database rows.

## Observability

- Enable tracing via `src/telemetry.ts`. Any long-running service (scheduler jobs, external API calls) should create spans.
- Wrap controller entry points with Sentry decorators (`apps/api/src/sentry.ts`) so errors surface with tags (`projectId`, `threadId`).
- When adding a new external integration, capture latency metrics using the OTEL helpers in `common/utils`.

## Testing

- Co-locate unit tests beside their targets using `.test.ts`. Integration/e2e tests live under `apps/api/test/`.
- Use `@nestjs/testing` to spin up lightweight modules; prefer mocking services over hitting the DB for unit tests.
- Guard/service/controller tests should cover:
  - DTO validation paths (happy path + failure)
  - Auth guard rejection cases (missing header, project mismatch)
  - Cross-module flows (e.g., threads touching projects) via integration tests
- Always run `npm run test:cov` when adding meaningful logic to keep a coverage baseline; document gaps if coverage dips.

### NestJS unit tests (providers/services)

- Use `createTestingModule(...)` from `apps/api/src/test/utils/create-testing-module.ts` to build a lightweight module and override providers.
- If you need to resolve a request-scoped provider (`@Injectable({ scope: Scope.REQUEST })`), use the helpers in `apps/api/src/test/utils/*`.
- When passing a request to `createTestRequestContext(...)`, mirror the request shape your code uses with `ContextIdFactory.getByRequest(...)`.

```ts
import type { TestingModule } from "@nestjs/testing";

// Helper import path depends on your test file location.
// Adjust this relative path based on where your test file lives under `src/`.
// For example, from `src/common/services/foo.service.test.ts` you'd use `../../test/utils/create-testing-module` and related helpers.
import { createTestRequestContext } from "../../test/utils/create-test-request-context";
import { createTestingModule } from "../../test/utils/create-testing-module";
import { resolveRequestScopedProvider } from "../../test/utils/resolve-request-scoped-provider";

it("resolves request-scoped providers", async () => {
  const module: TestingModule = await createTestingModule(
    {
      // Replace these with the providers you want to test.
      providers: [MyService, MyRequestScopedService],
    },
    (builder) =>
      builder.overrideProvider(MyService).useValue({
        doThing: jest.fn(),
      }),
  );

  const context = createTestRequestContext({
    headers: {},
  });

  try {
    const requestScoped = await resolveRequestScopedProvider(
      module,
      MyRequestScopedService,
      context,
    );

    expect(requestScoped).toBeDefined();
  } finally {
    await module.close();
  }
});
```

If code under test calls `ContextIdFactory.getByRequest(...)` (most tests won't), stub it _inside the test_ and restore it in a `finally` (or `afterEach`) block:

```ts
import { ContextIdFactory } from "@nestjs/core";

const getByRequestSpy = jest
  .spyOn(ContextIdFactory, "getByRequest")
  .mockImplementation(() => context.contextId);

try {
  // ...
} finally {
  getByRequestSpy.mockRestore();
}
```

Avoid adding this stub in global setup since it can leak `ContextIdFactory` state between tests.

Always close the `TestingModule` in a `finally` block (or `afterEach`) when using `createTestingModule(...)`.

See `src/test/utils/nest-testing.example.test.ts` for a runnable example.

## Development Workflow

1. **Read existing code** within the domain module before touching anything.
2. **Update documentation first** if you are adding a new endpoint or feature; AGENTS + README must describe the change.
3. **Add DTOs + tests** before wiring controllers.
4. **Wire services** and ensure providers are registered inside the module.
5. **Add Swagger decorators** for every route (summary, description, auth requirements).
6. **Verify locally** with `npm run dev` and the Swagger UI at `http://localhost:8261/api`.
7. **Run lint, type-check, and tests** before committing.

## Common Pitfalls

- Skipping guards: every controller method touching project data must enforce ownership.
- Forgetting to register providers: Nest will throw at runtime; run tests to catch missing injections.
- Bypassing `ConfigService`: direct `process.env` reads drift from validation rules.
- Mutating shared DTO instances: treat DTOs as immutable and create new objects when enriching responses.

Sticking to these patterns keeps the API dependable and makes onboarding faster for everyone touching the Cloud platform.
