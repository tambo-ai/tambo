# Phase 2: Inspection Panels - Research

**Researched:** 2026-02-12
**Domain:** React dashboard UI + WebSocket state protocol enrichment
**Confidence:** HIGH

## Summary

Phase 2 builds inspection panels in the existing devtools dashboard (`apps/web/app/(authed)/devtools/`) and enriches the SDK bridge to actually emit state snapshots (currently only handshake is sent). The work splits into three concerns: (1) enriching the wire protocol and SDK bridge to send full thread/message/registry/MCP data, (2) building dashboard UI panels to display this data, and (3) adding filtering, search, and error surfacing.

The existing Phase 1 infrastructure is solid: the WS server correctly forwards `state_snapshot` messages as `state_update` to dashboard clients, and the dashboard hook already has a placeholder `case "state_update"` handler. The main gap is that the SDK bridge never calls `send()` with a `state_snapshot` -- and the snapshot type itself is too shallow (no messages, no schemas, no MCP servers, no streaming state, no errors).

**Primary recommendation:** Enrich the `DevToolsStateSnapshot` protocol type to include full message content, component/tool schemas, MCP server info, streaming state, and errors. Then wire the SDK bridge to extract this data from React context and emit snapshots on state changes. Dashboard panels consume this via the existing `useDevtoolsConnection` hook (extended to store snapshots per session).

## Standard Stack

### Core (already in project)

| Library          | Version | Purpose                                                                       | Why Standard                               |
| ---------------- | ------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| React            | 18      | Dashboard UI                                                                  | Already used in apps/web                   |
| shadcn/ui        | latest  | UI primitives (tabs, collapsible, badge, input, card, scroll-area, accordion) | Already in apps/web/components/ui          |
| Tailwind CSS     | 3+      | Styling                                                                       | Already configured                         |
| Native WebSocket | browser | Dashboard WS client                                                           | Already used in use-devtools-connection.ts |

### Supporting (need to build, not install)

| Library                    | Purpose                        | When to Use                                |
| -------------------------- | ------------------------------ | ------------------------------------------ |
| Custom JSON tree component | Collapsible nested data viewer | STATE-05: expanding nested data structures |

### Alternatives Considered

| Instead of              | Could Use                               | Tradeoff                                                                                                                               |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Custom JSON tree        | react-json-view-lite or react-json-tree | Extra dependency vs ~100 lines of custom code. Given AGENTS.md rule against adding deps without explicit request, build custom.        |
| superjson serialization | JSON.stringify                          | Phase 1 deferred superjson. Keep JSON.stringify for now; functions/dates/undefined won't serialize but that's acceptable for devtools. |

## Architecture Patterns

### Protocol Enrichment (SDK side)

The current `DevToolsStateSnapshot` is too shallow. It needs to carry:

```typescript
// Enriched snapshot -- what the SDK bridge should send
interface DevToolsStateSnapshot {
  type: "state_snapshot";
  sessionId: string;
  timestamp: number;
  threads: {
    id: string;
    name?: string;
    status: "idle" | "streaming" | "waiting";
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    // NEW: full messages for selected/all threads
    messages: {
      id: string;
      role: "user" | "assistant" | "system";
      content: Content[]; // text, tool_use, tool_result, component, resource
      createdAt?: string;
      metadata?: Record<string, unknown>;
      reasoning?: string[];
    }[];
    // NEW: streaming state
    streamingState?: {
      status: "idle" | "waiting" | "streaming";
      runId?: string;
      messageId?: string;
      error?: { message: string; code?: string };
    };
  }[];
  registry: {
    components: {
      name: string;
      description: string;
      // NEW: prop schema as JSON Schema
      propsSchema?: Record<string, unknown>;
    }[];
    tools: {
      name: string;
      description: string;
      // NEW: input/output schema as JSON Schema
      inputSchema?: Record<string, unknown>;
      outputSchema?: Record<string, unknown>;
    }[];
    // NEW: MCP servers
    mcpServers?: {
      name: string;
      url: string;
      status: string;
    }[];
  };
  // NEW: top-level errors for prominent surfacing
  errors?: {
    type: "streaming" | "tool_call" | "connection";
    message: string;
    threadId?: string;
    timestamp: number;
  }[];
}
```

### SDK Bridge State Extraction

The `TamboDevTools` component currently creates a bridge in useEffect and only sends handshake. It needs to:

1. Access `TamboRegistryContext` for components, tools, MCP servers
2. Access thread/streaming state from the stream context
3. Serialize and send snapshots on state changes (debounced)
4. Respond to `request_snapshot` server messages

Key challenge: `TamboDevTools` renders `null` and sits inside `TamboProvider`. It can access all contexts via hooks. The bridge needs to be refactored so the component can call `bridge.send(snapshot)` when state changes.

Pattern: Use `useEffect` with dependencies on thread list, current thread messages, registry state, and streaming state. Debounce with a ~200ms window to batch rapid state changes.

### Dashboard Data Flow

```
SDK Context -> DevToolsBridge -> WS Server -> Dashboard WS -> useDevtoolsConnection
                                                                    |
                                                              Per-session snapshot store
                                                                    |
                                              +-----------+---------+---------+
                                              |           |                   |
                                         ThreadPanel  RegistryPanel    ErrorPanel
```

### Recommended Dashboard Component Structure

```
apps/web/app/(authed)/devtools/
├── page.tsx                          # Main layout with session selector + panels
├── hooks/
│   ├── use-devtools-connection.ts    # EXTEND: store snapshots per sessionId
│   └── use-devtools-filters.ts      # NEW: filter/search state
├── components/
│   ├── connection-status.tsx         # Existing
│   ├── client-card.tsx              # Existing (may become session selector)
│   ├── thread-list-panel.tsx        # NEW: thread list with status badges
│   ├── message-detail-view.tsx      # NEW: message list for selected thread
│   ├── content-block-viewer.tsx     # NEW: renders text/tool_use/tool_result/component blocks
│   ├── json-tree-viewer.tsx         # NEW: collapsible JSON tree (STATE-05)
│   ├── registry-panel.tsx           # NEW: components + tools + MCP servers
│   ├── schema-viewer.tsx            # NEW: renders JSON Schema as readable tree
│   ├── error-banner.tsx             # NEW: prominent error display (STATE-06)
│   ├── filter-bar.tsx               # NEW: status/role/type filters + search
│   └── streaming-state-badge.tsx    # NEW: shows streaming status for a thread
```

### State Management in Dashboard

Use React `useState` for:

- Selected session ID
- Selected thread ID
- Filter state (thread status filter, message role filter, content type filter)
- Search query

The snapshot data itself lives in the `useDevtoolsConnection` hook, stored as `Map<sessionId, DevToolsStateSnapshot>`.

### Anti-Patterns to Avoid

- **Don't store snapshots in React Query**: This is WebSocket push data, not REST. Keep it in local state.
- **Don't try to diff snapshots**: Full snapshots are simpler than incremental updates. Optimize later if needed.
- **Don't serialize React elements**: The `renderedComponent` field on `TamboComponentContent` is a ReactElement -- strip it before sending over the wire.
- **Don't send snapshots too frequently**: Debounce. Streaming can cause many state changes per second.

## Don't Hand-Roll

| Problem              | Don't Build        | Use Instead                                     | Why                                                  |
| -------------------- | ------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| Tabs UI              | Custom tab system  | shadcn `<Tabs>`                                 | Already available in apps/web/components/ui/tabs.tsx |
| Collapsible sections | Custom accordion   | shadcn `<Collapsible>` or `<Accordion>`         | Already available                                    |
| Status badges        | Custom pill styles | shadcn `<Badge>` with variants                  | Already available                                    |
| Search input         | Custom input       | shadcn `<Input>` or existing `search-input.tsx` | Already available                                    |
| Scroll containers    | Custom overflow    | shadcn `<ScrollArea>`                           | Already available                                    |
| Filter dropdowns     | Custom select      | shadcn `<Select>`                               | Already available                                    |

**Key insight:** The dashboard is in `apps/web` which already has a full shadcn component library. Use it.

## Common Pitfalls

### Pitfall 1: Circular references in state serialization

**What goes wrong:** React elements, functions, and circular refs in thread state cause `JSON.stringify` to throw.
**Why it happens:** `TamboComponentContent.renderedComponent` is a ReactElement. Tool functions are functions.
**How to avoid:** Create a `serializeForDevtools()` function that strips non-serializable fields before sending. Use a replacer function in JSON.stringify that replaces functions with `"[Function]"` and ReactElements with `"[ReactElement]"`.
**Warning signs:** Bridge silently dropping messages due to try/catch around JSON.stringify.

### Pitfall 2: Snapshot flood during streaming

**What goes wrong:** Every streamed token triggers a state change, causing dozens of snapshots per second.
**Why it happens:** The SDK updates thread messages on every streaming event.
**How to avoid:** Debounce snapshot sending to ~200-500ms. Use `requestAnimationFrame` or `setTimeout` batching.
**Warning signs:** Dashboard becomes sluggish, WS bandwidth spikes.

### Pitfall 3: Stale snapshot after disconnect

**What goes wrong:** Dashboard shows old data after an SDK client disconnects and reconnects.
**Why it happens:** Session ID changes on reconnect (it's `crypto.randomUUID()` per mount).
**How to avoid:** Clear snapshot data on `client_disconnected`. New session = fresh state.

### Pitfall 4: Schema serialization

**What goes wrong:** Zod schemas and Standard Schema validators are not plain JSON.
**Why it happens:** Component `propsSchema` and tool `inputSchema` are runtime validator objects.
**How to avoid:** Convert schemas to JSON Schema format before sending. The SDK already has `zod-to-json-schema` as a dependency. Use the existing schema conversion utilities in `react-sdk/src/schema/schema.ts`.

### Pitfall 5: Dashboard import boundary

**What goes wrong:** Importing SDK types into `apps/web` creates a dependency on react-sdk.
**Why it happens:** Phase 1 decision: "Protocol types defined independently on each side."
**How to avoid:** Continue duplicating protocol types on the server/dashboard side. Keep the enriched snapshot type in both `react-sdk/src/devtools/devtools-protocol.ts` and `apps/web/devtools-server/types.ts`.

## Code Examples

### JSON Tree Viewer Component

```typescript
// Collapsible JSON tree -- no external deps needed
// Use shadcn Collapsible + recursive rendering
interface JsonTreeProps {
  data: unknown;
  label?: string;
  defaultExpanded?: boolean;
}

function JsonTree({ data, label, defaultExpanded = false }: JsonTreeProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  if (data === null || data === undefined || typeof data !== "object") {
    return (
      <span className="font-mono text-sm">
        {label && <span className="text-muted-foreground">{label}: </span>}
        <span className={typeof data === "string" ? "text-green-600" : "text-blue-600"}>
          {JSON.stringify(data)}
        </span>
      </span>
    );
  }

  const entries = Array.isArray(data)
    ? data.map((v, i) => [i, v] as const)
    : Object.entries(data);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>{label ?? (Array.isArray(data) ? "Array" : "Object")} ({entries.length})</CollapsibleTrigger>
      <CollapsibleContent>
        {entries.map(([key, value]) => (
          <JsonTree key={String(key)} data={value} label={String(key)} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Debounced Snapshot Sending in SDK Bridge

```typescript
// In TamboDevTools component
const snapshotTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

useEffect(() => {
  clearTimeout(snapshotTimeoutRef.current);
  snapshotTimeoutRef.current = setTimeout(() => {
    const snapshot = serializeForDevtools({
      threads, // from useTamboThreadList or stream context
      registry: { components: componentList, tools: toolRegistry, mcpServers },
      streamingState,
      errors: collectedErrors,
    });
    bridge.send({
      type: "state_snapshot",
      sessionId,
      timestamp: Date.now(),
      ...snapshot,
    });
  }, 250);
}, [threads, componentList, toolRegistry, mcpServers, streamingState]);
```

### Content Block Renderer

```typescript
function ContentBlockViewer({ block }: { block: Content }) {
  switch (block.type) {
    case "text":
      return <pre className="whitespace-pre-wrap text-sm">{block.text}</pre>;
    case "tool_use":
      return (
        <div className="rounded border p-2">
          <Badge>Tool Call</Badge>
          <span className="font-mono text-sm">{block.name}</span>
          <JsonTree data={block.input} label="input" />
        </div>
      );
    case "tool_result":
      return (
        <div className="rounded border p-2">
          <Badge variant={block.is_error ? "destructive" : "default"}>
            {block.is_error ? "Tool Error" : "Tool Result"}
          </Badge>
          <JsonTree data={block.content} label="result" />
        </div>
      );
    case "component":
      return (
        <div className="rounded border p-2">
          <Badge variant="secondary">Component</Badge>
          <span className="font-mono text-sm">{block.name}</span>
          <JsonTree data={block.props} label="props" />
        </div>
      );
    default:
      return <JsonTree data={block} label="unknown block" />;
  }
}
```

## State of the Art

| Old Approach                         | Current Approach                          | When Changed | Impact                               |
| ------------------------------------ | ----------------------------------------- | ------------ | ------------------------------------ |
| Phase 1: handshake only              | Phase 2: full state snapshots             | Now          | Dashboard can actually inspect state |
| Shallow snapshot (name/status/count) | Deep snapshot (messages, schemas, errors) | Now          | All inspection requirements met      |

## Open Questions

1. **How to access all threads from TamboDevTools component?**
   - What we know: The v1 stream context holds thread state via `StreamState` which has `threads: Record<string, ThreadState>`. The `TamboDevTools` component sits inside `TamboProvider` and can use hooks.
   - What's unclear: Whether there's a single hook that gives all threads + messages, or if we need to access the stream context directly.
   - Recommendation: Look at `useTamboV1` and the stream context to find the right data source. May need a new internal hook `useDevtoolsState()` that aggregates everything needed.

2. **Error collection strategy**
   - What we know: Streaming errors live in `StreamingState.error`. Tool call failures appear as `tool_result` content blocks with `is_error: true`.
   - What's unclear: Whether there's a centralized error list or if errors must be extracted from thread state.
   - Recommendation: Extract errors from streaming state and tool results during snapshot serialization. Collect into a top-level `errors` array for the dashboard to surface prominently.

3. **Snapshot size concerns**
   - What we know: Threads with many messages could produce large snapshots.
   - What's unclear: Whether full message content for all threads is practical.
   - Recommendation: Start with full snapshots. If too large, switch to sending full data only for the "selected" thread (dashboard sends a `select_thread` command).

## Sources

### Primary (HIGH confidence)

- Codebase inspection of Phase 1 artifacts (devtools-protocol.ts, devtools-bridge.ts, connection-manager.ts, use-devtools-connection.ts)
- Codebase inspection of SDK types (thread.ts, message.ts, component-metadata.ts, tambo-registry-provider.tsx)
- Codebase inspection of apps/web shadcn components (ui/ directory)

### Secondary (MEDIUM confidence)

- Architecture inference from existing patterns in the codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - everything already exists in the project
- Architecture: HIGH - follows directly from Phase 1 patterns and existing SDK structure
- Pitfalls: HIGH - derived from actual code inspection (circular refs, streaming frequency, schema serialization)

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (stable -- this is internal tooling with known codebase)
