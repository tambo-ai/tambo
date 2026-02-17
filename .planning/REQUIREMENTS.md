# Requirements: Tambo DevTools

**Defined:** 2026-02-16
**Core Value:** Developers can see exactly what's happening inside their Tambo app without resorting to console.log or manual network tab inspection.

## v1.1 Requirements

Requirements for devtools integration fix. Each maps to roadmap phases.

### Provider Wiring

- [ ] **WIRE-01**: TamboDevTools in apps/web provider connects correctly to the WS bridge and sends valid snapshots
- [ ] **WIRE-02**: Showcase app also includes TamboDevTools for end-to-end demo

### Trigger UI

- [ ] **TRIG-01**: Trigger button shows connection status (connected/disconnected) to the WS bridge
- [ ] **TRIG-02**: Trigger popover shows summary stats: component count, tool count, thread count
- [ ] **TRIG-03**: Trigger is hidden when the current page is the devtools dashboard (`/devtools`)
- [ ] **TRIG-04**: "Open DevTools" button links to the correct dashboard URL (not the WS port)
- [ ] **TRIG-05**: "Open DevTools" link includes session/client ID so the dashboard pre-selects the right client

## Out of Scope

| Feature                           | Reason                                  |
| --------------------------------- | --------------------------------------- |
| Bidirectional communication       | v2.0 feature                            |
| Component resolution tracing      | v2.0 feature                            |
| Session recording/replay          | v2.0 feature                            |
| Embedded devtools (non-dashboard) | Architecture decision: dashboard-hosted |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| WIRE-01     | Phase 4 | Pending |
| WIRE-02     | Phase 4 | Pending |
| TRIG-01     | Phase 4 | Pending |
| TRIG-02     | Phase 4 | Pending |
| TRIG-03     | Phase 4 | Pending |
| TRIG-04     | Phase 4 | Pending |
| TRIG-05     | Phase 4 | Pending |

**Coverage:**

- v1.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---

_Requirements defined: 2026-02-16_
_Last updated: 2026-02-16 after initial definition_
