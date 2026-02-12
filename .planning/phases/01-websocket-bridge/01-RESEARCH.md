# Phase 1: WebSocket Bridge - Research

**Researched:** 2026-02-11
**Domain:** WebSocket transport, SDK instrumentation, Next.js WS hosting, production build isolation
**Confidence:** HIGH

## Summary

Phase 1 establishes the real-time communication channel between a developer's running Tambo app (using `@tambo-ai/react`) and the Tambo Cloud dashboard (`apps/web`). The core challenge breaks into three parts: (1) a WebSocket client in the SDK that captures events and sends them over a bridge, (2) a WebSocket server somewhere in the monorepo that receives these events, and (3) connection status UI in the dashboard.

The critical architectural decision is **where the WebSocket server lives**. Next.js 15 does not natively support WebSocket upgrade handling in API routes (confirmed via GitHub Discussion #58698, still unresolved as of Jan 2026). The three options are: patching Next.js with `next-ws`, using the NestJS API's existing `ws`-compatible infrastructure, or running a standalone `ws` server on a dedicated port. Given the project constraints (ephemeral dev-only data, dashboard already depends on `apps/api`, and the need for robustness without patching Next.js internals), **the recommended approach is a standalone lightweight `ws` server launched alongside the dashboard dev process on a well-known port (e.g., 8265)**, managed by the existing Turborepo dev pipeline. This avoids patching Next.js, avoids polluting the API with non-persistent devtools traffic, and is dead simple to implement.

On the SDK side, the devtools code must live behind a separate subpath export (`@tambo-ai/react/devtools`) following the existing `@tambo-ai/react/mcp` pattern. The SDK already has `"sideEffects": false` and dual CJS/ESM builds, so tree-shaking will eliminate devtools code from production builds as long as it is never imported from the main entry point. The `<TamboDevTools />` component activates the bridge; without it, zero devtools code runs.

**Primary recommendation:** Use `ws` for the server (standalone process on port 8265), `partysocket` for the client (auto-reconnect), `superjson` for serialization (already in monorepo), and a separate `@tambo-ai/react/devtools` subpath export following the existing MCP pattern.

## Standard Stack

### Core

| Library       | Version | Purpose                              | Why Standard                                                                                                                                                                                |
| ------------- | ------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ws`          | 8.18.x  | WebSocket server for devtools        | Already transitive dep in monorepo (via openai, jsdom). Zero-dependency, fastest Node.js WS impl. De facto standard with 25k+ dependents.                                                   |
| `partysocket` | 1.1.x   | Reconnecting WebSocket client in SDK | Fork of `reconnecting-websocket` with maintained bugfixes. Auto-reconnect, message buffering, configurable backoff. 252k weekly npm downloads. Zero dependencies. Works in all JS runtimes. |
| `superjson`   | 2.2.6   | Wire protocol serialization          | Already a dependency in apps/web, apps/api, packages/db, and cli. Handles Date, Map, Set, undefined transparently. No new install needed.                                                   |

### Supporting

| Library | Version | Purpose                          | When to Use                                                                          |
| ------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `zod`   | 3.25.x  | Wire protocol message validation | Already peer dep. Define discriminated union message schemas for type-safe protocol. |

### Alternatives Considered

| Instead of             | Could Use                                        | Tradeoff                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standalone `ws` server | NestJS WebSocket Gateway (`@nestjs/platform-ws`) | NestJS gateway adds `@nestjs/websockets` + `@nestjs/platform-ws` as new deps, routes devtools traffic through the API server, and couples ephemeral debug data to persistent infrastructure. Only makes sense if we need auth/guards on the WS connection.           |
| Standalone `ws` server | `next-ws` (patched Next.js)                      | Patches the local Next.js installation to support `UPGRADE` exports in route handlers. At v2.1.16 (Jan 2026), reasonably maintained. But patching framework internals is fragile, breaks on Next.js upgrades, and is not suitable for production-deployed dashboard. |
| Standalone `ws` server | WebSocket in `apps/web` custom server            | Requires replacing `next dev` with a custom `server.ts` that wraps Next.js. Adds complexity to the dev pipeline and makes the dashboard harder to deploy on Vercel/serverless.                                                                                       |
| `partysocket`          | Native `WebSocket` API                           | No auto-reconnect, no message buffering, no backoff. Would require reimplementing everything `partysocket` already provides.                                                                                                                                         |
| `superjson`            | Raw `JSON.stringify`                             | Loses Date objects, Maps, Sets, undefined values. SDK state contains these types.                                                                                                                                                                                    |

**Installation (new deps only):**

```bash
# SDK-side (client)
npm install partysocket -w react-sdk

# Server-side (standalone devtools server)
npm install ws -w apps/web
npm install --save-dev @types/ws -w apps/web
```

Note: `ws` is already in the dependency tree transitively (via openai in apps/api and jsdom in apps/web), but adding it as a direct dependency makes the intent explicit. `partysocket` is the only truly new dependency.

## Architecture Patterns

### Recommended Project Structure

**SDK side (`react-sdk/src/devtools/`):**

```
react-sdk/src/
├── devtools/
│   ├── index.ts                      # Subpath export entry point
│   ├── tambo-dev-tools.tsx            # <TamboDevTools /> component
│   ├── devtools-bridge.ts             # WebSocket client + event capture
│   ├── devtools-protocol.ts           # Wire protocol type definitions
│   └── devtools-bridge.test.ts        # Bridge unit tests
├── mcp/                               # Existing MCP subpath (pattern to follow)
│   └── index.ts
└── index.ts                           # Main entry (NEVER imports devtools/)
```

**Dashboard side (`apps/web/`):**

```
apps/web/
├── devtools-server/
│   ├── server.ts                      # Standalone ws server entry point
│   ├── connection-manager.ts          # Track connected SDK instances
│   └── server.test.ts                 # Server unit tests
├── app/
│   └── (authed)/
│       └── devtools/
│           ├── page.tsx               # DevTools dashboard page
│           └── components/
│               ├── connection-status.tsx   # Connection indicator
│               └── devtools-provider.tsx   # WS client + state management
```

### Pattern 1: Separate Subpath Export (Zero Production Cost)

**What:** DevTools code lives in `react-sdk/src/devtools/` and is exported via `@tambo-ai/react/devtools`. It is never imported by any code in `react-sdk/src/v1/` or `react-sdk/src/index.ts`.

**When to use:** Always. This is the foundational pattern that makes INFRA-05 (zero bundle cost) possible.

**Example (package.json exports):**

```jsonc
// react-sdk/package.json
{
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts",
    },
    "./mcp": {
      "import": "./esm/mcp/index.js",
      "require": "./dist/mcp/index.js",
      "types": "./dist/mcp/index.d.ts",
    },
    "./devtools": {
      "import": "./esm/devtools/index.js",
      "require": "./dist/devtools/index.js",
      "types": "./dist/devtools/index.d.ts",
    },
  },
}
```

This mirrors the existing `./mcp` subpath pattern exactly. The TypeScript build configs (`tsconfig.cjs.json` and `tsconfig.esm.json`) already include `src/**/*.ts` and `src/**/*.tsx`, so no tsconfig changes are needed.

### Pattern 2: Explicit Opt-In Activation (Three-Layer Model)

**What:** Three distinct layers control devtools behavior:

1. **Code inclusion** -- The `@tambo-ai/react/devtools` subpath export controls whether devtools code exists in the bundle. If not imported, it does not exist.
2. **Activation** -- The `<TamboDevTools />` component must be explicitly rendered by the developer. This is the opt-in mechanism (INFRA-06).
3. **Connection** -- Event emission only starts when the dashboard WebSocket server is actually reachable. Before connection, the SDK does zero extra work.

**When to use:** Always. This prevents the "dev mode always does extra work" pitfall (P10 from pitfalls research).

**Example (consumer code):**

```tsx
// Developer's app
import { TamboProvider } from "@tambo-ai/react";
import { TamboDevTools } from "@tambo-ai/react/devtools";

function App() {
  return (
    <TamboProvider apiKey={key}>
      <MyApp />
      <TamboDevTools /> {/* Explicit opt-in */}
    </TamboProvider>
  );
}
```

### Pattern 3: Passive Observer via Context Subscription

**What:** The devtools bridge subscribes to existing React contexts (`StreamStateContext`, `TamboRegistryContext`) to observe state changes. It does NOT modify the dispatch pipeline, wrap providers, or intercept events. It reads state and sends snapshots/deltas over the WebSocket.

**When to use:** For Phase 1, this is the simplest approach. The `<TamboDevTools />` component renders inside `TamboProvider`'s tree and uses `useStreamState()` and the registry context to read current state. State changes trigger re-renders of the devtools component, which serializes and sends updates.

**Why not intercept dispatch:** Wrapping `StreamDispatchContext` to intercept every dispatched event would require modifying the provider hierarchy, which violates the constraint that devtools must not modify existing SDK behavior. Reading state after it is committed is safer and simpler.

**Tradeoff:** We lose individual event granularity (we see state snapshots, not individual events). This is fine for Phase 1 (connection proof). Phase 3 (streaming visibility) will need a more granular approach, potentially a dispatch wrapper -- but that is out of scope for Phase 1.

### Pattern 4: Standalone WebSocket Server on Dedicated Port

**What:** A lightweight Node.js script using `ws` that runs on a well-known port (recommend `8265`) alongside the dashboard dev process.

**When to use:** This is the recommended WebSocket server hosting pattern for Phase 1.

**Why standalone:**

- Next.js 15 does not support WebSocket upgrade in API routes (verified: GitHub Discussion #58698, no resolution as of Jan 2026)
- `next-ws` patches Next.js internals (fragile, breaks on upgrades)
- Custom Next.js server replaces `next dev` (complicates dev pipeline)
- NestJS gateway adds dependencies and routes ephemeral devtools data through the API
- A standalone `ws` server is 20-30 lines of code, trivially debuggable

**How it fits the dev pipeline:**

```jsonc
// Root package.json scripts
{
  "dev:cloud": "turbo dev --filter=@tambo-ai-cloud/web --filter=@tambo-ai-cloud/api",
  // Updated to include devtools server:
  "dev:cloud": "turbo dev --filter=@tambo-ai-cloud/web --filter=@tambo-ai-cloud/api && node apps/web/devtools-server/server.ts",
}
```

Or preferably, the devtools server starts when the web app starts, via a script in `apps/web/package.json`. The devtools WS server can be launched by a turbo task or concurrently alongside `next dev`.

### Pattern 5: Handshake Protocol

**What:** On WebSocket connect, the SDK sends a handshake message containing `sdkVersion`, `projectId`, and `sessionId`. The server validates and stores this metadata. The dashboard displays it as the connection status indicator.

**Example (handshake):**

```typescript
// SDK -> Server
{
  type: "handshake",
  sdkVersion: "1.0.1",     // from package.json
  projectId: "proj_xxx",   // from TamboProvider apiKey/config
  sessionId: "uuid-v4",    // unique per SDK instance
  protocolVersion: 1        // for future compat
}

// Server -> SDK (acknowledgment)
{
  type: "handshake_ack",
  serverVersion: "1.0.0",
  sessionId: "uuid-v4"
}
```

### Anti-Patterns to Avoid

- **Importing devtools from main entry:** Never import anything from `react-sdk/src/devtools/` in `react-sdk/src/index.ts` or any v1 code. This would pull devtools into every consumer's bundle.
- **Adding TamboDevToolsProvider inside TamboProvider:** Do NOT nest devtools providers in the main provider tree. The `<TamboDevTools />` component renders as a sibling inside the existing provider tree.
- **Emitting events when not connected:** The bridge must not serialize or buffer events when no WebSocket connection is active. Zero work when disconnected.
- **Using Socket.IO:** Adds 40-50KB for features we do not need (rooms, namespaces, HTTP fallback). Localhost devtools will never need transport fallbacks.
- **Using `BroadcastChannel`:** Same-origin only. Dashboard (port 8260) and dev app (arbitrary port) are different origins.

## Don't Hand-Roll

| Problem                  | Don't Build                           | Use Instead            | Why                                                                                                                                  |
| ------------------------ | ------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| WebSocket auto-reconnect | Custom reconnection logic with timers | `partysocket`          | Exponential backoff, jitter, message buffering, connection timeout -- all subtle to get right. `partysocket` handles all edge cases. |
| Complex serialization    | Custom JSON serializer for Dates/Maps | `superjson`            | Already in monorepo. Handles Date, Map, Set, undefined, BigInt, RegExp, Error transparently.                                         |
| WebSocket server         | Custom HTTP upgrade handler           | `ws` `WebSocketServer` | 10 lines to create a server. Battle-tested, handles ping/pong, per-message compression, connection lifecycle.                        |

**Key insight:** The WebSocket layer is foundational infrastructure, not the product. Spend time on the protocol design and integration points, not on reimplementing transport primitives.

## Common Pitfalls

### Pitfall 1: Bundle Size Contamination (P1 - CRITICAL)

**What goes wrong:** DevTools code leaks into production builds of consumer apps.
**Why it happens:** A single import chain from `react-sdk/src/index.ts` to any devtools file pulls everything into the bundle. The SDK's `TamboProvider` composes 10+ nested providers -- adding devtools to that chain contaminates every build.
**How to avoid:** Strict subpath isolation. The `devtools/` directory is its own entry point. Add a CI check that verifies the main entry point's bundle size does not grow when devtools are added. Use `npm pack` output size as a regression check.
**Warning signs:** `npm pack` output for `@tambo-ai/react` grows by more than a few KB. Bundle analyzer shows `partysocket` or `devtools-bridge` in production builds.

### Pitfall 2: WebSocket Connection Lifecycle (P2 - CRITICAL)

**What goes wrong:** Connections silently die, duplicates accumulate, HMR creates zombie connections.
**Why it happens:** React's `useEffect` cleanup may not fire reliably during HMR. Multiple `StrictMode` renders create duplicate connections.
**How to avoid:** Use a connection state machine: `disconnected -> connecting -> connected -> reconnecting -> disconnected`. `partysocket` handles reconnection, but we must handle React lifecycle correctly. Use a ref to track the single connection instance. Close on unmount. Debounce connection attempts during HMR.
**Warning signs:** Dashboard shows multiple sessions for the same app. Memory usage grows over time.

### Pitfall 3: Conflating Dev Mode with Devtools Connected (P10 - MEDIUM)

**What goes wrong:** Devtools code runs and does work even when no dashboard is open.
**Why it happens:** Gating on `process.env.NODE_ENV === 'development'` alone means devtools infrastructure initializes every time in dev mode.
**How to avoid:** Three-layer model (see Pattern 2). Code inclusion (subpath), Activation (`<TamboDevTools />`), Connection (WS actually connected). Event emission only happens in layer 3.
**Warning signs:** Dev mode is slower even when devtools dashboard is not open.

### Pitfall 4: Next.js WS Server Incompatibility

**What goes wrong:** Attempting to handle WebSocket upgrade in Next.js API routes silently fails or requires fragile patches.
**Why it happens:** Next.js App Router API routes do not expose the raw HTTP server or support the `Upgrade` header. This is a known limitation (Discussion #58698, open since Nov 2023, no resolution).
**How to avoid:** Do not attempt to put the WS server inside Next.js. Use a standalone `ws` server on a separate port.
**Warning signs:** WS connections fail silently. `next-ws` breaks after Next.js version bump.

### Pitfall 5: Serialization of Non-Serializable SDK State (P8 - MEDIUM)

**What goes wrong:** `JSON.stringify` throws on the SDK's internal state objects (circular refs, React elements, Zod schemas, function references).
**Why it happens:** `TamboRegistryContext` stores actual React component references and Zod schema objects. These cannot be serialized.
**How to avoid:** Define explicit "devtools projection" types. Never serialize raw internal state. For component registrations: serialize name, description, and JSON Schema representation of props (SDK already has `zod-to-json-schema` as peer dep). For thread state: serialize thread ID, messages (text only), status, tool call metadata. Strip React elements and functions.
**Warning signs:** "Converting circular structure to JSON" errors. Messages > 100KB for routine state.

## Code Examples

### Creating the Standalone WebSocket Server

```typescript
// apps/web/devtools-server/server.ts
import { WebSocketServer, type WebSocket } from "ws";

const PORT = 8265;
const HEARTBEAT_INTERVAL = 30_000;

interface ConnectedClient {
  ws: WebSocket;
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
  isAlive: boolean;
}

const clients = new Map<string, ConnectedClient>();

const wss = new WebSocketServer({ port: PORT, host: "localhost" });

wss.on("connection", (ws) => {
  let client: ConnectedClient | undefined;

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === "handshake") {
      client = {
        ws,
        sessionId: message.sessionId,
        sdkVersion: message.sdkVersion,
        projectId: message.projectId,
        isAlive: true,
      };
      clients.set(message.sessionId, client);

      ws.send(
        JSON.stringify({
          type: "handshake_ack",
          sessionId: message.sessionId,
        }),
      );

      // Broadcast new connection to dashboard clients
      broadcastToDashboard({
        type: "client_connected",
        sessionId: message.sessionId,
        sdkVersion: message.sdkVersion,
        projectId: message.projectId,
      });
    }
  });

  ws.on("close", () => {
    if (client) {
      clients.delete(client.sessionId);
      broadcastToDashboard({
        type: "client_disconnected",
        sessionId: client.sessionId,
      });
    }
  });

  ws.on("pong", () => {
    if (client) client.isAlive = true;
  });
});

// Heartbeat to detect dead connections
const heartbeat = setInterval(() => {
  for (const [sessionId, client] of clients) {
    if (!client.isAlive) {
      client.ws.terminate();
      clients.delete(sessionId);
      continue;
    }
    client.isAlive = false;
    client.ws.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on("close", () => clearInterval(heartbeat));

console.log(`[DevTools] WebSocket server listening on ws://localhost:${PORT}`);
```

### SDK-Side Bridge Client (partysocket)

```typescript
// react-sdk/src/devtools/devtools-bridge.ts
import { WebSocket as ReconnectingWebSocket } from "partysocket";
import type { DevToolsMessage } from "./devtools-protocol";

const DEFAULT_PORT = 8265;
const DEFAULT_HOST = "localhost";

export interface DevToolsBridgeOptions {
  host?: string;
  port?: number;
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
}

export class DevToolsBridge {
  private ws: ReconnectingWebSocket | null = null;
  private connected = false;

  constructor(private options: DevToolsBridgeOptions) {}

  connect(): void {
    const host = this.options.host ?? DEFAULT_HOST;
    const port = this.options.port ?? DEFAULT_PORT;
    const url = `ws://${host}:${port}`;

    this.ws = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: 10_000,
      minReconnectionDelay: 1_000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4_000,
      maxRetries: Infinity,
      maxEnqueuedMessages: 0, // Don't buffer when disconnected
    });

    this.ws.addEventListener("open", () => {
      this.connected = true;
      this.send({
        type: "handshake",
        sdkVersion: this.options.sdkVersion,
        projectId: this.options.projectId,
        sessionId: this.options.sessionId,
        protocolVersion: 1,
      });
    });

    this.ws.addEventListener("close", () => {
      this.connected = false;
    });
  }

  send(message: DevToolsMessage): void {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify(message));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  get isConnected(): boolean {
    return this.connected;
  }
}
```

### TamboDevTools Component

```tsx
// react-sdk/src/devtools/tambo-dev-tools.tsx
"use client";

import { useEffect, useRef } from "react";
import { DevToolsBridge } from "./devtools-bridge";

// Version injected at build time or read from package
const SDK_VERSION = "1.0.1";

export interface TamboDevToolsProps {
  /** Port of the devtools WebSocket server. Defaults to 8265. */
  port?: number;
  /** Host of the devtools WebSocket server. Defaults to "localhost". */
  host?: string;
}

/**
 * Opt-in devtools bridge component.
 *
 * Place inside TamboProvider to enable devtools connection.
 * This component renders nothing visible. It establishes a WebSocket
 * connection to the devtools server and sends state updates.
 */
export function TamboDevTools({ port, host }: TamboDevToolsProps): null {
  const bridgeRef = useRef<DevToolsBridge | null>(null);

  useEffect(() => {
    const bridge = new DevToolsBridge({
      host,
      port,
      sessionId: crypto.randomUUID(),
      sdkVersion: SDK_VERSION,
      // projectId will come from TamboProvider context in real impl
    });

    bridge.connect();
    bridgeRef.current = bridge;

    return () => {
      bridge.disconnect();
      bridgeRef.current = null;
    };
  }, [host, port]);

  return null;
}
```

### Wire Protocol Types

```typescript
// react-sdk/src/devtools/devtools-protocol.ts

/** SDK -> Server messages */
export type DevToolsMessage =
  | DevToolsHandshake
  | DevToolsStateSnapshot
  | DevToolsHeartbeat;

/** Handshake sent on connection */
export interface DevToolsHandshake {
  type: "handshake";
  protocolVersion: number;
  sdkVersion: string;
  projectId?: string;
  sessionId: string;
}

/** Full state snapshot (sent periodically or on significant changes) */
export interface DevToolsStateSnapshot {
  type: "state_snapshot";
  sessionId: string;
  timestamp: number;
  threads: Array<{
    id: string;
    name?: string;
    status: "idle" | "streaming" | "waiting";
    messageCount: number;
  }>;
  registry: {
    components: Array<{
      name: string;
      description: string;
    }>;
    tools: Array<{
      name: string;
      description: string;
    }>;
  };
}

/** Heartbeat to keep connection alive */
export interface DevToolsHeartbeat {
  type: "heartbeat";
  sessionId: string;
  timestamp: number;
}

/** Server -> SDK messages */
export type DevToolsServerMessage =
  | DevToolsHandshakeAck
  | DevToolsRequestSnapshot;

export interface DevToolsHandshakeAck {
  type: "handshake_ack";
  sessionId: string;
}

export interface DevToolsRequestSnapshot {
  type: "request_snapshot";
}
```

### Subpath Export Configuration

```jsonc
// react-sdk/package.json (additions to exports field)
{
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts",
    },
    "./mcp": {
      "import": "./esm/mcp/index.js",
      "require": "./dist/mcp/index.js",
      "types": "./dist/mcp/index.d.ts",
    },
    "./devtools": {
      "import": "./esm/devtools/index.js",
      "require": "./dist/devtools/index.js",
      "types": "./dist/devtools/index.d.ts",
    },
  },
}
```

No changes to `tsconfig.cjs.json` or `tsconfig.esm.json` are needed -- they already compile `src/**/*.ts` and `src/**/*.tsx`.

## State of the Art

| Old Approach                 | Current Approach                   | When Changed | Impact                                                                                                                         |
| ---------------------------- | ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `reconnecting-websocket`     | `partysocket`                      | 2023 (fork)  | Maintained fork with bugfixes. Same API, active development.                                                                   |
| Socket.IO for everything     | Raw `ws` + reconnecting client     | 2022+        | Community preference shifted away from Socket.IO for simple WS use cases.                                                      |
| Custom Next.js server for WS | Standalone WS process or `next-ws` | 2024-2025    | Next.js still has no native WS support in API routes (Discussion #58698).                                                      |
| React DevTools bridge model  | Still the gold standard            | 2019-present | Backend (agent in app) + Bridge (transport) + Frontend (dashboard) pattern remains the established architecture for dev tools. |

**Deprecated/outdated:**

- `reconnecting-websocket`: Last published 2018, unmaintained. Use `partysocket`.
- Flipper (Meta): Archived 2024. Its WebSocket-based architecture was sound but the project was too complex.
- Socket.IO for devtools: Overkill. The 40-50KB client bundle and HTTP fallback are unnecessary for localhost communication.

## Open Questions

1. **WebSocket server port and process management**
   - What we know: Port 8265 is available. The server is ~30 lines of code.
   - What's unclear: Should the devtools server be launched by `npm run dev:cloud` automatically, or should it be a separate command (`npm run dev:devtools`)? Should it be a Turborepo task?
   - Recommendation: Add as a concurrent process in the web app's dev script. Use `concurrently` or add as a Turborepo task. Auto-start when developing.

2. **Dashboard-to-server communication**
   - What we know: The WS server receives events from SDK instances. The dashboard needs to display them.
   - What's unclear: Does the dashboard page connect to the same WS server as a "dashboard client", or does the WS server expose an HTTP endpoint for the dashboard to poll? For Phase 1 (connection status only), the dashboard page could connect via its own WebSocket client.
   - Recommendation: Dashboard page connects to the WS server as a WebSocket client. The server routes SDK client events to dashboard clients and vice versa. This is the Flipper pattern.

3. **Cross-origin for hosted Tambo Cloud**
   - What we know: WebSocket connections are not subject to CORS (the browser does not enforce same-origin for WS). However, the connection URL must be known.
   - What's unclear: If a developer uses a hosted Tambo Cloud dashboard (e.g., `app.tambo.co`), how do they discover the local devtools WS server URL? The WS server runs on `localhost:8265` on their machine, but the hosted dashboard cannot reach `localhost`.
   - Recommendation: For v1, scope to local development only (both dashboard and dev app on localhost). Hosted dashboard support is a v2 concern. Document this limitation.

4. **SDK version injection**
   - What we know: The handshake needs the SDK version string.
   - What's unclear: How to inject the version at build time without manual updates.
   - Recommendation: Read from `package.json` at build time or use a constant that gets updated during release. The existing build pipeline can handle this.

## Sources

### Primary (HIGH confidence)

- **Codebase analysis** (`react-sdk/package.json`) -- verified `exports` field, `sideEffects: false`, dual CJS/ESM build, existing `./mcp` subpath pattern
- **Codebase analysis** (`react-sdk/src/v1/providers/tambo-v1-stream-context.tsx`) -- confirmed split-context pattern with `StreamStateContext`, `StreamDispatchContext`, `useStreamState()`, `useStreamDispatch()`
- **Codebase analysis** (`react-sdk/src/v1/utils/event-accumulator.ts`) -- confirmed `StreamState`, `StreamAction`, `streamReducer` interfaces and the full AG-UI event handling pipeline
- **Codebase analysis** (`react-sdk/src/mcp/index.ts`) -- confirmed existing subpath export pattern for `@tambo-ai/react/mcp`
- **Codebase analysis** (`apps/web/next.config.mjs`) -- confirmed Next.js 15.5.12, `output: "standalone"`, no custom server
- **Monorepo dependency check** -- `ws` 8.18.3 (transitive), `superjson` 2.2.6 (direct in 4 packages), `partysocket` not yet installed

### Secondary (MEDIUM confidence)

- [GitHub Discussion #58698](https://github.com/vercel/next.js/discussions/58698) -- Next.js WebSocket upgrade support request, still open, no official resolution as of Jan 2026
- [`next-ws` GitHub](https://github.com/apteryxxyz/next-ws) -- v2.1.16, Jan 2026, patches Next.js for WS support in API routes
- [`partysocket` README](https://github.com/cloudflare/partykit/blob/main/packages/partysocket/README.md) -- Documented API, configuration options, reconnection behavior
- [NestJS WebSocket docs](https://docs.nestjs.com/websockets/gateways) -- `@nestjs/platform-ws` adapter docs, gateway pattern

### Tertiary (LOW confidence)

- Prior project research (`.planning/research/ARCHITECTURE.md`, `STACK.md`, `PITFALLS.md`) -- written by AI during project initialization. Cross-verified against codebase but some claims about library versions may be slightly stale.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries verified against monorepo deps, npm, and official docs
- Architecture: HIGH -- patterns derived from codebase analysis of existing subpath export, provider hierarchy, and build system
- Pitfalls: HIGH -- grounded in codebase-specific constraints (provider nesting, serialization issues with Zod/React components)
- WS server hosting: HIGH -- Next.js WS limitation confirmed via multiple sources; standalone server is simplest proven approach
- Wire protocol: MEDIUM -- protocol design is sound but will evolve during implementation; examples are illustrative not final

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days -- stable domain, no fast-moving dependencies)
