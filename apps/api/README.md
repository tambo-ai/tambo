# Tambo API (apps/api)

NestJS service powering the Tambo Cloud backend (projects, threads, registry sync, OAuth flows, MCP server, schedulers). For deeper rules read `apps/api/AGENTS.md`.

## Quick Start

1. Copy `.env.example` to `.env` (see root `turbo.json` for the full env list).
2. `npm install`
3. `npm run dev`
4. Swagger is available at [http://localhost:8261/api](http://localhost:8261/api)

## Commands

```bash
npm run dev            # watch mode
npm run build          # compile to dist/
npm run start:prod     # run compiled build
npm run lint           # ESLint (@tambo-ai config)
npm run check-types    # tsc --noEmit
npm test               # Jest unit tests
npm run test:cov       # Coverage report
npm run test:e2e       # Supertest suite (test/app.e2e-spec.ts)
npm run generate-config # outputs runtime config snapshot
```

Always run lint + check-types + test before committing per root AGENTS rules.

## Architecture

```
src/
├── ai/           # LLM orchestration + tool runners
├── audio/        # Upload + transcription helpers
├── common/       # DTOs, filters, middleware, shared services
├── extractor/    # Content extraction pipelines
├── mcp-server/   # Model Context Protocol entry points
├── oauth/        # OAuth flows + DTOs
├── projects/     # Project CRUD + API key management + guards
├── registry/     # Component registry sync + hooks
├── scheduler/    # Cron + background jobs
├── threads/      # Threads, messages, tool calls
├── users/        # User CRUD
└── main.ts       # Bootstrap with Sentry + OTEL
```

- Each domain exports `{domain}.module/controller/service.ts` plus colocated `dto/`, `guards/`, and `entities/`.
- Shared persistence utilities live in `common/services`; everything talks to `@tambo-ai-cloud/db`.
- `src/config.service.ts` is the only place allowed to read `process.env`.

## Authentication

- API key guard: `projects/guards/apikey.guard.ts` reads the `x-api-key` header.
- Bearer guard: `projects/guards/bearer-token.guard.ts` for session tokens.
- Project ownership guard: `projects/guards/project-access-own.guard.ts`.
- Thread-specific guard: `threads/guards/thread-in-project-guard.ts`.

**Swagger Auth**

1. Visit Swagger UI → Authorize
2. Enter `x-api-key` header (generate from the dashboard)
3. Endpoints note when bearer tokens are required

## Rate Limiting

- Global guard: `common/rate-limit/rate-limit.guard.ts` (registered by
  `common/rate-limit/rate-limit.module.ts`) allows `RATE_LIMIT_DEFAULT`
  (default 100) requests per minute, per endpoint, per client IP, with a
  60-second TTL. Enforcement is opt-in via `RATE_LIMIT_ENABLED=true`.
- Client IPs are trusted only for the `TRUST_PROXY` hop count (default:
  none). Leave it unset when exposed directly; set it behind a reverse
  proxy or ingress, otherwise all clients share one bucket.
- Over-limit responses are RFC 9457 Problem Details 429s with `Retry-After`
  and `X-RateLimit-*` headers; health endpoints (`GET /`, `GET /health`) are
  exempt via `@SkipThrottle()`.
- Budgets are per egress IP, so backends calling on behalf of end users
  share one budget, and each agentic tool round counts against it. Counters
  are in-memory (per process).
- Per-project limits keyed on the validated project identity are planned as a
  follow-up.

## Observability

- Sentry configured in `src/sentry.ts` with tags (`projectId`, `threadId`, etc.).
- OpenTelemetry spans configured via `src/telemetry.ts`; long-running operations should create child spans.

See `devdocs/OBSERVABILITY.md` for expectations and tag conventions.

## Testing

- Co-locate `.test.ts` files next to implementations; e2e specs live in `apps/api/test/`.
- Use `@nestjs/testing` to spin up test modules and mock dependencies.
- `npm run test:cov` establishes the coverage floor; do not regress without explaining why.
- For integration/e2e, rely on Supertest + the `test/jest-e2e.json` config.

## Reference Docs

- `apps/api/AGENTS.md` – canonical architecture + workflow guidance for agents
- Root `AGENTS.md` – repository-wide rules
