# Observability Guide

Tambo relies on a consistent observability stack across the monorepo. This document tells you **where** instrumentation lives and **how** to extend it safely.

## Stack Overview

| Layer            | Tools                                                    | Location                                                   |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| API (NestJS)     | OpenTelemetry + Langfuse + Sentry                        | `apps/api/src/telemetry.ts`, `apps/api/src/sentry.ts`      |
| Web (Next.js)    | Sentry (edge + server) + PostHog                         | `apps/web/sentry.*.config.ts`, `apps/web/lib/analytics.ts` |
| Backend packages | Langfuse helpers + OTEL context propagation              | `packages/backend`, `packages/core`                        |
| React SDK        | Streaming telemetry via Langfuse + browser logging hooks | `react-sdk/src/providers`                                  |

## Principles

- **Fail fast**: instrumentation should throw loudly in local environments when misconfigured. Do not swallow errors.
- **Tag aggressively**: every span/event must include `projectId`, `threadId`, and `environment` when those values exist.
- **Keep secrets safe**: never log API keys or user PII. Redact tokens before sending to analytics providers.
- **One source of truth**: reuse existing helpers instead of creating ad-hoc logging wrappers.

## API (apps/api)

- `src/telemetry.ts` bootstraps OTEL (`@opentelemetry/sdk-node`). New modules must import `trace`/`context` from this setup; do **not** create another SDK.
- Langfuse instrumentation (`@langfuse/otel`) is attached globally. When streaming LLM responses, wrap them in spans named `llm.stream`.
- Sentry is configured in `src/sentry.ts`. Controllers should use the provided `SentryInterceptor` to capture tags like request path, project ID, thread ID.
- When adding external service calls:
  - Create a child span: `const span = tracer.startSpan('service:linear.fetch');`
  - Add attributes (`span.setAttribute('linear.issueId', issueId)`).
  - End spans in `finally` blocks.
- Scheduler jobs must log to Sentry breadcrumbs + OTEL spans so failures show in both systems.

## Web (apps/web)

- Sentry configuration files (`sentry.server.config.ts`, `sentry.edge.config.ts`) wrap Next handlers. Use `withSentryConfig` when creating new route handlers or middleware.
- Client analytics go through `lib/analytics.ts` (PostHog). All new events must:
  - Include a clear event name (`web.project.created`)
  - Attach project/session identifiers
  - Be debounced when triggered from high-frequency UI interactions.
- For client errors, rely on Sentry’s automatic instrumentation and add meaningful context using `Sentry.setContext` inside error boundaries.
- Never call PostHog or Sentry directly from random components; extend helper utilities so behavior stays centralized.

## Backend Packages

- `packages/backend` includes streaming + tool orchestration helpers that already emit Langfuse spans. If you add new tool runners, emit events via the same helper to keep traces consistent.
- `packages/core` utilities must stay pure, but when they expose hooks into observability (e.g., JSON schema strictness failures), raise explicit errors so upstream callers can attach spans/breadcrumbs.

## React SDK

- Streaming providers emit telemetry via Langfuse to tie client UI state to backend events. When adding new providers/hooks, surface identifiers (threadId, contextKey) to the telemetry helpers so dashboards can correlate events.
- Avoid logging directly in components. Instead, expose dedicated callbacks (e.g., `onStreamingError`) that the hosting app can wire to Sentry/PostHog.

## Adding New Instrumentation

1. **Pick the correct layer**: API for server-side logic, Web for UI interactions, backend packages for reusable LLM helpers.
2. **Use existing helpers** (`telemetry.ts`, `lib/analytics.ts`, etc.). If none exist, create one under the proper directory and document it here.
3. **Tag everything** with relevant identifiers and environment info.
4. **Verify locally** by running the service with `SENTRY_DSN`/Langfuse env vars pointing to dev projects.
5. **Document** the new signal (what triggers it, why it exists) either in this file or the package-specific AGENTS/README.

## Troubleshooting

- Missing traces? Ensure `NODE_OPTIONS=--require apps/api/src/telemetry.ts` (or equivalent bootstrap) is still wired; Nest CLI scripts already set it.
- Seeing duplicate events? Check that you’re not wrapping handlers twice with Sentry or PostHog.
- Langfuse errors? Confirm the API key + base URL are correct and network access is allowed from the environment.

Keep this doc updated as instrumentation evolves so every engineer knows how to reason about the telemetry firehose.
