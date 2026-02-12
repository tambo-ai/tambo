---
phase: 03-streaming-visibility
plan: 01
subsystem: devtools
tags: [websocket, ag-ui, streaming, devtools, protocol]

requires:
  - phase: 01-websocket-bridge
    provides: WebSocket bridge, protocol types, connection manager
  - phase: 02-inspection-panels
    provides: StreamStateContext export, snapshot serialization, dashboard hook

provides:
  - DevToolsStreamEvent wire protocol type (SDK, server, dashboard)
  - DevToolsBridge.emitEvent() with monotonic seq counter
  - RawEventCallbackContext for read-only event tap in stream provider
  - Server stream_event forwarding to dashboard clients
  - Dashboard hook streamEvents state (Map<sessionId, StreamEventFromServer[]>)
  - clearStreamEvents function for timeline reset

affects: [03-02, 03-03]

tech-stack:
  added: []
  patterns:
    - "Ref-based raw event callback context for zero-overhead devtools tap"
    - "Monotonic sequence numbers on stream events for ordering"
    - "Capped array (5000) per session for stream event storage"

key-files:
  created: []
  modified:
    - react-sdk/src/devtools/devtools-protocol.ts
    - react-sdk/src/devtools/devtools-bridge.ts
    - react-sdk/src/devtools/tambo-dev-tools.tsx
    - react-sdk/src/v1/providers/tambo-v1-stream-context.tsx
    - react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts
    - apps/web/devtools-server/types.ts
    - apps/web/devtools-server/connection-manager.ts
    - apps/web/app/(authed)/devtools/hooks/use-devtools-connection.ts

key-decisions:
  - "RawEventCallbackContext with ref pattern to avoid re-renders and stale closures"
  - "JSON.parse(JSON.stringify(event)) for lightweight event serialization"
  - "Simple capped array (splice oldest) instead of ring buffer for Phase 1 simplicity"

patterns-established:
  - "Ref-based callback context: RawEventCallbackContext provides a mutable ref that devtools writes to, dispatch site reads from"
  - "Stream event pipeline: dispatch site -> rawEventCallbackRef -> bridge.emitEvent -> server broadcast -> dashboard state"

duration: 5min
completed: 2026-02-12
---

# Phase 3 Plan 1: Stream Event Pipeline Summary

**Real-time AG-UI event forwarding from SDK dispatch site through WebSocket server to dashboard hook with monotonic sequencing and 5000-event cap**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-12T13:54:58Z
- **Completed:** 2026-02-12T13:59:36Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Full event pipeline wired: SDK capture -> bridge send -> server forward -> dashboard receive
- Protocol extended with `stream_event` / `stream_event_update` message types on all three layers
- Dashboard hook stores events per session with 5000 cap and clearStreamEvents function
- Read-only event tap via RawEventCallbackContext has zero impact on existing dispatch flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend wire protocol and SDK bridge with stream_event support** - `398c6ee22` (feat)
2. **Task 2: Extend server and dashboard hook to forward and receive stream events** - `c2e2185c0` (feat)

## Files Created/Modified

- `react-sdk/src/devtools/devtools-protocol.ts` - SerializedAGUIEvent, DevToolsStreamEvent types added to union
- `react-sdk/src/devtools/devtools-bridge.ts` - emitEvent method with nextSeq counter
- `react-sdk/src/devtools/tambo-dev-tools.tsx` - Raw event subscription via RawEventCallbackContext
- `react-sdk/src/v1/providers/tambo-v1-stream-context.tsx` - RawEventCallbackContext and ref provider
- `react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts` - Raw event tap at dispatch site
- `apps/web/devtools-server/types.ts` - StreamEventMessage, StreamEventUpdateMessage types
- `apps/web/devtools-server/connection-manager.ts` - stream_event forwarding case
- `apps/web/app/(authed)/devtools/hooks/use-devtools-connection.ts` - streamEvents state, clearStreamEvents

## Decisions Made

- Used ref-based callback context (RawEventCallbackContext) rather than adding another context value to StreamStateContext, avoiding re-renders
- JSON.parse(JSON.stringify()) for event serialization since AG-UI events are small plain objects
- Simple capped array with splice for event storage (ring buffer deferred to Plan 02)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Stream event pipeline complete, ready for Plan 02 (ring buffer + RAF batching) and Plan 03 (timeline UI)
- All types exported for dashboard consumption

## Self-Check: PASSED

---

_Phase: 03-streaming-visibility_
_Completed: 2026-02-12_
