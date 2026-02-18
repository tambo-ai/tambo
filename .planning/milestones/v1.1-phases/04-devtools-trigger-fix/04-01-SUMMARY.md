---
phase: 04-devtools-trigger-fix
plan: 01
subsystem: react-sdk/devtools
tags: [trigger, popover, stats, dashboard-url]
dependency-graph:
  requires: []
  provides: [SummaryStats, deriveDashboardUrl, dot-trigger]
  affects: [devtools-trigger.tsx, tambo-dev-tools.tsx]
tech-stack:
  added: []
  patterns: [inline-styles, useMemo-stats, module-level-helpers]
key-files:
  created: []
  modified:
    - react-sdk/src/devtools/devtools-trigger.tsx
    - react-sdk/src/devtools/tambo-dev-tools.tsx
decisions:
  - "Used Record-based Object.keys().length for registry counts since ComponentRegistry and TamboToolRegistry are Record types, not arrays"
  - "Dashboard URL hardcodes port 8260 (Tambo Cloud web app port) rather than deriving from WS port"
  - "Error count is hardcoded to 0 pending future error tracking infrastructure"
metrics:
  duration: 4m
  completed: 2026-02-17
---

# Phase 04 Plan 01: Devtools Trigger Redesign Summary

Minimal dot trigger with stats popover replacing circle-with-T, correct dashboard URL on port 8260 with clientId query param.

## What Was Done

### Task 1: Redesign trigger component (c0862cd79)

Completely rewrote `TamboDevToolsTrigger`:

- 48px transparent button with 12px colored dot (green connected, gray disconnected)
- Error count badge (red circle) on dot when `errorCount > 0`
- Popover with connection status, component/tool/thread counts, active thread, streaming status
- "Open DevTools" button calls `window.open(dashboardUrl, '_blank')` (no named window, no noopener)
- Position configurable via prop, all inline styles
- Exported `SummaryStats` interface and named `TamboDevToolsTrigger` export

### Task 2: Wire stats and dashboard URL (147cf82fd)

Updated `TamboDevTools` to compute and pass stats/URL:

- `deriveDashboardUrl()` builds `http://{host}:8260/devtools?clientId={sessionId}`
- `getStatsFromSnapshot()` computes counts from registry Records and streaming status from threadMap
- Both computed via `useMemo` for render efficiency
- Removed `port` prop from trigger, replaced with `stats` and `dashboardUrl`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Registry types are Records, not arrays**

- **Found during:** Task 2
- **Issue:** Plan assumed `registry.componentList.length` but `ComponentRegistry` and `TamboToolRegistry` are `Record<string, unknown>` types
- **Fix:** Used `Object.keys(registry.componentList).length` instead
- **Files modified:** react-sdk/src/devtools/tambo-dev-tools.tsx
- **Commit:** 147cf82fd

**2. [Rule 3 - Blocking] Unused DEVTOOLS_DEFAULT_PORT import**

- **Found during:** Task 2
- **Issue:** Lint error from importing `DEVTOOLS_DEFAULT_PORT` which was no longer used after removing `port` prop passthrough
- **Fix:** Removed the import
- **Files modified:** react-sdk/src/devtools/tambo-dev-tools.tsx
- **Commit:** 147cf82fd

## Verification

- `npm run check-types -w react-sdk`: PASSED
- `npm run build -w react-sdk`: PASSED (CJS + ESM)
- `npm run lint -w react-sdk`: PASSED (0 errors)

## Self-Check: PASSED
