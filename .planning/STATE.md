# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** The CLI should feel magic — run one command and your app is Tambo-enabled with the right components registered, tools created, and a working chat widget, all tailored to what's actually in the codebase.

**Current focus:** Phase 3 - Plan Generation (In Progress)

## Current Position

Phase: 3 of 5 (Plan Generation)
Plan: 1 of 2 in current phase — COMPLETE
Status: In progress
Last activity: 2026-02-13 — Completed 03-01 (InstallationPlan types and prompt builder)

Progress: [█████████████████░░░░░░░░░░░░░] 45%

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: ~14 min
- Total execution time: ~2.5 hours

**By Phase:**

| Phase                | Plans | Total    | Avg/Plan |
| -------------------- | ----- | -------- | -------- |
| 01-client-core-sdk   | 5     | ~35 min  | ~7 min   |
| 02-codebase-analysis | 3     | ~109 min | ~36 min  |
| 03-plan-generation   | 1     | ~5 min   | ~5 min   |

**Recent Trend:**

- Last 5 plans: 01-05 (8min), 02-01 (91min), 02-02 (8min), 02-03 (10min), 03-01 (5min)
- Phase 1 complete (5/5 plans)
- Phase 2 complete (3/3 plans)
- Phase 3 in progress (1/2 plans)

| Phase/Plan   | Duration (s) | Tasks   | Files   |
| ------------ | ------------ | ------- | ------- |
| Phase 02 P03 | 634          | 2       | 4       |
| Phase 03 P01 | 284          | 2 tasks | 5 files |

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
- 02-02: Provider nesting level counts only other Provider ancestors, not all JSX elements
- 02-02: Component detection limited to 50 results to avoid overwhelming output
- 02-02: Extract FC generic type param with regex instead of complex AST traversal
- 02-02: Check return expression kind directly before checking descendants for JSX detection
- [Phase 02-03]: Tool detection batches files by directory for ts-morph memory optimization
- [Phase 02-03]: Server actions prioritized over exported-function type during deduplication
- [Phase 02-03]: Tool candidates capped at 30 results, sorted by file path and name
- [Phase 03-01]: Used .strip() mode for Zod schemas to silently remove extra LLM output fields
- [Phase 03-01]: Limited prompt components and tools to top 10 for token budget management

### Pending Todos

None yet.

### Blockers/Concerns

- retry.ts still exists (updated to use SDK's APIError) — may be removed if streaming.ts no longer needs it after further phases
- streaming.ts (custom SSE) still exists alongside SDK streaming — SDK streaming used for runs, custom SSE kept for potential direct use

## Session Continuity

Last session: 2026-02-13
Stopped at: Completed 03-01 (InstallationPlan types and prompt builder). Next: 03-02 (Plan generation orchestrator)
Resume file: None
