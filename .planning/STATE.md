# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Developers can see exactly what's happening inside their Tambo app without resorting to console.log or manual network tab inspection.
**Current focus:** Phase 3 in progress — Streaming Visibility

## Current Position

Phase: 3 of 3 (Streaming Visibility)
Plan: 3 of 3 in current phase — COMPLETE
Status: Phase 3 COMPLETE — All plans executed
Last activity: 2026-02-12 -- Plan 03-03 executed

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase                   | Plans | Total | Avg/Plan |
| ----------------------- | ----- | ----- | -------- |
| 1. WebSocket Bridge     | 3/3   | -     | -        |
| 2. Inspection Panels    | 3/3   | 13min | 4.3min   |
| 3. Streaming Visibility | 3/3   | 9min  | 3min     |

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 3 phases derived -- bridge, inspection panels, streaming visibility
- [Roadmap]: COMP category split -- static registry views (COMP-01/02/03) in Phase 2, streaming views (COMP-04/05/06) in Phase 3
- [Phase 1]: Standalone WS server on port 8265 (not NestJS gateway, not next-ws patch)
- [Phase 1]: partysocket for SDK client, native WebSocket for dashboard client
- [Phase 1]: JSON.stringify for Phase 1 serialization (superjson deferred to Phase 2)
- [Phase 1]: Protocol types defined independently on each side (no cross-package TS imports)
- [Phase 1]: Dashboard subscribes via `subscribe_dashboard` message to differentiate from SDK clients
- [Phase 2]: Export StreamStateContext (@internal) for devtools access rather than dynamic require
- [Phase 2]: Non-throwing useStreamStateForDevtools hook returns null outside TamboStreamProvider
- [Phase 2]: Refs for latest state values to avoid stale closures in onRequestSnapshot
- [Phase 2]: Exported serialized content types from devtools-server/types.ts for component consumption
- [Phase 2]: SnapshotThread type derived from StateSnapshot rather than separate interface
- [Phase 2]: Derived SnapshotMessage type from StateSnapshot for filter compatibility
- [Phase 2]: 200ms debounce on search input for filter bar
- [Phase 3]: RawEventCallbackContext with ref pattern for zero-overhead devtools event tap
- [Phase 3]: JSON.parse(JSON.stringify()) for lightweight AG-UI event serialization
- [Phase 3]: Simple capped array (5000) for stream event storage (ring buffer in Plan 02)
- [Phase 3]: RingBuffer<T> with scroll-position virtualization for timeline panel
- [Phase 3]: Component events identified by CUSTOM eventType + tambo.component.\* name prefix
- [Phase 3]: Cumulative props sourced from snapshot (not patch replay) per research
- [Phase 3]: Tool args accumulated by concatenating TOOL_CALL_ARGS deltas then JSON.parse

### Pending Todos

- SDK version injection at build time (currently hardcoded "1.0.1")

### Blockers/Concerns

- [Resolved]: WebSocket server hosting — standalone `ws` server on port 8265
- [Resolved]: Cross-origin — scoped to local-only for v1

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 03-03-PLAN.md — All phases complete
Resume file: None
