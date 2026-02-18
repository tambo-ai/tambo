---
phase: 04-devtools-trigger-fix
verified: 2026-02-17T08:30:00Z
status: gaps_found
score: 6/7 must-haves verified
gaps:
  - truth: "TamboDevTools in apps/web provider connects correctly to the WS bridge and sends valid snapshots (WIRE-01)"
    status: failed
    reason: "TamboDevTools component is not rendered anywhere in apps/web. TamboProviderWrapper does not include <TamboDevTools />."
    artifacts:
      - path: "apps/web/providers/tambo-provider.tsx"
        issue: "Missing <TamboDevTools /> component inside TamboProvider"
    missing:
      - "Add <TamboDevTools /> to TamboProviderWrapper in apps/web/providers/tambo-provider.tsx"
      - "Import from @tambo-ai/react/devtools"
---

# Phase 04: devtools-trigger-fix Verification Report

**Phase Goal:** Fix trigger UI, correct dashboard URL, add route-aware hiding, show useful stats, wire up showcase.

**Verified:** 2026-02-17T08:30:00Z

**Status:** gaps_found

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                            | Status     | Evidence                                                                                        |
| --- | ------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| 1   | Trigger renders as a minimal green/gray dot, not a circle with T letter                          | ✓ VERIFIED | devtools-trigger.tsx lines 93-103: 12px dot with borderRadius 50%, color based on isConnected   |
| 2   | Clicking dot opens popover showing component count, tool count, thread count, active thread      | ✓ VERIFIED | devtools-trigger.tsx lines 131-208: Popover with stats grid showing all required counts         |
| 3   | Error count badge appears on the dot when errors exist                                           | ✓ VERIFIED | devtools-trigger.tsx lines 105-127: Conditional error badge with errorCount display             |
| 4   | Open DevTools button opens correct dashboard URL (port 8260) with clientId query param           | ✓ VERIFIED | devtools-trigger.tsx line 213: window.open(dashboardUrl, "\_blank"); URL derived with port 8260 |
| 5   | Trigger is not mounted on /devtools page                                                         | ✓ VERIFIED | apps/web/app/(authed)/devtools/layout.tsx does not include TamboProviderWrapper                 |
| 6   | Dashboard auto-selects client when opened with clientId query param                              | ✓ VERIFIED | apps/web/app/(authed)/devtools/page.tsx lines 57-63: useEffect auto-selects matching client     |
| 7   | Showcase app renders TamboDevTools inside TamboProvider                                          | ✓ VERIFIED | showcase/src/app/template.tsx line 94: <TamboDevTools /> inside TamboProvider                   |
| 8   | TamboDevTools in apps/web provider connects correctly to the WS bridge and sends valid snapshots | ✗ FAILED   | TamboDevTools is NOT rendered in apps/web/providers/tambo-provider.tsx - component is missing   |

**Score:** 7/8 truths verified (but requirement WIRE-01 failed)

### Required Artifacts

| Artifact                                      | Expected                                                         | Status     | Details                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `react-sdk/src/devtools/devtools-trigger.tsx` | Redesigned trigger with dot, popover stats, dashboard link       | ✓ VERIFIED | 237 lines, contains SummaryStats interface, dot rendering, popover with stats, window.open call                                    |
| `react-sdk/src/devtools/tambo-dev-tools.tsx`  | Stats computation and dashboard URL derivation passed to trigger | ✓ VERIFIED | 274 lines, contains deriveDashboardUrl function (line 45), getStatsFromSnapshot (line 57), props passed to trigger (lines 267-271) |
| `apps/web/app/(authed)/devtools/page.tsx`     | Query param reading and client auto-selection                    | ✓ VERIFIED | Lines 52-63: useSearchParams reads clientId, useEffect auto-selects matching client                                                |
| `showcase/src/app/template.tsx`               | TamboDevTools integration in showcase                            | ✓ VERIFIED | Line 9: import from @tambo-ai/react/devtools, line 94: <TamboDevTools /> rendered                                                  |
| `apps/web/providers/tambo-provider.tsx`       | TamboDevTools component rendered inside TamboProvider            | ✗ MISSING  | TamboDevTools is NOT imported or rendered anywhere in this file                                                                    |

### Key Link Verification

| From                                        | To                                          | Via                                             | Status      | Details                                                                                   |
| ------------------------------------------- | ------------------------------------------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| react-sdk/src/devtools/tambo-dev-tools.tsx  | react-sdk/src/devtools/devtools-trigger.tsx | props: stats, dashboardUrl, isConnected         | ✓ WIRED     | Lines 267-271: TamboDevToolsTrigger receives all three props                              |
| react-sdk/src/devtools/devtools-trigger.tsx | /devtools?clientId=                         | window.open with derived URL                    | ✓ WIRED     | Line 213: window.open(dashboardUrl, "\_blank") where dashboardUrl includes clientId param |
| apps/web/app/(authed)/devtools/page.tsx     | useDevtoolsConnection                       | setSelectedSessionId from clientId search param | ✓ WIRED     | Lines 52-63: searchParams.get("clientId"), useEffect calls setSelectedSessionId           |
| apps/web/providers/tambo-provider.tsx       | TamboDevTools component                     | Should render <TamboDevTools /> inside provider | ✗ NOT_WIRED | TamboDevTools is not imported or rendered in this file                                    |

### Requirements Coverage

| Requirement | Source Plan  | Description                                                        | Status      | Evidence                                                                                           |
| ----------- | ------------ | ------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------- |
| WIRE-01     | 04-01-PLAN   | TamboDevTools in apps/web provider connects correctly to WS bridge | ✗ BLOCKED   | TamboDevTools not rendered in apps/web/providers/tambo-provider.tsx                                |
| WIRE-02     | 04-02-PLAN   | Showcase app includes TamboDevTools                                | ✓ SATISFIED | showcase/src/app/template.tsx line 94: <TamboDevTools />                                           |
| TRIG-01     | 04-01-PLAN   | Trigger shows connection status                                    | ✓ SATISFIED | devtools-trigger.tsx lines 52-54: dot color changes based on isConnected (green/gray)              |
| TRIG-02     | 04-01-PLAN   | Trigger popover shows summary stats                                | ✓ SATISFIED | devtools-trigger.tsx lines 176-207: Stats grid with component/tool/thread counts, streaming status |
| TRIG-03     | 04-01-PLAN   | Trigger hidden on /devtools page                                   | ✓ SATISFIED | apps/web/app/(authed)/devtools/layout.tsx does not include TamboProviderWrapper                    |
| TRIG-04     | 04-01-PLAN   | "Open DevTools" links to dashboard URL                             | ✓ SATISFIED | devtools-trigger.tsx line 213: window.open(dashboardUrl) where URL is http://host:8260/devtools    |
| TRIG-05     | 04-01, 04-02 | Link includes clientId query param; dashboard auto-selects         | ✓ SATISFIED | Dashboard URL includes clientId (line 47 in tambo-dev-tools.tsx); dashboard reads and auto-selects |

### Anti-Patterns Found

| File                                  | Line | Pattern                         | Severity   | Impact                                                         |
| ------------------------------------- | ---- | ------------------------------- | ---------- | -------------------------------------------------------------- |
| apps/web/providers/tambo-provider.tsx | N/A  | Missing TamboDevTools component | 🛑 Blocker | WIRE-01 requirement cannot be satisfied without this component |

### Human Verification Required

#### 1. Visual Appearance of Trigger Dot

**Test:** Open apps/web in browser with devtools enabled, verify trigger appears as minimal green dot (when connected) in bottom-right corner

**Expected:** 12px green dot (#22c55e) centered in 48px transparent click target, not a circle with "T" letter

**Why human:** Visual design and size cannot be verified programmatically

#### 2. Popover Stats Accuracy

**Test:** Open trigger popover, register several components and tools, create threads, verify counts match reality

**Expected:** Component count, tool count, thread count all accurately reflect registered items; active thread name displays when streaming

**Why human:** Requires running app with live SDK connection and verifying data accuracy

#### 3. Dashboard Client Auto-Selection

**Test:** Click "Open DevTools" button in trigger popover, verify new tab opens to /devtools with correct clientId param and pre-selects that client

**Expected:** Dashboard opens at http://localhost:8260/devtools?clientId=<sessionId> and client dropdown automatically selects the matching client

**Why human:** Requires end-to-end flow with browser tabs and URL navigation

#### 4. Error Badge Appearance

**Test:** Trigger error condition in SDK, verify red error badge appears on trigger dot with count

**Expected:** Red circle (#ef4444) positioned top-right of dot, showing error count in white text

**Why human:** Visual appearance and positioning of badge cannot be verified programmatically

#### 5. Showcase Integration

**Test:** Run showcase app (npm run dev in showcase/), verify trigger appears and connects to devtools bridge

**Expected:** Green dot appears in bottom-right of showcase app, clicking opens popover with stats, "Open DevTools" links to dashboard

**Why human:** Requires running showcase dev server and testing full connection flow

### Gaps Summary

**Critical Gap:** WIRE-01 requirement states "TamboDevTools in apps/web provider connects correctly to the WS bridge and sends valid snapshots", but the TamboDevTools component is not rendered anywhere in apps/web.

The TamboProviderWrapper in `apps/web/providers/tambo-provider.tsx` wraps children with TamboProvider but does not include the `<TamboDevTools />` component. This means:

1. The devtools trigger does not appear on any apps/web pages (except the /devtools dashboard page, which should not have it anyway)
2. The WS bridge connection is never established from apps/web
3. No snapshots are emitted from apps/web to the devtools dashboard

**Root Cause:** The 04-01-PLAN assumed "WIRE-01 is satisfied by existing code" based on the 04-RESEARCH.md claim that "TamboProviderWrapper already includes TamboDevTools", but this was incorrect. The research was mistaken about the current state of the code.

**What's Working:**

- Trigger component is fully implemented with correct UI (dot, popover, stats)
- Dashboard URL derivation is correct (port 8260 with clientId param)
- Dashboard auto-selection works correctly
- Showcase integration is complete and correct
- Trigger is correctly excluded from /devtools page via layout

**What's Missing:**

- `<TamboDevTools />` component needs to be added to apps/web/providers/tambo-provider.tsx

---

_Verified: 2026-02-17T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
