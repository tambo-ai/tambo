# Tambo DevTools

## What This Is

Browser-based developer tools for debugging and inspecting Tambo-powered applications. Hosted within the Tambo Cloud dashboard (apps/web), it connects to a locally running Tambo app via a websocket bridge to provide real-time visibility into threads, streaming chunks, component registration, and API interactions. Built for external developers who use the Tambo SDK.

## Core Value

Developers can see exactly what's happening inside their Tambo app — threads, streaming data, component state — without resorting to console.log or manual network tab inspection.

## Requirements

### Validated

<!-- Existing capabilities inferred from codebase -->

- ✓ Tambo Cloud dashboard exists with project management UI — existing
- ✓ React SDK has thread/component/tool hooks and providers — existing
- ✓ NestJS API persists threads, messages, tool calls — existing
- ✓ Streaming-first architecture for AI interactions — existing
- ✓ Component registration system with Zod schemas — existing

### Active

- [ ] Websocket bridge from SDK to dashboard for real-time dev event streaming
- [ ] Thread state inspector showing threads, messages, tool calls, and streaming state
- [ ] Component registry viewer showing registered components, their schemas, and resolution
- [ ] Network/API trace showing requests and responses with decoded payloads
- [ ] Streaming chunk visualizer showing raw chunks as they arrive and how they're played back
- [ ] Replayable stream capture for debugging rendering/parsing issues (stretch goal)

### Out of Scope

- Production debugging — dev mode only for v1
- Browser extension — this lives in the dashboard, not as a separate extension
- Mobile app debugging — web-only
- Performance profiling — focus on state/data visibility, not perf metrics

## Context

- The Tambo SDK (`@tambo-ai/react`) already has hooks and providers that manage thread, component, and tool state internally via React context
- The Tambo Cloud dashboard (`apps/web`) is a Next.js app on port 8260 that already has project management, thread viewing, and API key management
- The API (`apps/api`) on port 8261 already persists threads, messages, and tool calls
- There is currently zero Tambo-aware debugging tooling — developers use browser DevTools, console.log, and manual debugger statements
- TanStack Query DevTools is the UX inspiration — a developer panel with live state inspection
- The websocket bridge needs to be added to the React SDK (client side) and either the dashboard or a local server (receiver side)
- Streaming chunks are currently consumed and transformed in the SDK but not surfaced for inspection

## Constraints

- **Tech stack**: Must fit within existing monorepo (React, Next.js, NestJS, TypeScript)
- **SDK impact**: Websocket bridge in React SDK must be zero-cost when not connected (tree-shakeable or lazy-loaded in dev mode only)
- **Existing patterns**: Follow the monorepo's established architecture — hooks, providers, Tailwind/shadcn for UI
- **Package boundary**: Dev-tools UI lives in apps/web; bridge/instrumentation code lives in react-sdk or a new package

## Key Decisions

| Decision                                              | Rationale                                                        | Outcome   |
| ----------------------------------------------------- | ---------------------------------------------------------------- | --------- |
| Dashboard-hosted (not embedded in app)                | Keeps developer's app clean; leverages existing dashboard infra  | — Pending |
| Websocket bridge (not API-only)                       | Need to see client-side streaming data that never hits the API   | — Pending |
| Dev mode only for v1                                  | Reduces scope; avoids auth/security complexity of prod debugging | — Pending |
| Form factor (TanStack-style panel vs standalone page) | Needs research — best DX for this type of tooling                | — Pending |

---

_Last updated: 2026-02-11 after initialization_
