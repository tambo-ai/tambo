# Tambo DevTools

## What This Is

Browser-based developer tools for debugging and inspecting Tambo-powered applications. Hosted within the Tambo Cloud dashboard (apps/web), it connects to a locally running Tambo app via a websocket bridge to provide real-time visibility into threads, streaming chunks, component registration, and API interactions. Built for external developers who use the Tambo SDK.

## Core Value

Developers can see exactly what's happening inside their Tambo app — threads, streaming data, component state — without resorting to console.log or manual network tab inspection.

## Current State

**v1.1 shipped** (2026-02-18) — 1 phase, 2 plans (on top of v1.0's 3 phases, 9 plans)

What's built:

- WebSocket bridge (SDK ↔ dashboard via port 8265) with auto-reconnect and zero production bundle cost
- Thread inspector with message detail, content block rendering, JSON tree viewer
- Component registry and tool registry with schema inspection
- Error banner surfacing streaming/tool/connection errors
- Filter bar with thread status, message role/type, and text search
- Real-time event timeline with color-coded AG-UI events, RAF-batched rendering, ring buffer
- Component streaming visualizer with JSON Patch log and cumulative props
- Tool call lifecycle panel with status tracking
- Minimal dot trigger with stats popover (component/tool/thread counts, connection status, streaming indicator)
- Route-aware trigger hiding (`showTrigger` prop)
- Server-side API key decryption for project name display
- Dashboard snapshot request on refresh, clientId auto-selection via URL params
- Showcase app integration for end-to-end demo

## Requirements

### Validated

- ✓ WIRE-01: TamboDevTools in apps/web connects to WS bridge — v1.1
- ✓ WIRE-02: Showcase includes TamboDevTools — v1.1
- ✓ TRIG-01: Trigger shows connection status — v1.1
- ✓ TRIG-02: Trigger popover shows summary stats — v1.1
- ✓ TRIG-03: Trigger hidden on /devtools — v1.1
- ✓ TRIG-04: Open DevTools links to dashboard URL — v1.1
- ✓ TRIG-05: Link includes clientId; dashboard auto-selects — v1.1

### Active

(None — next milestone will define new requirements)

### Out of Scope

- Bidirectional communication — v2.0 feature
- Component resolution tracing — v2.0 feature
- Session recording/replay — v2.0 feature
- Embedded devtools (non-dashboard) — architecture decision: dashboard-hosted

## Next Milestone Goals

Candidates for v2.0:

- Bidirectional communication (cancel runs, retry messages, trigger tools from dashboard)
- Component resolution tracing (why AI chose a component)
- Model reasoning/thinking tokens in real-time
- Session recording and replay

## Constraints

- **Tech stack**: Must fit within existing monorepo (React, Next.js, NestJS, TypeScript)
- **SDK impact**: Websocket bridge in React SDK must be zero-cost when not connected (tree-shakeable or lazy-loaded in dev mode only)
- **Existing patterns**: Follow the monorepo's established architecture — hooks, providers, Tailwind/shadcn for UI
- **Package boundary**: Dev-tools UI lives in apps/web; bridge/instrumentation code lives in react-sdk

## Key Decisions

| Decision                                    | Rationale                                                        | Status       |
| ------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| Dashboard-hosted (not embedded in app)      | Keeps developer's app clean; leverages existing dashboard infra  | Shipped v1.0 |
| Websocket bridge (not API-only)             | Need to see client-side streaming data that never hits the API   | Shipped v1.0 |
| Dev mode only for v1                        | Reduces scope; avoids auth/security complexity                   | Shipped v1.0 |
| Standalone WS server on port 8265           | Avoids NestJS gateway complexity and next-ws patches             | Shipped v1.0 |
| `@tambo-ai/react/devtools` subpath export   | Zero bundle cost in production builds                            | Shipped v1.0 |
| Ring buffer + RAF batching + virtualization | Handles high-frequency events without jank                       | Shipped v1.0 |
| Webpack alias for subpath exports           | Avoids dual-package hazard when apps/web imports from source     | Shipped v1.1 |
| Server-side API key decryption              | Can't decrypt client-side; resolves project UUID for name lookup | Shipped v1.1 |
| showTrigger prop (not layout exclusion)     | More flexible than layout-based hiding; works with any route     | Shipped v1.1 |

---

_Last updated: 2026-02-18 after v1.1 milestone completion_
