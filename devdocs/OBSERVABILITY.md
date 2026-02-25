# Observability Guide

Tambo relies on a consistent observability stack across the monorepo. This document tells you **where** instrumentation lives and **how** to extend it safely.

## Stack Overview

| Layer            | Tools                                                 | Location                                                   |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| API (NestJS)     | OpenTelemetry + Langfuse + Sentry                     | `apps/api/src/telemetry.ts`, `apps/api/src/sentry.ts`      |
| Web (Next.js)    | Sentry (edge + server) + PostHog                      | `apps/web/sentry.*.config.ts`, `apps/web/lib/analytics.ts` |
| Backend packages | Langfuse helpers + OTEL context propagation           | `packages/backend`, `packages/core`                        |
| CLI              | PostHog via `posthog-node` SDK                        | `cli/src/lib/telemetry.ts`                                 |
| React SDK        | Host-app instrumentation only (no built-in telemetry) | `react-sdk/` (wrap `TamboProvider` in your own handlers)   |

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

## CLI (`cli/`)

- Uses the `posthog-node` SDK. Events are sent directly to PostHog (`us.i.posthog.com`) via `client.capture()`, and `await client.shutdown()` is called before the CLI exits to flush pending events.
- If the user is logged in, their Tambo user ID is used as the distinct ID; otherwise a random UUID is used. The PostHog project API key is embedded in the CLI (public by design — same as any frontend bundle).
- Opt-out: `TAMBO_TELEMETRY_DISABLED=1`. A one-time notice is shown on first run.
- All event names use dot notation matching the web convention: `cli.command.completed`, `cli.command.error`, `cli.component.added`, `cli.init.completed`, `cli.auth.login`, `cli.auth.logout`.
- State is stored in the XDG data directory (`env-paths`): `telemetry.json` for the anonymous UUID.
- Dev override: set `TAMBO_TELEMETRY_HOST` to point at a different PostHog-compatible ingest endpoint.
- When adding new CLI events:
  1. Add the event name to `EVENTS` in `cli/src/lib/telemetry.ts`.
  2. Call `trackEvent(EVENTS.NEW_EVENT, { ... })` in the relevant command handler.
  3. New properties are passed through automatically (no server-side allowlist).

## Backend Packages

- `packages/backend` includes streaming + tool orchestration helpers that already emit Langfuse spans. If you add new tool runners, emit events via the same helper to keep traces consistent.
- `packages/core` utilities must stay pure, but when they expose hooks into observability (e.g., JSON schema strictness failures), raise explicit errors so upstream callers can attach spans/breadcrumbs.

## React SDK

- The SDK intentionally ships **without** Sentry/Langfuse/PostHog dependencies. Host apps are responsible for instrumenting via their own providers.
- When you need telemetry, derive identifiers through hooks such as `useTamboThread`, `useTamboStreamStatus`, or props exposed by `TamboProvider` (e.g., `contextKey`, `onCallUnregisteredTool`) and forward events to your app’s logging layer.
- Avoid sprinkling `console.log` in exported hooks/components. Instead, surface callbacks/return values so downstream apps can plug in their own analytics.

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
