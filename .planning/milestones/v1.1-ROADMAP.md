# Roadmap: Tambo DevTools

## Completed Milestones

- **v1.0** — WebSocket bridge, inspection panels, streaming visibility (3 phases, 9 plans) — [archive](milestones/v1.0-ROADMAP.md)

## Current Milestone: v1.1 — DevTools Integration Fix

**Goal:** Fix the broken devtools trigger and connection so the SDK-to-dashboard bridge actually works.

### Phase 4: devtools-trigger-fix

**Goal:** Fix trigger UI, correct dashboard URL, add route-aware hiding, show useful stats, wire up showcase.

**Depends on:** v1.0 (shipped)

**Requirements:** WIRE-01, WIRE-02, TRIG-01, TRIG-02, TRIG-03, TRIG-04, TRIG-05

**Success Criteria:**

1. TamboDevTools in apps/web connects to WS bridge and sends snapshots
2. Trigger popover shows component count, tool count, thread count, and connection status
3. Trigger is not visible on the `/devtools` page
4. "Open DevTools" opens the dashboard at the correct URL with the right client pre-selected
5. Showcase app has TamboDevTools and connects to the bridge when dev server is running

**Plans:** 2 plans

Plans:

- [ ] 04-01-PLAN.md — Redesign trigger with dot UI, stats popover, and correct dashboard URL
- [ ] 04-02-PLAN.md — Dashboard clientId auto-selection and showcase integration
