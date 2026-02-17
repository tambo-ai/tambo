# Phase 4: devtools-trigger-fix - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the broken devtools trigger component and connection wiring. The trigger shows connection status, useful stats, and links to the correct dashboard URL. The /devtools page is excluded from the TamboProvider layout so the trigger doesn't render there. Showcase app gets TamboDevTools for end-to-end demo.

</domain>

<decisions>
## Implementation Decisions

### Trigger appearance

- Minimal dot (not a circle with "T" letter)
- Small dot inside a larger invisible/transparent click target button
- Tambo green when connected, gray when disconnected
- Position configurable via prop, defaults to bottom-right
- Inline styles (SDK component, no Tailwind dependency)

### Popover content

- Click to open/close (current behavior)
- Shows: component count, tool count, thread count, active thread, streaming status
- Error count badge on the trigger dot itself (not inline in popover)
- Single action: "Open DevTools" button

### Dashboard linking

- Derive dashboard URL from WS connection (same host, known port mapping: WS 8265 -> dashboard 8260)
- Pass session/client ID as query param: `/devtools?clientId=<sessionId>`
- Opens in new tab (standard `_blank`, not named window)

### Hide behavior

- No detection logic needed in the trigger component
- The `/devtools` page uses a layout that does NOT include TamboProviderWrapper
- This means TamboDevTools (and the trigger) simply aren't mounted on that page

### Claude's Discretion

- Exact dot size and click target dimensions
- Popover visual styling (consistent with current dark theme approach)
- Error badge styling
- Exact port derivation logic

</decisions>

<specifics>
## Specific Ideas

- The dashboard already has a client selector dropdown — the `clientId` query param should pre-select the matching client
- Keep the WS bridge architecture as-is for v1.1 (standalone server on port 8265)

</specifics>

<deferred>
## Deferred Ideas

- **GTM-style debug mode** — Devtools UI as an overlay injected into the developer's site, initiated from the console. Eliminates need for separate dashboard tab. Would work cross-origin via Tambo API relay. Major architecture change — v2.0.
- **Console.tambo.co integration** — Cloud-hosted devtools that connect to local/remote apps. Needs cloud relay for cross-origin communication. Product questions: what value does the console add beyond local devtools? Team debugging? Historical data?
- **Self-hosted parity** — If cloud console integration works, self-hosted should get the same capability. Architecture should be URL-agnostic.

</deferred>

---

_Phase: 04-devtools-trigger-fix_
_Context gathered: 2026-02-16_
