# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** The CLI should feel magic — run one command and your app is Tambo-enabled with the right components registered, tools created, and a working chat widget, all tailored to what's actually in the codebase.

**Current focus:** Phase 2 - Codebase Analysis (In Progress)

## Current Position

Phase: 2 of 5 (Codebase Analysis)
Plan: 1 of 4 in current phase — COMPLETE
Status: In progress
Last activity: 2026-02-12 — Completed 02-01 (Project analysis foundation)

Progress: [██████████░░░░░░░░░░░░░░░░░░░░] 25%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: ~21 min
- Total execution time: ~2.1 hours

**By Phase:**

| Phase                | Plans | Total   | Avg/Plan |
| -------------------- | ----- | ------- | -------- |
| 01-client-core-sdk   | 5     | ~35 min | ~7 min   |
| 02-codebase-analysis | 1     | ~91 min | ~91 min  |

**Recent Trend:**

- Last 5 plans: 01-02 (2min), 01-03 (12min), 01-04 (8min), 01-05 (8min), 02-01 (91min)
- Phase 1 complete (5/5 plans)
- Phase 2 in progress (1/4 plans)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Build client-core as separate package (eventually replaces API layer in react-sdk; CLI needs non-React access to Tambo API)
- Phase 3+: Model handles code changes via tool calls (more flexible than templates; adapts to any codebase structure)
- 01-01: Used exponential-backoff library for retry logic instead of custom implementation (reliability, battle-tested)
- 01-01: Retry 5xx and network errors only, never retry 4xx client errors (avoid wasting resources on invalid requests)
- 01-01: Dual CJS/ESM builds to support both Node.js and modern bundlers
- **ARCHITECTURE CHANGE (01-03):** Use @tambo-ai/typescript-sdk for API calls instead of raw fetch. Use @tanstack/query-core for caching.
- 01-05: Functions-over-classes pattern: createTamboClient, createThreadsClient, createToolRegistry, executeRun
- 01-05: Local StreamEventData interface to cast SDK's sparse RunRunResponse (type + timestamp only) to access runtime event fields
- 02-01: Framework detection priority: Next.js > Vite > Remix > CRA (CRA lowest due to deprecation)
- 02-01: src/ prefixed paths checked before root paths for layout file discovery
- 02-01: Pure analysis functions with no side effects; separate detection modules for focused responsibility

### Pending Todos

None yet.

### Blockers/Concerns

- retry.ts still exists (updated to use SDK's APIError) — may be removed if streaming.ts no longer needs it after further phases
- streaming.ts (custom SSE) still exists alongside SDK streaming — SDK streaming used for runs, custom SSE kept for potential direct use

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 02-01 (Project analysis foundation). Next: 02-02 (Provider and component detection)
Resume file: None
