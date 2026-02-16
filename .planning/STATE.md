# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** The CLI should feel magic — run one command and your app is Tambo-enabled with the right components registered, tools created, and a working chat widget, all tailored to what's actually in the codebase.

**Current focus:** Phase 6 - CLI Integration

## Current Position

Phase: 6 of 6 (CLI Integration)
Plan: 2 of 2 in current phase — COMPLETE
Status: Complete
Last activity: 2026-02-16 — Completed 06-02 (CLI flag wiring)

Progress: [██████████████████████████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 16
- Average duration: ~7 min
- Total execution time: ~3 hours 23 min

**By Phase:**

| Phase                | Plans | Total    | Avg/Plan |
| -------------------- | ----- | -------- | -------- |
| 01-client-core-sdk   | 5     | ~35 min  | ~7 min   |
| 02-codebase-analysis | 3     | ~109 min | ~36 min  |
| 03-plan-generation   | 2     | ~11 min  | ~5.5 min |
| 04-user-confirmation | 2     | ~9 min   | ~4.5 min |
| 05-code-execution    | 2     | ~12 min  | ~6 min   |
| 06-cli-integration   | 2     | ~11 min  | ~5.5 min |

**Recent Trend:**

- Last 5 plans: 04-02 (3min), 05-01 (4min), 05-02 (8min), 06-01 (7min), 06-02 (4min)
- Phase 1 complete (5/5 plans)
- Phase 2 complete (3/3 plans)
- Phase 3 complete (2/2 plans)
- Phase 4 complete (2/2 plans)
- Phase 5 complete (2/2 plans)
- Phase 6 complete (2/2 plans)

| Phase/Plan   | Duration (s) | Tasks   | Files   |
| ------------ | ------------ | ------- | ------- |
| Phase 02 P03 | 634          | 2       | 4       |
| Phase 03 P01 | 284          | 2 tasks | 5 files |
| Phase 03 P02 | 358          | 2 tasks | 4 files |
| Phase 04 P01 | 335          | 3 tasks | 7 files |
| Phase 04 P02 | 201          | 2 tasks | 4 files |
| Phase 05 P01 | 260          | 2 tasks | 5 files |
| Phase 05 P02 | 457          | 2 tasks | 6 files |
| Phase 06 P01 | 408          | 2 tasks | 2 files |
| Phase 06 P02 | 214          | 1 task  | 3 files |

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
- [Phase 03-02]: JSON extraction uses 5 fallback strategies (markdown blocks, raw JSON, embedded JSON)
- [Phase 03-02]: Thread creation uses metadata field instead of title (SDK compatibility)
- [Phase 04-01]: Used diff package for unified patch generation instead of custom implementation
- [Phase 04-01]: Template-based content transformations (not LLM-generated) for predictable, fast, deterministic output
- [Phase 04-01]: Best-effort pattern matching with graceful fallback for robust transformation across varied codebases
- [Phase 04-02]: Auto-approve threshold at 80% confidence for --yes mode (balances automation with safety)
- [Phase 04-02]: Provider setup always included regardless of confidence (required for Tambo functionality)
- [Phase 04-02]: Skip diff generation in --yes mode for faster automation path
- [Phase 05-01]: Use real filesystem (os.tmpdir) for file-operations tests - need real fs behavior not memfs
- [Phase 05-01]: Sequential dependency installation (prod then dev) for clear progress feedback
- [Phase 05-01]: Always include @tambo-ai/react, conditionally add zod only when tools selected
- [Phase 05-02]: Integration-style tests over mocked tests due to Jest ESM limitations
- [Phase 05-02]: Verification warnings are non-blocking (success: true with errors array)
- [Phase 05-02]: Union type RecommendationWithType instead of any for type safety
- [Phase 06]: Use process.env.TAMBO_API_KEY first before .env files for simplicity
- [Phase 06]: Integration-style tests due to Jest ESM mocking limitations
- [Phase 06-02]: Check for TamboProvider in layout files and tambo.ts in lib directories to detect existing magic setup
- [Phase 06-02]: Show suggestion tip only when magic setup doesn't exist (avoids nagging users)

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 6 added: CLI Integration — wire --magic flag into tambo init

### Blockers/Concerns

- retry.ts still exists (updated to use SDK's APIError) — may be removed if streaming.ts no longer needs it after further phases
- streaming.ts (custom SSE) still exists alongside SDK streaming — SDK streaming used for runs, custom SSE kept for potential direct use

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 06-02 (CLI flag wiring). Phase 6 complete (2/2). All phases complete.
Resume file: None
