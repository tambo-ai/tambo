# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** The CLI should feel magic — run one command and your app is Tambo-enabled with the right components registered, tools created, and a working chat widget, all tailored to what's actually in the codebase.

**Current focus:** Phase 1 - Client Core SDK

## Current Position

Phase: 1 of 5 (Client Core SDK)
Plan: 2 of 5 in current phase
Status: Replanning — architecture change (typescript-sdk + TanStack query-core)
Last activity: 2026-02-12 — Plans restructured: added 01-03 (SDK+TanStack refactor), renumbered 01-04/01-05

Progress: [██░░░░░░░░] 40%

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: 3 min
- Total execution time: 0.10 hours

**By Phase:**

| Phase              | Plans | Total | Avg/Plan |
| ------------------ | ----- | ----- | -------- |
| 01-client-core-sdk | 2     | 6 min | 3 min    |

**Recent Trend:**

- Last 5 plans: 01-01 (4min), 01-02 (2min)
- Trend: Phase 1 at 40% (2/5 plans)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Build client-core as separate package (eventually replaces API layer in react-sdk; CLI needs non-React access to Tambo API)
- Phase 3+: Model handles code changes via tool calls (more flexible than templates; adapts to any codebase structure)
- 01-01: Used exponential-backoff library for retry logic instead of custom implementation (reliability, battle-tested)
- 01-01: Retry 5xx and network errors only, never retry 4xx client errors (avoid wasting resources on invalid requests)
- 01-01: Dual CJS/ESM builds to support both Node.js and modern bundlers
- **ARCHITECTURE CHANGE (01-03):** Use @tambo-ai/typescript-sdk for API calls instead of raw fetch. Use @tanstack/query-core for caching. Plans 01-01/01-02 kept as-is; 01-03 refactors to new approach; 01-04/01-05 build on refactored foundation.

### Pending Todos

None yet.

### Blockers/Concerns

- 01-03 refactor will replace raw fetch in client.ts and threads.ts — existing retry.ts may become unused (SDK handles retries internally)

## Session Continuity

Last session: 2026-02-12 (architecture change)
Stopped at: Plans restructured. Next: execute 01-03 (typescript-sdk + TanStack refactor)
Resume file: None
