# Requirements: Tambo DevTools

**Defined:** 2026-02-11
**Core Value:** Developers can see exactly what's happening inside their Tambo app without resorting to console.log or manual network tab inspection.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: SDK emits dev-tools events via websocket to a locally running dashboard
- [ ] **INFRA-02**: Dashboard receives and processes websocket events from connected SDK instances
- [ ] **INFRA-03**: Connection status indicator shows connected/disconnected/reconnecting state, project ID, and SDK version
- [ ] **INFRA-04**: Websocket auto-reconnects on disconnect with backoff
- [ ] **INFRA-05**: Dev-tools code is excluded from production builds via separate entry point (`@tambo-ai/react/devtools`) with zero bundle cost when not imported
- [ ] **INFRA-06**: Dev-tools bridge activates only when explicitly opted in (not just dev mode)

### State Inspection

- [ ] **STATE-01**: User can see a list of all threads with name, status (idle/streaming/waiting), and timestamps
- [ ] **STATE-02**: User can select a thread and see all messages with role, content blocks, and timestamps
- [ ] **STATE-03**: User can inspect any content block (text, component, tool_use, tool_result) with full detail
- [ ] **STATE-04**: User can view current streaming state (status, runId, messageId, error) for active threads
- [ ] **STATE-05**: User can expand any nested data structure via a collapsible JSON tree viewer
- [ ] **STATE-06**: Streaming errors, tool call failures, and connection issues are surfaced prominently (not buried in state trees)
- [ ] **STATE-07**: User can filter threads by status and messages by role or content type
- [ ] **STATE-08**: User can search across message content and tool names via text search

### Component Debugging

- [ ] **COMP-01**: User can view all registered components with name, description, and prop schema
- [ ] **COMP-02**: User can view all registered tools with name, description, and input schema
- [ ] **COMP-03**: User can view connected MCP servers and registered resources
- [ ] **COMP-04**: User can see JSON Patch operations as they arrive for a streaming component
- [ ] **COMP-05**: User can see cumulative props/state for a component as patches are applied
- [ ] **COMP-06**: User can see the streaming lifecycle of a component (started -> streaming -> done)

### Streaming & Events

- [ ] **STRM-01**: User can see a chronological timeline of all AG-UI events as they arrive in real-time
- [ ] **STRM-02**: Events in the timeline are timestamped and color-coded by type
- [ ] **STRM-03**: User can click an event in the timeline to see its full payload
- [ ] **STRM-04**: User can see the full tool call lifecycle: start, accumulated args, end, and result
- [ ] **STRM-05**: User can see client-side tool execution status (awaiting input -> executing -> result)
- [ ] **STRM-06**: Timeline handles high-frequency events (per-token deltas) without UI jank

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Interactivity

- **INTX-01**: User can resend a message to retry a failed run
- **INTX-02**: User can cancel a currently streaming run from the dashboard
- **INTX-03**: User can manually trigger a tool with custom arguments
- **INTX-04**: Dashboard communicates commands back to SDK via bidirectional websocket

### Advanced Debugging

- **ADVD-01**: User can see component resolution trace (why AI chose a component, schema validation)
- **ADVD-02**: User can see model reasoning/thinking tokens in real-time
- **ADVD-03**: User can record and replay a streaming session for debugging
- **ADVD-04**: User can view tool-component associations and their resolution logic

## Out of Scope

| Feature                                                        | Reason                                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Full LLM observability (token usage, costs, prompt versioning) | LangSmith/Langfuse territory; Tambo already integrates with Langfuse                    |
| Browser extension                                              | Dashboard-hosted approach keeps dev app clean; extension adds deployment burden         |
| Performance profiler                                           | React DevTools and Chrome DevTools already cover this                                   |
| Visual component editor                                        | Over-engineering for v1; developers have IDEs + hot reload                              |
| Production debugging                                           | Security/auth complexity; existing dashboard shows persisted thread data                |
| Time-travel debugging                                          | Non-deterministic AI state makes replay impractical; event timeline covers 90% of value |
| Embedded in-app panel                                          | Dashboard approach is right for v1 data volume; re-evaluate for v2                      |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| INFRA-01    | —     | Pending |
| INFRA-02    | —     | Pending |
| INFRA-03    | —     | Pending |
| INFRA-04    | —     | Pending |
| INFRA-05    | —     | Pending |
| INFRA-06    | —     | Pending |
| STATE-01    | —     | Pending |
| STATE-02    | —     | Pending |
| STATE-03    | —     | Pending |
| STATE-04    | —     | Pending |
| STATE-05    | —     | Pending |
| STATE-06    | —     | Pending |
| STATE-07    | —     | Pending |
| STATE-08    | —     | Pending |
| COMP-01     | —     | Pending |
| COMP-02     | —     | Pending |
| COMP-03     | —     | Pending |
| COMP-04     | —     | Pending |
| COMP-05     | —     | Pending |
| COMP-06     | —     | Pending |
| STRM-01     | —     | Pending |
| STRM-02     | —     | Pending |
| STRM-03     | —     | Pending |
| STRM-04     | —     | Pending |
| STRM-05     | —     | Pending |
| STRM-06     | —     | Pending |

**Coverage:**

- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26

---

_Requirements defined: 2026-02-11_
_Last updated: 2026-02-11 after initial definition_
