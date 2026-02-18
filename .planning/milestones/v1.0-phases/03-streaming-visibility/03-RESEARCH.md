# Phase 3: Streaming Visibility - Research

**Researched:** 2026-02-12
**Domain:** Real-time event capture, timeline UI, streaming visualization
**Confidence:** HIGH

## Summary

Phase 3 adds real-time streaming visibility to the devtools dashboard. The core challenge is architectural: the current SDK bridge sends **debounced state snapshots** (250ms intervals), but this phase requires **individual AG-UI events** to be forwarded to the dashboard in real-time for timeline display, JSON Patch visualization, and tool call lifecycle tracking.

The existing `TamboDevTools` component observes state via React context (`useStreamStateForDevtools`) and sends periodic snapshots. For Phase 3, we need a parallel channel that captures raw AG-UI events as they flow through the `handleEventStream` generator in `use-tambo-v1-send-message.ts` (line 588) and forwards them individually to the devtools bridge. This is the single most important architectural decision: events must be captured at the dispatch site (where `dispatch({ type: "EVENT", event, threadId })` happens), serialized, and sent as individual messages rather than batched into snapshots.

The dashboard side needs a new "Timeline" tab with a virtualized list that can handle hundreds of per-token TEXT_MESSAGE_CONTENT events without jank. The existing dashboard structure (tabs for Inspector/Registry) extends naturally to add Timeline, Component Streaming, and Tool Calls views.

**Primary recommendation:** Add a new `stream_event` message type to the devtools wire protocol. Tap into the event stream at the dispatch site in `use-tambo-v1-send-message.ts` via a callback on the DevToolsBridge. On the dashboard, use a ring buffer (capped array) with virtualized rendering for the timeline.

## Standard Stack

### Core (already in project)

| Library          | Version | Purpose                                | Why Standard                          |
| ---------------- | ------- | -------------------------------------- | ------------------------------------- |
| React 18         | 18.x    | Dashboard UI                           | Already in apps/web                   |
| shadcn/ui        | latest  | Tabs, badges, scroll-area, collapsible | Already in apps/web                   |
| Tailwind CSS     | 3+      | Styling                                | Already configured                    |
| Native WebSocket | browser | Dashboard WS client                    | Already in use-devtools-connection.ts |

### Supporting (need to build, not install)

| Library                | Purpose                                      | When to Use                                               |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Ring buffer utility    | Capped event storage (e.g., 5000 events max) | STRM-06: prevent memory growth from high-frequency events |
| Virtual list component | Render only visible timeline rows            | STRM-06: handle hundreds of events without DOM bloat      |

### Alternatives Considered

| Instead of          | Could Use                         | Tradeoff                                                                                                                                                                            |
| ------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custom virtual list | @tanstack/virtual or react-window | Extra dependency vs ~80 lines. Per AGENTS.md, avoid adding deps. A simple "render visible slice" with IntersectionObserver or scroll-position math suffices for a fixed-height list |
| Ring buffer         | Plain array with splice           | Ring buffer avoids GC pressure from repeated splice on large arrays                                                                                                                 |

## Architecture Patterns

### Wire Protocol Extension

Add a new SDK -> Server message type for individual events:

```typescript
// New message type in devtools-protocol.ts
export interface DevToolsStreamEvent {
  type: "stream_event";
  sessionId: string;
  timestamp: number;
  threadId: string;
  event: SerializedAGUIEvent;
  /** Monotonic sequence number for ordering */
  seq: number;
}

// Serialized AG-UI event (JSON-safe subset of AGUIEvent)
export interface SerializedAGUIEvent {
  type: string; // EventType enum value
  timestamp?: number;
  // Event-specific fields flattened
  [key: string]: unknown;
}
```

The server forwards these to dashboard clients as:

```typescript
export interface DevToolsStreamEventUpdate {
  type: "stream_event_update";
  sessionId: string;
  event: DevToolsStreamEvent;
}
```

### Event Capture Hook Point

The capture point is in `use-tambo-v1-send-message.ts` around line 621 where `dispatch()` is called. The `TamboDevTools` component needs access to raw events, not just accumulated state. Two approaches:

**Approach A (Recommended): Event callback on bridge**

- Add an `emitEvent(event, threadId)` method to `DevToolsBridge`
- In `TamboDevTools`, expose a ref-based callback via a new context or by wrapping the stream dispatch
- The `handleEventStream` generator or a middleware wrapper taps events before dispatch

**Approach B: Intercept at StreamDispatchContext**

- Wrap the dispatch function to also forward events to the bridge
- Simpler but couples devtools deeper into the provider hierarchy

Recommendation: **Approach A** -- add an `onEvent` callback to DevToolsBridge options. The `TamboDevTools` component provides this callback. The event capture happens by wrapping `handleEventStream` to yield events to both the reducer dispatch and the devtools bridge.

However, the cleanest approach is actually simpler: **add a devtools event emitter to the stream context provider** that TamboDevTools can subscribe to. When `TamboDevTools` is mounted, it registers a listener. The stream provider's event loop calls the listener for each raw event. This avoids modifying `handleEventStream` or the dispatch chain.

### Dashboard Event Storage Model

```typescript
interface TimelineEvent {
  seq: number;
  timestamp: number;
  threadId: string;
  eventType: string; // AG-UI EventType or Tambo custom event name
  category: EventCategory; // "run" | "text" | "tool" | "component" | "thinking" | "other"
  summary: string; // Human-readable one-liner
  payload: Record<string, unknown>; // Full event data for detail view
}

type EventCategory =
  | "run"
  | "text"
  | "tool"
  | "component"
  | "thinking"
  | "other";

// Color mapping for STRM-02
const EVENT_COLORS: Record<EventCategory, string> = {
  run: "blue",
  text: "green",
  tool: "orange",
  component: "purple",
  thinking: "gray",
  other: "slate",
};
```

### Component Streaming Visualizer

For COMP-04/05/06, the dashboard needs to show:

1. Which components are currently streaming
2. JSON Patch operations as they arrive (from `tambo.component.props_delta` events)
3. Cumulative props after each patch

This is derived from timeline events filtered to `category === "component"`. The visualizer groups events by `componentId` and replays patches to show cumulative state.

### Tool Call Lifecycle View

For STRM-04/05, group tool-related events by `toolCallId`:

- `TOOL_CALL_START` -> shows tool name, starts lifecycle
- `TOOL_CALL_ARGS` (multiple) -> accumulates args display
- `TOOL_CALL_END` -> args finalized
- `TOOL_CALL_RESULT` -> result shown
- `tambo.run.awaiting_input` -> client-side execution status

### Recommended Project Structure

```
apps/web/app/(authed)/devtools/
  components/
    timeline-panel.tsx          # Main timeline view (STRM-01, STRM-02)
    timeline-event-row.tsx      # Single event row with color badge
    timeline-event-detail.tsx   # Expanded payload view (STRM-03)
    component-stream-panel.tsx  # JSON Patch visualizer (COMP-04, COMP-05, COMP-06)
    tool-call-panel.tsx         # Tool lifecycle view (STRM-04, STRM-05)
  hooks/
    use-devtools-events.ts      # Event ring buffer + filtering
  lib/
    event-categorizer.ts        # Classify events, generate summaries
    ring-buffer.ts              # Capped array implementation

react-sdk/src/devtools/
  devtools-protocol.ts          # Extended with stream_event types
  devtools-bridge.ts            # Extended with emitEvent()
  tambo-dev-tools.tsx           # Extended with event capture

apps/web/devtools-server/
  types.ts                      # Extended with stream_event forwarding types
  connection-manager.ts         # Extended to forward stream_events
```

### Anti-Patterns to Avoid

- **Sending full snapshots for every event:** The 250ms debounced snapshot approach works for state inspection but would be too slow/heavy for event timeline. Use individual event messages.
- **Unbounded event arrays:** Without a ring buffer cap, a long streaming session could consume unbounded memory on the dashboard. Cap at ~5000 events.
- **Re-rendering entire timeline on each event:** Must use virtualization or windowing. Only visible rows should be in the DOM.
- **Synchronous JSON.stringify on large payloads in hot path:** TEXT_MESSAGE_CONTENT events fire per-token. The serialization in the SDK must be lightweight. These events are small (just a `delta` string) so this should be fine, but avoid adding heavyweight processing.

## Don't Hand-Roll

| Problem              | Don't Build        | Use Instead                                                              | Why                                                                            |
| -------------------- | ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| JSON diff display    | Custom differ      | Show raw JSON Patch operations from `tambo.component.props_delta` events | The operations are already RFC 6902 patches -- just display them               |
| Event deduplication  | Custom dedup logic | Monotonic sequence numbers                                               | Events arrive in order over a single WS connection; seq handles reconnect gaps |
| Timestamp formatting | Custom formatter   | `Intl.DateTimeFormat` or simple `Date.toLocaleTimeString()`              | Built-in, handles locales                                                      |

## Common Pitfalls

### Pitfall 1: Event Flood Causing UI Jank (STRM-06)

**What goes wrong:** TEXT_MESSAGE_CONTENT events fire per-token (could be 50-100/sec). Naive rendering of each event causes dropped frames.
**Why it happens:** React re-renders the entire timeline list on each state update.
**How to avoid:**

1. Batch incoming events with `requestAnimationFrame` or a 16ms throttle before updating React state
2. Use a ring buffer that mutates in place (or appends) without creating new array references for each event
3. Virtualize the timeline list -- only render visible rows
4. Use `React.memo` on timeline rows with stable keys
   **Warning signs:** FPS drops below 30 during active streaming in Chrome DevTools Performance panel.

### Pitfall 2: Memory Leaks from Unbounded Event Storage

**What goes wrong:** Dashboard accumulates events indefinitely across multiple streaming sessions.
**Why it happens:** No eviction policy on the event array.
**How to avoid:** Ring buffer with configurable max size (default 5000). When full, oldest events are dropped. Show "N events truncated" indicator.

### Pitfall 3: Stale Closure in Event Callback

**What goes wrong:** The bridge's event callback captures stale React state.
**Why it happens:** Same pattern as Phase 2's snapshot callback -- closures in useEffect don't see latest state.
**How to avoid:** Use refs for the callback, same pattern as `streamStateRef`/`registryRef` in `tambo-dev-tools.tsx`.

### Pitfall 4: Dashboard Disconnects Missing Events

**What goes wrong:** If dashboard reconnects, it missed events during disconnection.
**Why it happens:** Events are fire-and-forget, not buffered server-side.
**How to avoid:** On reconnect, request a fresh snapshot (already works) to get current state. Timeline will have a gap, which is acceptable. Show a "reconnected -- some events may be missing" indicator.

### Pitfall 5: JSON Patch Replay Inconsistency

**What goes wrong:** Component streaming visualizer shows wrong cumulative props because it missed a patch.
**Why it happens:** Dashboard connected mid-stream, or events were dropped.
**How to avoid:** The cumulative view should use the snapshot data (which has current props) as the source of truth. The patch log is for visualization only -- don't derive current state from replaying patches on the dashboard side.

## Code Examples

### Event Capture in SDK (extending TamboDevTools)

```typescript
// In devtools-bridge.ts -- new method
emitEvent(event: AGUIEvent, threadId: string): void {
  if (!this.connected || !this.ws) return;

  const serialized: DevToolsStreamEvent = {
    type: "stream_event",
    sessionId: this.options.sessionId,
    timestamp: Date.now(),
    threadId,
    event: serializeEvent(event),
    seq: this.nextSeq++,
  };

  this.ws.send(JSON.stringify(serialized));
}

function serializeEvent(event: AGUIEvent): SerializedAGUIEvent {
  // Events are already mostly JSON-safe plain objects
  // Just need to strip any non-serializable fields
  return JSON.parse(JSON.stringify(event)) as SerializedAGUIEvent;
}
```

### Ring Buffer for Dashboard Events

```typescript
// ring-buffer.ts
export class RingBuffer<T> {
  private buffer: T[];
  private head = 0;
  private count = 0;

  constructor(private readonly capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  toArray(): T[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ];
  }

  get length(): number {
    return this.count;
  }

  get droppedCount(): number {
    return Math.max(
      0,
      this.head +
        (this.count === this.capacity ? this.capacity : 0) -
        this.count,
    );
  }
}
```

### RAF-Batched Event Updates

```typescript
// In use-devtools-events.ts
function useDevtoolsEvents(maxEvents = 5000) {
  const bufferRef = useRef(new RingBuffer<TimelineEvent>(maxEvents));
  const pendingRef = useRef<TimelineEvent[]>([]);
  const rafRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);

  const addEvent = useCallback((event: TimelineEvent) => {
    bufferRef.current.push(event);
    pendingRef.current.push(event);

    // Batch renders to animation frames
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        pendingRef.current = [];
        forceRender((n) => n + 1);
      });
    }
  }, []);

  const events = bufferRef.current.toArray();

  return { events, addEvent, droppedCount: bufferRef.current.droppedCount };
}
```

### Event Color Mapping

```typescript
// event-categorizer.ts
export function categorizeEvent(eventType: string): EventCategory {
  if (eventType.startsWith("RUN_")) return "run";
  if (eventType.startsWith("TEXT_MESSAGE_")) return "text";
  if (eventType.startsWith("TOOL_CALL_")) return "tool";
  if (eventType.startsWith("THINKING_")) return "thinking";
  if (eventType === "CUSTOM") return "component"; // Tambo custom events are component-related
  return "other";
}

// For Tambo custom events, refine further:
export function categorizeTamboEvent(eventName: string): EventCategory {
  if (eventName.startsWith("tambo.component.")) return "component";
  if (eventName.startsWith("tambo.run.")) return "tool"; // awaiting_input is tool-related
  return "other";
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  run: "bg-blue-500",
  text: "bg-green-500",
  tool: "bg-orange-500",
  component: "bg-purple-500",
  thinking: "bg-gray-400",
  other: "bg-slate-400",
};
```

## State of the Art

| Old Approach             | Current Approach                | When Changed | Impact                     |
| ------------------------ | ------------------------------- | ------------ | -------------------------- |
| Debounced snapshots only | Snapshots + individual events   | Phase 3      | Enables real-time timeline |
| No event visibility      | Full AG-UI event stream exposed | Phase 3      | Core feature of this phase |

## Open Questions

1. **Event capture mechanism: wrap dispatch or add listener?**
   - What we know: Events flow through `handleEventStream` -> `dispatch()` in `use-tambo-v1-send-message.ts`
   - What's unclear: Whether to intercept at the generator level, wrap dispatch, or add a parallel listener
   - Recommendation: Add an optional `onRawEvent` callback to the stream context provider that TamboDevTools subscribes to. This is the least invasive approach -- the stream provider calls `onRawEvent?.(event, threadId)` right before `dispatch()`.

2. **Should the server buffer events for late-connecting dashboards?**
   - What we know: Current server is stateless relay (forwards immediately)
   - What's unclear: Whether missing events during reconnect is acceptable UX
   - Recommendation: Don't buffer. Snapshots provide current state on reconnect. Timeline gaps are acceptable for devtools. Buffering adds complexity and memory pressure on the server.

3. **Virtual list complexity vs scroll-to-bottom behavior**
   - What we know: Timeline should auto-scroll to newest events during active streaming
   - What's unclear: How to handle "user scrolled up to inspect" vs "auto-scroll to bottom"
   - Recommendation: Auto-scroll when user is at bottom (within ~50px threshold). Stop auto-scrolling when user scrolls up. Show "Jump to latest" button when not at bottom.

## Sources

### Primary (HIGH confidence)

- Codebase: `react-sdk/src/devtools/devtools-protocol.ts` - Current wire protocol
- Codebase: `react-sdk/src/devtools/devtools-bridge.ts` - Current bridge implementation
- Codebase: `react-sdk/src/devtools/tambo-dev-tools.tsx` - Current snapshot emission
- Codebase: `react-sdk/src/v1/utils/event-accumulator.ts` - Full event handling logic
- Codebase: `react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts` - Event dispatch site
- Codebase: `react-sdk/src/v1/types/event.ts` - Tambo custom event types
- Codebase: `@ag-ui/core` EventType enum - All 22 AG-UI event types
- Codebase: `apps/web/devtools-server/types.ts` - Server-side protocol types
- Codebase: `apps/web/app/(authed)/devtools/page.tsx` - Current dashboard structure

### Secondary (MEDIUM confidence)

- Phase 2 research and plans - Established patterns for protocol extension and dashboard panels

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new dependencies needed, extending existing patterns
- Architecture: HIGH - event capture and forwarding is straightforward WS message extension
- Pitfalls: HIGH - performance concerns for high-frequency events are well-understood; solutions (RAF batching, virtualization, ring buffers) are standard
- UI patterns: MEDIUM - virtual list auto-scroll behavior needs experimentation

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (stable domain, no external dependency changes expected)
