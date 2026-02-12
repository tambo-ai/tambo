# Stack Research: Browser-Based Developer Tools

**Research Date:** 2026-02-11
**Dimension:** WebSocket bridge + devtools UI for Tambo AI platform
**Question:** What's the standard 2025/2026 stack for building browser-based developer tools with a websocket bridge?

---

## Executive Summary

The Tambo DevTools need a WebSocket bridge between a developer's locally running React app (using `@tambo-ai/react`) and the Tambo Cloud dashboard (`apps/web` on port 8260). The recommended stack is: **`ws` (server) + `partysocket` (client) for the WebSocket layer**, **shadcn Resizable + react-inspector for the UI**, and **superjson for wire serialization**. The architecture should follow the React DevTools "backend/frontend" pattern where a lightweight agent in the SDK emits events over WebSocket to a dashboard-hosted inspector UI.

---

## Layer 1: WebSocket Transport

### Recommendation: `ws` 8.19.x (server) + `partysocket` 1.1.x (client)

**Confidence: HIGH**

| Option                            | Verdict            | Rationale                                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ws` 8.19.0 (server-side)         | **USE**            | Already the underlying WebSocket library for `@nestjs/platform-ws`. 25k+ dependents. Zero-dependency, blazing fast, battle-tested. The monorepo already uses NestJS 11 which has first-class `ws` support via `@nestjs/platform-ws` 11.1.11.                                                                           |
| `partysocket` 1.1.6 (client-side) | **USE**            | Fork of `reconnecting-websocket` with maintained bugfixes. Auto-reconnect, message buffering when disconnected, configurable backoff, zero dependencies. 252k weekly downloads. Works in browsers, Node, React Native, workers. Perfect for a devtools agent that must gracefully handle the dashboard not being open. |
| Socket.IO                         | **DO NOT USE**     | Adds 40-50KB to the client bundle for features we don't need (rooms, namespaces, HTTP long-polling fallback). DevTools communication is same-machine localhost -- we will never need transport fallbacks. The custom protocol makes debugging the debugger harder.                                                     |
| `reconnecting-websocket`          | **DO NOT USE**     | Unmaintained (last publish 2018). `partysocket` is its actively maintained successor with the same API.                                                                                                                                                                                                                |
| Native `WebSocket` API            | **DO NOT USE**     | No auto-reconnect, no message buffering, no backoff. We'd end up reimplementing what `partysocket` already provides.                                                                                                                                                                                                   |
| BroadcastChannel API              | **NOT APPLICABLE** | Same-origin only. The dashboard (port 8260) and the developer's app (arbitrary port) are different origins. Cannot use for cross-origin communication.                                                                                                                                                                 |

**Why WebSocket and not polling/SSE:**

- Need bidirectional communication: the dashboard needs to send commands back to the SDK (e.g., "refetch this thread," "replay this stream")
- Need to see client-side streaming data that never hits the Tambo API server
- Sub-millisecond localhost latency makes WebSocket the obvious choice for devtools

**Architecture pattern -- follows React DevTools:**

```
Developer's App (any port)          Dashboard (port 8260)
+---------------------------+       +---------------------------+
| @tambo-ai/react SDK       |       | apps/web                  |
|                           |       |                           |
| TamboDevToolsAgent        | WS    | DevTools Inspector UI     |
|  - hooks into providers   |------>|  - thread viewer          |
|  - captures events        |<------|  - streaming visualizer   |
|  - serializes + sends     |       |  - component registry     |
+---------------------------+       +---------------------------+
      partysocket client         ws server (NestJS gateway or
                                 standalone in dashboard)
```

The WebSocket server lives in the dashboard (or a tiny local relay). The SDK contains a lightweight agent that only activates in dev mode and connects outbound to the dashboard.

### NestJS Integration

**Confidence: HIGH**

| Package               | Version | Purpose                                         |
| --------------------- | ------- | ----------------------------------------------- |
| `@nestjs/websockets`  | 11.1.11 | NestJS WebSocket module with gateway decorators |
| `@nestjs/platform-ws` | 11.1.11 | ws-based adapter (NOT Socket.IO)                |

If the WebSocket server lives in `apps/api`, use NestJS WebSocket Gateways with the `ws` platform adapter. This gives us decorator-based message handling (`@SubscribeMessage`), guards, pipes, and interceptors -- all consistent with the existing API architecture.

However, a simpler option is to run the WebSocket server directly in the Next.js dashboard (`apps/web`) as a custom server route or API route, avoiding the API server entirely since devtools traffic is local-only and doesn't need persistence or auth.

**Decision needed:** Where does the WS server live? Options:

1. `apps/api` via NestJS gateway -- heavier, but uses existing infra
2. `apps/web` via Next.js custom server -- lighter, keeps devtools self-contained
3. Standalone tiny server in a new package -- most isolated, but more to maintain

---

## Layer 2: Wire Protocol & Serialization

### Recommendation: `superjson` 2.2.x (already in monorepo)

**Confidence: HIGH**

| Option               | Verdict        | Rationale                                                                                                                                                                                                                                                  |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `superjson` 2.2.6    | **USE**        | Already a dependency in the monorepo. Handles Date, Map, Set, BigInt, undefined, RegExp, Error serialization transparently. Perfect for sending rich SDK state (which includes Dates, complex nested objects) over WebSocket without manual serialization. |
| Raw `JSON.stringify` | **DO NOT USE** | Loses Date objects, Maps, Sets, undefined values. SDK state contains these types. Would require manual serialization/deserialization code.                                                                                                                 |
| `msgpack` / `cbor`   | **DO NOT USE** | Binary formats add complexity for minimal gain on localhost. Text-based protocol is easier to debug (you can read the messages in browser Network tab).                                                                                                    |

### Message Schema

Use Zod 4.x (already in monorepo at 4.x / 3.25.x) to define the message protocol:

```typescript
// Event types from SDK -> Dashboard
type DevToolsEvent =
  | { type: "thread:created"; payload: ThreadSnapshot }
  | { type: "thread:updated"; payload: ThreadDelta }
  | { type: "message:created"; payload: MessageSnapshot }
  | { type: "stream:chunk"; payload: StreamChunk }
  | { type: "tool:called"; payload: ToolCallSnapshot }
  | { type: "component:registered"; payload: ComponentRegistration }
  | { type: "component:resolved"; payload: ComponentResolution };

// Commands from Dashboard -> SDK
type DevToolsCommand =
  | { type: "thread:refetch"; threadId: string }
  | { type: "stream:replay"; streamId: string }
  | { type: "state:snapshot" }; // Request full state dump
```

Validate with Zod discriminated unions. Serialize with superjson. This is type-safe end-to-end with zero new dependencies.

### State Diffing

**Confidence: MEDIUM**

| Option                    | Verdict               | Rationale                                                                                                                                                                  |
| ------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fast-json-patch` 3.1.1   | **USE**               | Already in the monorepo. RFC 6902 JSON Patch for sending state deltas instead of full snapshots after initial sync. Reduces bandwidth for frequent thread/message updates. |
| `json-diff-ts` 4.8.1      | **DO NOT USE**        | Would be a new dependency. `fast-json-patch` already covers the use case and is already installed.                                                                         |
| Full state on every event | **ACCEPTABLE FOR V1** | Simpler to implement. Localhost bandwidth is essentially free. Can optimize with patches later.                                                                            |

---

## Layer 3: DevTools UI Components

### Panel Layout

**Recommendation: shadcn Resizable (already available)**

**Confidence: HIGH**

The monorepo already uses shadcn/ui extensively. The shadcn `Resizable` component wraps `react-resizable-panels` 4.6.x, providing accessible resizable panel groups with drag handles, keyboard support, and localStorage persistence.

| Option            | Verdict        | Rationale                                                                                                                                                                                                                                     |
| ----------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn Resizable  | **USE**        | Already in the design system. Wraps react-resizable-panels. Supports horizontal/vertical splits, pixel/percentage constraints, auto-save layout. Perfect for the classic devtools layout (list on left, detail on right, timeline on bottom). |
| Custom CSS resize | **DO NOT USE** | Poor accessibility, no keyboard support, no layout persistence.                                                                                                                                                                               |

### State Inspector / Object Viewer

**Recommendation: `react-inspector` 9.0.0**

**Confidence: HIGH**

| Option                  | Verdict        | Rationale                                                                                                                                                                                                                                                             |
| ----------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-inspector` 9.0.0 | **USE**        | Maintained by Storybook team. Provides `<ObjectInspector>`, `<TableInspector>`, and `<DOMInspector>` components that replicate the Chrome DevTools object inspection UX. Expandable tree view, path tracking, theme support. 1 new dependency but extremely targeted. |
| Custom tree component   | **DO NOT USE** | Significant effort to replicate the Chrome DevTools UX. Accessibility, keyboard navigation, deep nesting, circular reference handling -- all already solved by react-inspector.                                                                                       |
| `react-json-view`       | **DO NOT USE** | Less maintained, heavier, and the UX is less familiar than the Chrome DevTools style that react-inspector provides.                                                                                                                                                   |

### Streaming Chunk Visualizer

**No external library needed. Build with existing stack.**

**Confidence: HIGH**

Use Tailwind + shadcn primitives (Card, Badge, ScrollArea, Separator) to build a timeline/waterfall view of streaming chunks. Each chunk gets a card showing:

- Timestamp (relative to stream start)
- Chunk type (text delta, tool call, tool result, etc.)
- Raw payload (via react-inspector)
- Parsed/rendered preview

This is custom UI that doesn't map to an off-the-shelf component. The closest analogy is a network waterfall, but our data is domain-specific enough that a custom component using existing primitives is the right call.

### Component Registry Viewer

**No external library needed. Build with existing stack.**

**Confidence: HIGH**

Use shadcn Table/DataTable, Card, and Badge components to display registered components, their Zod schemas (rendered as a tree), and resolution status. The Zod schema visualization can use react-inspector to display the parsed schema shape.

---

## Layer 4: SDK-Side Agent Architecture

### Recommendation: Follow TanStack Query DevTools pattern

**Confidence: HIGH**

TanStack Query DevTools use **direct object subscriptions** -- the devtools subscribe to `QueryCache` and `MutationCache` events for reactive updates. There's no separate "bridge" abstraction; the devtools and client share the same JavaScript context.

For Tambo, the SDK-side agent should:

1. **Hook into existing providers** -- `TamboProvider`, `TamboThreadProvider`, etc. already manage state via React context. The agent subscribes to the same state sources.
2. **Event capture via middleware/interceptors** -- intercept streaming chunks, tool calls, and component registrations at the provider level before they reach the consumer.
3. **Lazy activation** -- the agent should be a separate entry point that only runs when `process.env.NODE_ENV === 'development'` and a devtools connection is detected. Zero runtime cost in production.
4. **Tree-shakeable** -- the devtools agent should be in a separate file/entry point so bundlers can eliminate it entirely from production builds. Follow TanStack's pattern of exporting from a `/devtools` subpath.

### Production Exclusion Pattern

```typescript
// react-sdk/src/devtools/index.ts -- development entry
export { TamboDevTools } from "./tambo-dev-tools";

// react-sdk/src/devtools/production.ts -- production no-op
export const TamboDevTools = () => null;
```

Users import from the development entry; their bundler's dead-code elimination removes it in production. This matches what TanStack Query, Redux DevTools, and React DevTools all do.

---

## Layer 5: Optional / Future Considerations

### TanStack DevTools Plugin System

**Confidence: LOW (too early / unstable)**

| Option                             | Verdict            | Rationale                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/devtools` 0.10.2 plugin | **EVALUATE LATER** | TanStack Devtools is a new framework-agnostic devtools panel that supports custom plugins. At v0.10.x it's pre-1.0 and the API is still evolving rapidly. The plugin API is simple (id, name, render function) but the shell is Solid.js-based which adds friction for a React-heavy team. Worth revisiting at v1.0+ but not a dependency for V1. |
| `@tanstack/react-devtools`         | **EVALUATE LATER** | React wrapper for TanStack Devtools. Same stability concerns. If this reaches 1.0 and Tambo wants to provide a devtools panel that lives inside the developer's app (not the dashboard), this becomes compelling.                                                                                                                                 |

### Zustand for DevTools State

**Confidence: MEDIUM**

| Option           | Verdict       | Rationale                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zustand` 5.0.11 | **CONSIDER**  | If the devtools UI becomes complex enough to need its own state management beyond React Query + useState. Zustand is lightweight (2KB), has excellent DevTools middleware itself, and is the go-to for non-trivial client state. However, the Tambo codebase currently uses React Context + TanStack Query exclusively -- adding Zustand would be a new pattern. |
| React Context    | **USE FIRST** | Start with Context + useState for devtools UI state. Only reach for Zustand if the state graph becomes unwieldy.                                                                                                                                                                                                                                                 |

---

## Dependency Summary

### New Dependencies Required

| Package               | Version | Where                | Size | Purpose                                    |
| --------------------- | ------- | -------------------- | ---- | ------------------------------------------ |
| `partysocket`         | 1.1.6   | react-sdk            | 5KB  | Reconnecting WebSocket client in SDK agent |
| `@nestjs/websockets`  | 11.1.11 | apps/api OR apps/web | 15KB | WebSocket gateway (if using NestJS)        |
| `@nestjs/platform-ws` | 11.1.11 | apps/api OR apps/web | 8KB  | ws adapter for NestJS (if using NestJS)    |
| `react-inspector`     | 9.0.0   | apps/web             | 12KB | Object/state inspection UI                 |

### Existing Dependencies Leveraged (zero new installs)

| Package                               | Version                        | Purpose                                      |
| ------------------------------------- | ------------------------------ | -------------------------------------------- |
| `superjson`                           | 2.2.6                          | WebSocket message serialization              |
| `fast-json-patch`                     | 3.1.1                          | State delta encoding (optional optimization) |
| `zod`                                 | 3.25.x / 4.x                   | Message protocol schema validation           |
| `ws`                                  | 8.19.0                         | WebSocket server (transitive via NestJS)     |
| shadcn Resizable                      | (react-resizable-panels 4.6.x) | Panel layout                                 |
| shadcn Card, Badge, Table, ScrollArea | --                             | UI primitives                                |
| `@tanstack/react-query`               | 5.90.x                         | Data fetching for devtools API calls         |
| Tailwind CSS                          | 3.4.x                          | Styling                                      |

---

## What NOT to Use (and Why)

| Technology                           | Why Not                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Socket.IO                            | Overkill for localhost devtools. Adds unnecessary bundle size, custom protocol, and HTTP fallback we'll never need. |
| GraphQL Subscriptions                | We're not doing GraphQL. Adding a subscription layer for one feature is absurd.                                     |
| Server-Sent Events (SSE)             | Unidirectional. We need the dashboard to send commands back to the SDK.                                             |
| Chrome Extension API                 | Out of scope. The devtools live in the dashboard, not as a browser extension.                                       |
| Electron / standalone app            | Unnecessary complexity. The dashboard is already a web app.                                                         |
| `redux-devtools-extension`           | We don't use Redux. The remote debugging protocol uses SocketCluster which is a dead project.                       |
| `BroadcastChannel` API               | Same-origin only. Dashboard and dev app are on different ports = different origins.                                 |
| `postMessage` / `MessageChannel`     | Requires same window/iframe context. Dashboard and dev app are separate browser tabs.                               |
| `reconnecting-websocket`             | Unmaintained since 2018. Use `partysocket` instead.                                                                 |
| Binary protocols (msgpack, protobuf) | Localhost bandwidth is free. Text-based superjson is easier to debug.                                               |

---

## Open Questions for Roadmap

1. **Where does the WebSocket server live?** NestJS gateway in `apps/api`, custom server in `apps/web`, or standalone package? This affects auth, deployment, and package boundaries.
2. **Does the SDK agent need to buffer events for replay?** If yes, we need a circular buffer with configurable size in the agent. If no, events are fire-and-forget.
3. **Should the devtools work without the dashboard?** i.e., should there be an embedded panel option (like TanStack Query DevTools) in addition to the dashboard-hosted version?
4. **What's the auth model for the WebSocket connection?** Since it's dev-mode localhost, do we skip auth entirely, or use the project API key for identification?

---

## Architecture Reference: How Existing DevTools Work

### React DevTools (facebook/react)

- **Backend** (in the app): Hooks into React renderer internals, captures fiber tree, component state, hooks
- **Frontend** (standalone Electron app or browser extension): Receives serialized component tree, renders inspector UI
- **Bridge**: Raw WebSocket on port 8097. Backend connects to frontend. Messages are unversioned JSON.
- **Key lesson**: Simple WebSocket, no fancy protocol. Version mismatches between backend/frontend are a real pain point.

### TanStack Query DevTools (@tanstack/query)

- **In-process**: DevTools and app share the same JS context. No bridge needed.
- **Architecture**: DevTools subscribe to `QueryCache` events via the public `QueryClient` API.
- **UI**: Framework-agnostic core rendered with Solid.js, wrapped by framework-specific thin adapters.
- **Key lesson**: When devtools live in the same app, direct subscriptions beat message passing. Their production exclusion pattern (separate entry points) is the gold standard.

### Redux DevTools (reduxjs/redux-devtools)

- **Remote mode**: Uses SocketCluster (WebSocket) for remote debugging
- **Extension mode**: Uses `window.__REDUX_DEVTOOLS_EXTENSION__` global + `postMessage` for Chrome extension communication
- **Key lesson**: The remote debugging path is rarely used and poorly maintained. Most Redux users only use the Chrome extension. Browser extension distribution is a maintenance burden.

---

_Research completed: 2026-02-11_
_Confidence: HIGH for transport + UI layers, MEDIUM for state diffing optimization, LOW for TanStack DevTools plugin integration_
