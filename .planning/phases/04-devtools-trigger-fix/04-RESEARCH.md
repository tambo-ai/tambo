# Phase 4: devtools-trigger-fix - Research

**Researched:** 2026-02-17
**Domain:** React devtools UI, WebSocket client state, Next.js layout routing
**Confidence:** HIGH

## Summary

This phase fixes the broken devtools trigger component and connection wiring. Current implementation has several issues: trigger shows wrong UI (circle with "T" letter instead of minimal dot), links to WebSocket port instead of dashboard, no route-aware hiding, and missing showcase integration.

Key findings: React inline style patterns are straightforward, WebSocket URL parsing requires manual host/port derivation, Next.js route groups already handle layout exclusion via `/devtools/layout.tsx`. Badge positioning follows standard absolute/relative pattern. No external dependencies needed — all can be achieved with plain React and inline CSS.

**Primary recommendation:** Redesign trigger as minimal dot with invisible click target, derive dashboard URL from WebSocket connection URL (known port mapping: WS 8265 → dashboard 8260), pass sessionId as query param, show summary stats from existing snapshot data.

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

**Trigger appearance:**

- Minimal dot (not a circle with "T" letter)
- Small dot inside a larger invisible/transparent click target button
- Tambo green when connected, gray when disconnected
- Position configurable via prop, defaults to bottom-right
- Inline styles (SDK component, no Tailwind dependency)

**Popover content:**

- Click to open/close (current behavior)
- Shows: component count, tool count, thread count, active thread, streaming status
- Error count badge on the trigger dot itself (not inline in popover)
- Single action: "Open DevTools" button

**Dashboard linking:**

- Derive dashboard URL from WS connection (same host, known port mapping: WS 8265 → dashboard 8260)
- Pass session/client ID as query param: `/devtools?clientId=<sessionId>`
- Opens in new tab (standard `_blank`, not named window)

**Hide behavior:**

- No detection logic needed in the trigger component
- The `/devtools` page uses a layout that does NOT include TamboProviderWrapper
- This means TamboDevTools (and the trigger) simply aren't mounted on that page

### Claude's Discretion

- Exact dot size and click target dimensions
- Popover visual styling (consistent with current dark theme approach)
- Error badge styling
- Exact port derivation logic
  </user_constraints>

## Phase Requirements

<phase_requirements>
| ID | Description | Research Support |
|----|-------------|-----------------|
| WIRE-01 | TamboDevTools in apps/web provider connects correctly to WS bridge | Current DevToolsBridge class already implements WebSocket connection; TamboProviderWrapper already includes TamboDevTools; bridge sends snapshots via serializeForDevtools |
| WIRE-02 | Showcase app includes TamboDevTools | Showcase uses TamboProvider in template.tsx; need to import and add TamboDevTools component |
| TRIG-01 | Trigger shows connection status | DevToolsBridge tracks isConnected boolean; passed to trigger via prop; need visual indicator (dot color) |
| TRIG-02 | Trigger popover shows summary stats | StateSnapshot already includes threads, registry with components/tools; can derive counts from snapshot |
| TRIG-03 | Trigger hidden on /devtools page | apps/web/app/(authed)/devtools/layout.tsx doesn't include TamboProviderWrapper; trigger won't mount |
| TRIG-04 | "Open DevTools" links to dashboard URL | Need to derive from WebSocket URL; WS on 8265 → dashboard on 8260; use window.location.origin or parse ws.url |
| TRIG-05 | Link includes clientId query param | TamboDevTools has sessionId from sessionIdRef; pass to trigger, append to URL |
</phase_requirements>

## Standard Stack

### Core

| Library              | Version    | Purpose                     | Why Standard                                                   |
| -------------------- | ---------- | --------------------------- | -------------------------------------------------------------- |
| React                | 18+        | UI framework                | Already peer dependency of @tambo-ai/react SDK                 |
| partysocket          | (existing) | WebSocket with reconnection | Already used in DevToolsBridge for reliable connections        |
| None (inline styles) | N/A        | Component styling           | SDK components avoid external CSS dependencies for portability |

### Supporting

| Library               | Version  | Purpose               | When to Use                                    |
| --------------------- | -------- | --------------------- | ---------------------------------------------- |
| crypto.randomUUID()   | Node 22+ | Session ID generation | Already used in TamboDevTools for sessionId    |
| URL / URLSearchParams | Native   | URL manipulation      | Standard browser APIs for query param handling |

### Alternatives Considered

| Instead of         | Could Use         | Tradeoff                                                           |
| ------------------ | ----------------- | ------------------------------------------------------------------ |
| Inline styles      | Tailwind CSS      | Tailwind requires build-time processing and creates SDK dependency |
| Manual URL parsing | URL constructor   | URL constructor is the standard — no alternative needed            |
| Fixed positioning  | Portal + absolute | Fixed is simpler for trigger that's always on screen               |

**Installation:**
No new dependencies required. All functionality achievable with existing SDK dependencies and browser APIs.

## Architecture Patterns

### Recommended Component Structure

```
react-sdk/src/devtools/
├── devtools-trigger.tsx     # Trigger UI (redesign needed)
├── tambo-dev-tools.tsx      # Container component (wire stats)
├── devtools-bridge.ts       # WebSocket client (existing, works)
└── devtools-protocol.ts     # Type definitions (existing)
```

### Pattern 1: Trigger with Invisible Click Target

**What:** Small visual dot inside larger transparent button for better touch/click area
**When to use:** Mobile-friendly UI triggers that need large hit targets but small visual footprint

**Example:**

```typescript
// Minimal dot with large click target
<button
  style={{
    position: 'fixed',
    bottom: 16,
    right: 16,
    width: 48,           // Large click target
    height: 48,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {/* Visual dot - small */}
  <span
    style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: isConnected ? '#22c55e' : '#6b7280',
      position: 'relative',
    }}
  >
    {/* Error badge if needed */}
    {errorCount > 0 && (
      <span
        style={{
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#ef4444',
          color: 'white',
          fontSize: 10,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
        }}
      >
        {errorCount}
      </span>
    )}
  </span>
</button>
```

### Pattern 2: Deriving Dashboard URL from WebSocket Connection

**What:** Extract host from WebSocket URL and map WS port to dashboard port
**When to use:** When dashboard and WebSocket server are co-located but on different ports

**Example:**

```typescript
// In TamboDevTools: extract WS URL components
function getDashboardUrl(wsUrl: string, sessionId: string): string {
  // WebSocket URL format: ws://localhost:8265
  const url = new URL(wsUrl.replace('ws://', 'http://'));
  const host = url.hostname;

  // Known port mapping: WS 8265 → Dashboard 8260
  const dashboardPort = 8260;

  return `http://${host}:${dashboardPort}/devtools?clientId=${sessionId}`;
}

// Pass dashboard URL to trigger
<TamboDevToolsTrigger
  dashboardUrl={dashboardUrl}
  // ... other props
/>
```

### Pattern 3: Summary Stats from Snapshot

**What:** Derive display statistics from existing StateSnapshot structure
**When to use:** Showing aggregate counts without additional API calls

**Example:**

```typescript
// In TamboDevTools: calculate stats from snapshot
interface SummaryStats {
  componentCount: number;
  toolCount: number;
  threadCount: number;
  activeThread?: string;
  isStreaming: boolean;
  errorCount: number;
}

function getStatsFromSnapshot(snapshot?: StateSnapshot): SummaryStats {
  if (!snapshot) {
    return {
      componentCount: 0,
      toolCount: 0,
      threadCount: 0,
      isStreaming: false,
      errorCount: 0,
    };
  }

  const streamingThread = snapshot.threads.find(
    (t) => t.status === "streaming",
  );

  return {
    componentCount: snapshot.registry.components.length,
    toolCount: snapshot.registry.tools.length,
    threadCount: snapshot.threads.length,
    activeThread: streamingThread?.name ?? streamingThread?.id,
    isStreaming: streamingThread !== undefined,
    errorCount: snapshot.errors?.length ?? 0,
  };
}
```

### Pattern 4: Next.js Layout Exclusion via Route Groups

**What:** Use dedicated layout.tsx in route group to exclude parent providers
**When to use:** When specific routes need different layout/provider tree than siblings
**Current state:** Already implemented at `apps/web/app/(authed)/devtools/layout.tsx`

**Example:**

```typescript
// apps/web/app/(authed)/devtools/layout.tsx
// This layout does NOT include TamboProviderWrapper
export default function DevtoolsLayout({ children }: DevtoolsLayoutProps) {
  return (
    <DashboardThemeProvider defaultTheme="light">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto px-4 py-6 md:px-6">{children}</div>
      </div>
    </DashboardThemeProvider>
  );
}

// vs. apps/web/app/(authed)/(dashboard)/layout.tsx
// This layout DOES include TamboProviderWrapper (via parent layout)
// So /devtools won't render TamboDevTools at all
```

### Pattern 5: Query Param for Client Selection

**What:** Dashboard reads `clientId` from URL search params to pre-select SDK client
**When to use:** Deep linking into multi-client dashboard views

**Example:**

```typescript
// Dashboard page (apps/web/app/(authed)/devtools/page.tsx)
// Add useSearchParams to read query param
"use client";
import { useSearchParams } from "next/navigation";

export default function DevtoolsPage() {
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId");

  const {
    selectedSessionId,
    setSelectedSessionId,
    // ... other state
  } = useDevtoolsConnection();

  // Auto-select client from URL on mount
  useEffect(() => {
    if (clientIdFromUrl && !selectedSessionId) {
      setSelectedSessionId(clientIdFromUrl);
    }
  }, [clientIdFromUrl, selectedSessionId, setSelectedSessionId]);

  // ... rest of component
}
```

### Anti-Patterns to Avoid

- **Hardcoded URLs:** Never hardcode `http://localhost:8260` — derive from WebSocket URL so it works on any host
- **Global state for trigger:** Trigger should receive all data via props from TamboDevTools
- **Complex CSS dependencies:** SDK components must remain portable — use inline styles only
- **Detection logic in trigger:** Layout routing handles hiding; trigger shouldn't check `window.location`

## Don't Hand-Roll

| Problem                | Don't Build                 | Use Instead                               | Why                                                                |
| ---------------------- | --------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| WebSocket reconnection | Custom retry logic          | partysocket (existing)                    | Handles exponential backoff, connection lifecycle, edge cases      |
| URL parsing            | String manipulation         | URL constructor                           | Native API handles all edge cases (ports, protocols, query params) |
| Popover positioning    | Custom absolute positioning | Fixed positioning with calculated offsets | Simpler and more reliable for fixed-position trigger               |
| Query param encoding   | Manual string concat        | URLSearchParams                           | Native API handles encoding, special characters                    |

**Key insight:** Browser APIs have matured significantly — URL, URLSearchParams, crypto.randomUUID() all handle edge cases better than hand-rolled solutions.

## Common Pitfalls

### Pitfall 1: Mixing WS and HTTP URLs

**What goes wrong:** Clicking "Open DevTools" tries to open `ws://localhost:8265` in browser, which fails
**Why it happens:** WebSocket URL is stored in bridge, but dashboard needs HTTP URL
**How to avoid:** Convert protocol and map ports during URL derivation
**Warning signs:** Browser console shows "Invalid URL" or navigation fails silently

**Prevention:**

```typescript
// Wrong: using WS URL directly
window.open(`ws://localhost:8265`); // ❌ Browser can't open WS URLs

// Correct: derive HTTP URL with port mapping
const wsUrl = "ws://localhost:8265";
const httpUrl = wsUrl.replace("ws://", "http://").replace(":8265", ":8260");
window.open(httpUrl); // ✅ Opens dashboard
```

### Pitfall 2: Badge Overlapping Popover

**What goes wrong:** Error badge on dot extends beyond button bounds, gets cut off or overlaps popover
**Why it happens:** Absolute positioning without accounting for overflow
**How to avoid:** Use relative positioning on button, ensure badge stays within overflow: visible
**Warning signs:** Badge appears clipped or disappears when popover opens

**Prevention:**

```typescript
// Ensure button doesn't clip badge
<button style={{ overflow: 'visible' /* not 'hidden' */ }}>
  <span style={{ position: 'relative' /* not 'absolute' */ }}>
    {/* Badge positioned relative to dot */}
    <span style={{ position: 'absolute', top: -4, right: -4 }}>
      {errorCount}
    </span>
  </span>
</button>
```

### Pitfall 3: Stale Stats in Popover

**What goes wrong:** Popover shows outdated counts when snapshot updates
**Why it happens:** Not deriving stats from current snapshot prop
**How to avoid:** Always compute stats from latest snapshot prop, not cached state
**Warning signs:** Count stays at 0 or doesn't update when threads/components change

**Prevention:**

```typescript
// Wrong: computing stats once on mount
const [stats] = useState(() => computeStats(snapshot)); // ❌ Stale

// Correct: deriving from current prop
const stats = useMemo(() => computeStats(snapshot), [snapshot]); // ✅ Always current
```

### Pitfall 4: Missing Query Param Encoding

**What goes wrong:** Session IDs with special characters break URL
**Why it happens:** Manual string concatenation doesn't encode values
**How to avoid:** Use URLSearchParams for all query param manipulation
**Warning signs:** Dashboard doesn't pre-select client when clicking "Open DevTools"

**Prevention:**

```typescript
// Wrong: manual concatenation
const url = `http://localhost:8260/devtools?clientId=${sessionId}`; // ❌ Breaks if sessionId has &, =, etc.

// Correct: using URLSearchParams
const url = new URL("http://localhost:8260/devtools");
url.searchParams.set("clientId", sessionId); // ✅ Automatically encodes
window.open(url.toString());
```

### Pitfall 5: Trigger Mounting on /devtools Page

**What goes wrong:** Trigger appears on dashboard, clicking it opens another tab with same dashboard (recursion)
**Why it happens:** TamboProviderWrapper mounted on /devtools route
**How to avoid:** Verify layout.tsx at devtools route does NOT include TamboProviderWrapper
**Warning signs:** Trigger visible on dashboard page, infinite tab spawning possible

**Prevention:**

```typescript
// apps/web/app/(authed)/devtools/layout.tsx
// Must NOT include TamboProviderWrapper
export default function DevtoolsLayout({ children }) {
  return (
    <DashboardThemeProvider>
      {children} {/* ✅ No TamboProviderWrapper = No trigger */}
    </DashboardThemeProvider>
  );
}
```

## Code Examples

Verified patterns from existing codebase and web standards:

### Trigger Visual Structure

```typescript
// Source: React inline styles pattern + Material Design FAB sizing
// Recommendation: 12px dot, 48px click target, Tambo green #22c55e
interface TamboDevToolsTriggerProps {
  isConnected: boolean;
  stats: SummaryStats;
  dashboardUrl: string;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
}

function TamboDevToolsTrigger({
  isConnected,
  stats,
  dashboardUrl,
  position = { bottom: 16, right: 16 }
}: TamboDevToolsTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dotColor = isConnected ? '#22c55e' : '#6b7280';
  const hasErrors = stats.errorCount > 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          ...position,
          width: 48,
          height: 48,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Tambo DevTools"
      >
        <span
          style={{
            position: 'relative',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: dotColor,
            transition: 'background-color 0.2s',
          }}
        >
          {hasErrors && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: 10,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #1a1a2e',
              }}
            >
              {stats.errorCount}
            </span>
          )}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 72,
            right: 16,
            zIndex: 9999,
            backgroundColor: '#1a1a2e',
            border: '1px solid #2a2a4a',
            borderRadius: 8,
            padding: 16,
            minWidth: 240,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            fontFamily: 'system-ui, sans-serif',
            color: '#e2e8f0',
            fontSize: 13,
          }}
        >
          {/* Popover content - see next example */}
        </div>
      )}
    </>
  );
}
```

### Popover Content with Stats

```typescript
// Source: Existing devtools-trigger.tsx structure + new stats requirements
// Inside popover div:
<>
  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
    Tambo DevTools
  </div>

  {/* Connection status */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: dotColor,
      }}
    />
    <span style={{ color: '#94a3b8' }}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  </div>

  {/* Stats grid */}
  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', marginBottom: 16 }}>
    <span style={{ color: '#64748b' }}>Components:</span>
    <span style={{ fontWeight: 500 }}>{stats.componentCount}</span>

    <span style={{ color: '#64748b' }}>Tools:</span>
    <span style={{ fontWeight: 500 }}>{stats.toolCount}</span>

    <span style={{ color: '#64748b' }}>Threads:</span>
    <span style={{ fontWeight: 500 }}>{stats.threadCount}</span>

    {stats.activeThread && (
      <>
        <span style={{ color: '#64748b' }}>Active:</span>
        <span style={{ fontWeight: 500 }}>{stats.activeThread}</span>
      </>
    )}

    <span style={{ color: '#64748b' }}>Streaming:</span>
    <span style={{ fontWeight: 500 }}>{stats.isStreaming ? 'Yes' : 'No'}</span>
  </div>

  {/* Action button */}
  <button
    type="button"
    onClick={() => window.open(dashboardUrl, '_blank')}
    style={{
      width: '100%',
      padding: '8px 12px',
      backgroundColor: '#7c3aed',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: 13,
    }}
  >
    Open DevTools
  </button>
</>
```

### Dashboard URL Derivation

```typescript
// Source: URL constructor + known port mapping
// In TamboDevTools component:
function deriveDashboardUrl(
  wsHost: string,
  wsPort: number,
  sessionId: string,
): string {
  // Known port mapping: WS 8265 → Dashboard 8260
  const DASHBOARD_PORT = 8260;

  // Construct base URL
  const url = new URL(`http://${wsHost}:${DASHBOARD_PORT}/devtools`);

  // Add session ID as query param
  url.searchParams.set("clientId", sessionId);

  return url.toString();
}

// Usage in TamboDevTools:
const dashboardUrl = useMemo(() => {
  const wsHost = host ?? DEVTOOLS_DEFAULT_HOST;
  const wsPort = port ?? DEVTOOLS_DEFAULT_PORT;
  return deriveDashboardUrl(wsHost, wsPort, sessionIdRef.current);
}, [host, port]);
```

### Dashboard Client Auto-Selection

```typescript
// Source: Next.js useSearchParams pattern
// In apps/web/app/(authed)/devtools/page.tsx:
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function DevtoolsPage() {
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId");

  const {
    clients,
    selectedSessionId,
    setSelectedSessionId,
    // ... other state
  } = useDevtoolsConnection();

  // Auto-select client from URL query param
  useEffect(() => {
    if (!clientIdFromUrl) return;

    // Only set if client exists and nothing selected yet
    const clientExists = clients.some((c) => c.sessionId === clientIdFromUrl);
    if (clientExists && !selectedSessionId) {
      setSelectedSessionId(clientIdFromUrl);
    }
  }, [clientIdFromUrl, clients, selectedSessionId, setSelectedSessionId]);

  // ... rest of component
}
```

### Showcase Integration

```typescript
// Source: showcase/src/app/template.tsx pattern
// Add to showcase template after TamboProvider:
import { TamboProvider } from "@tambo-ai/react";
import { TamboDevTools } from "@tambo-ai/react/devtools";

export default function Template({ children }) {
  // ... existing code

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
      // ... other props
    >
      <div className="container mx-auto px-4 md:px-6 pt-6">
        {children}
      </div>
      <TamboDevTools />
    </TamboProvider>
  );
}
```

## State of the Art

| Old Approach            | Current Approach               | When Changed         | Impact                                                     |
| ----------------------- | ------------------------------ | -------------------- | ---------------------------------------------------------- |
| Circle with "T" letter  | Minimal dot indicator          | 2026-02 (this phase) | Less visual clutter, consistent with dev tools UX patterns |
| Link to WS port (8265)  | Derive dashboard URL (8260)    | 2026-02 (this phase) | Clicking trigger actually opens working dashboard          |
| No route hiding         | Layout-based exclusion         | Already implemented  | Trigger correctly hidden on /devtools page                 |
| No stats display        | Show counts + streaming status | 2026-02 (this phase) | Developers can see app state at a glance                   |
| No client pre-selection | Query param auto-select        | 2026-02 (this phase) | Deep linking works, no manual client selection needed      |

**Current state of devtools patterns:**

- **Browser DevTools:** Use minimal fixed-position indicators (React DevTools: small icon, Vue DevTools: colored dot)
- **Third-party tools:** Vercel toolbar, PostHog — all use small corner indicators with popovers
- **WebSocket URL patterns:** Standard is to derive HTTP URL from WS URL for related services

**Deprecated/outdated:**

- Named window targets (`window.open(url, 'name')`) — browsers now treat these as regular `_blank` for security
- Manual URL encoding with `encodeURIComponent` — URLSearchParams is the modern standard

## Open Questions

1. **Should error badge show on disconnected state?**
   - What we know: Errors can accumulate while disconnected
   - What's unclear: Whether badge should persist or clear on disconnect
   - Recommendation: Show badge regardless of connection state — errors are still relevant even if disconnected

2. **Should popover auto-close when clicking "Open DevTools"?**
   - What we know: User clicked button, new tab opening
   - What's unclear: Expected UX after button click
   - Recommendation: Keep popover open — user might want to click button again or check stats

3. **Position prop flexibility — which positions should be supported?**
   - What we know: Default is bottom-right, position should be configurable
   - What's unclear: Full positioning API (all corners? arbitrary coordinates?)
   - Recommendation: Support `{ bottom?, right?, top?, left? }` object — allows any corner positioning

4. **Should trigger pulse/animate when streaming?**
   - What we know: Streaming status is in stats
   - What's unclear: Whether animation adds value or is distracting
   - Recommendation: No animation for v1.1 — keep it minimal, add in future if users request

## Sources

### Primary (HIGH confidence)

- Existing codebase: react-sdk/src/devtools/\*.tsx — Current implementation patterns
- Existing codebase: apps/web/app/(authed)/devtools/layout.tsx — Layout exclusion pattern
- Browser API documentation: URL, URLSearchParams — Standard JavaScript APIs

### Secondary (MEDIUM confidence)

- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — Layout isolation patterns
- [How to Exclude a Page from Next.js Layout](https://medium.com/@arpittyagi102/how-to-exclude-a-page-from-a-next-js-app-router-layout-3-simple-methods-b0a812af72c7) — Multiple approaches verified
- [Material UI Badge positioning](https://mui.com/material-ui/react-badge/) — Standard badge placement patterns
- [WebSocket Complete Guide](https://devtoolbox.dedyn.io/blog/websocket-complete-guide) — WebSocket URL patterns

### Tertiary (LOW confidence)

- [react-floating-buttons](https://github.com/AM-77/react-floating-buttons) — Zero-dependency floating UI patterns (not used, but validates inline style approach)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - No new dependencies, existing tools sufficient
- Architecture: HIGH - Patterns verified in existing codebase and official docs
- Pitfalls: HIGH - Based on actual implementation issues and web standards

**Research date:** 2026-02-17
**Valid until:** ~2026-03-17 (30 days for stable web APIs and React patterns)
