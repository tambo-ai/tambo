---
phase: 02-inspection-panels
plan: 01
subsystem: devtools
tags: [websocket, react-context, serialization, devtools, streaming]

requires:
  - phase: 01-websocket-bridge
    provides: WebSocket bridge, protocol types, dashboard hook

provides:
  - Enriched DevToolsStateSnapshot with messages, schemas, MCP, streaming state, errors
  - Safe serialization of ReactElements, functions, Zod schemas, circular refs
  - Debounced SDK snapshot emission from React contexts
  - Per-session snapshot storage in dashboard hook
  - On-demand snapshot request from dashboard

affects: [02-inspection-panels, 03-streaming-visibility]

tech-stack:
  added: []
  patterns:
    [
      non-throwing context hook for optional provider access,
      debounced snapshot emission,
      ref-based closure stability,
    ]

key-files:
  created:
    - react-sdk/src/devtools/use-stream-state-for-devtools.ts
  modified:
    - react-sdk/src/devtools/tambo-dev-tools.tsx
    - react-sdk/src/devtools/devtools-bridge.ts
    - react-sdk/src/v1/providers/tambo-v1-stream-context.tsx
    - apps/web/devtools-server/types.ts
    - apps/web/devtools-server/connection-manager.ts
    - apps/web/app/(authed)/devtools/hooks/use-devtools-connection.ts

key-decisions:
  - "Export StreamStateContext (marked @internal) rather than dynamic require for devtools access"
  - "Non-throwing useStreamStateForDevtools hook returns null outside TamboStreamProvider"
  - "Refs for latest state values to avoid stale closures in onRequestSnapshot callback"

patterns-established:
  - "Non-throwing context access: useContext returns null default, devtools checks for null"
  - "Debounced snapshot: 250ms setTimeout cleared on each state change"

duration: 5min
completed: 2026-02-12
---

# Phase 2 Plan 1: Enriched Snapshot Pipeline Summary

**SDK extracts state from React contexts, serializes safely, and sends debounced enriched snapshots; dashboard stores per-session snapshots with selection and on-demand refresh**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-12T13:19:12Z
- **Completed:** 2026-02-12T13:25:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Protocol types and serializer (created in Phase 1 prep) verified and dashboard-side typing fixed
- TamboDevTools now extracts StreamState and RegistryContext, sends debounced 250ms snapshots
- Dashboard hook stores snapshots per sessionId, auto-selects first client, supports on-demand refresh
- request_snapshot server messages trigger immediate (non-debounced) snapshot send

## Task Commits

Each task was committed atomically:

1. **Task 1: Enrich protocol types and create snapshot serializer** - `3569c1147` (feat)
2. **Task 2: Wire SDK bridge to emit snapshots and extend dashboard hook** - `8d8e62eab` (feat)

## Files Created/Modified

- `react-sdk/src/devtools/use-stream-state-for-devtools.ts` - Non-throwing hook for optional stream state access
- `react-sdk/src/devtools/tambo-dev-tools.tsx` - Context extraction, debounced snapshot emission, onRequestSnapshot
- `react-sdk/src/devtools/devtools-bridge.ts` - onRequestSnapshot callback wiring
- `react-sdk/src/v1/providers/tambo-v1-stream-context.tsx` - Export StreamStateContext (@internal)
- `apps/web/devtools-server/types.ts` - Typed StateUpdateMessage.snapshot as StateSnapshot
- `apps/web/devtools-server/connection-manager.ts` - Forward sessionId and errors in snapshot relay
- `apps/web/app/(authed)/devtools/hooks/use-devtools-connection.ts` - Snapshot storage, selection, requestSnapshot

## Decisions Made

- Exported StreamStateContext with @internal tag rather than using dynamic require -- cleaner for ESM/CJS dual build
- Created separate useStreamStateForDevtools hook file to keep devtools concerns isolated
- Used refs for latest state values so onRequestSnapshot callback always reads current data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate JSDoc comment from linter**

- **Found during:** Task 2 (after commit)
- **Issue:** Linter introduced duplicate JSDoc on StreamStateContext export
- **Fix:** Removed duplicate, kept single JSDoc with @internal tag
- **Files modified:** react-sdk/src/v1/providers/tambo-v1-stream-context.tsx
- **Verification:** Lint passes
- **Committed in:** 8d8e62eab (amend)

**2. [Rule 3 - Blocking] Fixed StateSnapshot typing in connection manager**

- **Found during:** Task 1 (type checking)
- **Issue:** StateUpdateMessage.snapshot was typed as `object`, connection manager built snapshot missing sessionId
- **Fix:** Typed as StateSnapshot, added sessionId and errors forwarding
- **Files modified:** apps/web/devtools-server/types.ts, apps/web/devtools-server/connection-manager.ts
- **Committed in:** 3569c1147

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for type safety and correctness. No scope creep.

## Issues Encountered

- Protocol types and serializer were already implemented during Phase 1 -- Task 1 was mostly verification with minor type fixes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Enriched snapshots flow from SDK to dashboard -- ready for UI consumption in Plan 02 (Thread Inspector) and Plan 03 (Registry Viewer)
- Dashboard hook exposes snapshots, selectedSessionId, and requestSnapshot for panel components

---

_Phase: 02-inspection-panels_
_Completed: 2026-02-12_
