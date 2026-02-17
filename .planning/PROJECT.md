# Tambo DevTools

## What This Is

Browser-based developer tools for debugging and inspecting Tambo-powered applications. Hosted within the Tambo Cloud dashboard (apps/web), it connects to a locally running Tambo app via a websocket bridge to provide real-time visibility into threads, streaming chunks, component registration, and API interactions. Built for external developers who use the Tambo SDK.

## Core Value

Developers can see exactly what's happening inside their Tambo app — threads, streaming data, component state — without resorting to console.log or manual network tab inspection.

## Current State

**v1.0 shipped** (2026-02-12) — 3 phases, 9 plans, 62 files, ~8,800 lines

What's built:

- WebSocket bridge (SDK ↔ dashboard via port 8265) with auto-reconnect and zero production bundle cost
- Thread inspector with message detail, content block rendering, JSON tree viewer
- Component registry and tool registry with schema inspection
- Error banner surfacing streaming/tool/connection errors
- Filter bar with thread status, message role/type, and text search
- Real-time event timeline with color-coded AG-UI events, RAF-batched rendering, ring buffer
- Component streaming visualizer with JSON Patch log and cumulative props
- Tool call lifecycle panel with status tracking

## Current Milestone: v1.1 DevTools Integration Fix

**Goal:** Fix the broken devtools trigger and connection so the SDK-to-dashboard bridge actually works.

**Target features:**

- Remove TamboDevTools from dashboard's own provider (it's debugging itself)
- Fix trigger component: show connection status, tool/component counts, link to correct dashboard URL
- Hide trigger on `/devtools` page
- Pre-select the correct client when opening dashboard from trigger

## Next Milestone Goals

Candidates for v2.0 (from deferred v2 requirements):

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

| Decision                                    | Rationale                                                       | Status       |
| ------------------------------------------- | --------------------------------------------------------------- | ------------ |
| Dashboard-hosted (not embedded in app)      | Keeps developer's app clean; leverages existing dashboard infra | Shipped v1.0 |
| Websocket bridge (not API-only)             | Need to see client-side streaming data that never hits the API  | Shipped v1.0 |
| Dev mode only for v1                        | Reduces scope; avoids auth/security complexity                  | Shipped v1.0 |
| Standalone WS server on port 8265           | Avoids NestJS gateway complexity and next-ws patches            | Shipped v1.0 |
| `@tambo-ai/react/devtools` subpath export   | Zero bundle cost in production builds                           | Shipped v1.0 |
| Ring buffer + RAF batching + virtualization | Handles high-frequency events without jank                      | Shipped v1.0 |

---

_Last updated: 2026-02-16 after v1.1 milestone start_
