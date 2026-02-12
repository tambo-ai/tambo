# Roadmap: Tambo DevTools

## Overview

Tambo DevTools delivers browser-based debugging for Tambo-powered applications in three phases: first establishing the WebSocket bridge between SDK and dashboard with production-safe packaging, then building the core inspection panels (thread state, component registry, filtering), and finally adding real-time streaming visibility (event timeline, component streaming visualizer, tool call lifecycle). Each phase delivers a complete, usable capability layer that builds on the previous one.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: WebSocket Bridge** - Transport layer, connection management, and production-safe SDK packaging
- [x] **Phase 2: Inspection Panels** - Thread state inspector, component registry viewer, filtering, and error visibility
- [ ] **Phase 3: Streaming Visibility** - Real-time event timeline, component streaming visualizer, and tool call tracing

## Phase Details

### Phase 1: WebSocket Bridge

**Goal**: Developers can connect their running Tambo app to the dashboard and see proof of a live connection
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):

1. Developer imports `@tambo-ai/react/devtools`, adds `<TamboDevTools />` to their app, and sees a "connected" indicator in the dashboard
2. Disconnecting/reconnecting the SDK (e.g., HMR reload) shows reconnecting state in the dashboard and recovers automatically
3. The devtools import adds zero bytes to a production build that does not import the devtools subpath
4. Dashboard shows project ID and SDK version of the connected app
   **Plans**: 3 plans

Plans:

- [ ] 01-01-PLAN.md -- Wire protocol types, DevToolsBridge client (partysocket), TamboDevTools component, and @tambo-ai/react/devtools subpath export
- [ ] 01-02-PLAN.md -- Standalone WebSocket server on port 8265, connection manager, dashboard connection hook, and dev:cloud auto-start
- [ ] 01-03-PLAN.md -- DevTools dashboard page with connection status UI, client cards, and end-to-end + production build verification

### Phase 2: Inspection Panels

**Goal**: Developers can inspect thread state, messages, component registrations, and tool registrations in real-time from the dashboard
**Depends on**: Phase 1
**Requirements**: STATE-01, STATE-02, STATE-03, STATE-04, STATE-05, STATE-06, STATE-07, STATE-08, COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):

1. Developer can see all threads listed with name, status (idle/streaming/waiting), and timestamps, and select one to drill into messages
2. Developer can expand any message to see content blocks (text, component, tool_use, tool_result) with full detail, and expand any nested data via a collapsible JSON tree
3. Developer can view all registered components and tools with their names, descriptions, and schemas, plus connected MCP servers
4. Streaming errors, tool call failures, and connection issues appear prominently in the UI without digging into state trees
5. Developer can filter threads by status, filter messages by role/content type, and search across message content and tool names
   **Plans**: 3 plans

Plans:

- [ ] 02-01-PLAN.md -- Enrich wire protocol, create snapshot serializer, wire SDK bridge to emit state, extend dashboard hook
- [ ] 02-02-PLAN.md -- Thread list panel, message detail view, content block viewer, and JSON tree inspector
- [ ] 02-03-PLAN.md -- Registry panel, schema viewer, error banner, filtering, and search

### Phase 3: Streaming Visibility

**Goal**: Developers can observe the real-time streaming lifecycle -- AG-UI events, component prop streaming, and tool call execution -- as it happens
**Depends on**: Phase 2
**Requirements**: COMP-04, COMP-05, COMP-06, STRM-01, STRM-02, STRM-03, STRM-04, STRM-05, STRM-06
**Success Criteria** (what must be TRUE):

1. Developer can see a chronological, color-coded timeline of AG-UI events arriving in real-time, and click any event to see its full payload
2. Developer can see JSON Patch operations arriving for a streaming component and the cumulative props as patches are applied
3. Developer can see the full tool call lifecycle (start, accumulated args, end, result) and client-side tool execution status
4. The timeline handles high-frequency events (per-token deltas) without UI jank or dropped frames
   **Plans**: 3 plans

Plans:

- [ ] 03-01: SDK event capture hooks for streaming events and AG-UI event emission
- [ ] 03-02: Event timeline panel with color-coding, timestamps, and payload detail
- [ ] 03-03: Component streaming visualizer and tool call lifecycle view

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase                   | Plans Complete | Status      | Completed  |
| ----------------------- | -------------- | ----------- | ---------- |
| 1. WebSocket Bridge     | 3/3            | Complete    | 2026-02-12 |
| 2. Inspection Panels    | 3/3            | Complete    | 2026-02-12 |
| 3. Streaming Visibility | 0/3            | Not started | -          |
