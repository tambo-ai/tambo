---
title: "feat: Add Tambo DevTools panel"
type: feat
status: completed
date: 2026-03-03
deepened: 2026-03-03
origin: devdocs/brainstorms/2026-03-03-tambo-devtools-brainstorm.md
---

# feat: Add Tambo DevTools panel

## Enhancement Summary

**Deepened on:** 2026-03-03
**Research agents used:** best-practices-researcher, architecture-strategist, code-simplicity-reviewer

### Key Improvements

1. **Build system**: Switched from tsc dual-build to `@tambo-ai/vite-config` (matches `react-ui-base` pattern, single tsconfig, `vite build` script)
2. **Data access**: Switched from `useTambo()` to `useTamboRegistry()` — avoids subscribing to thread/stream state the devtools doesn't need, preventing unnecessary re-renders
3. **Simplified structure**: Reduced from ~16 files to ~10. Collapsed 5 phases to 3. Cut premature configurability (position, zIndex props deferred). Merged duplicate components.
4. **Portal pattern**: Added SSR guard, singleton duplicate detection, and event bubbling considerations
5. **localStorage**: Use `useSyncExternalStore` for correct concurrent rendering + cross-tab sync instead of naive `useState`+`useEffect`
6. **Resize**: Use Pointer Events + `setPointerCapture` instead of mouse events (handles fast cursor movement, unified touch/mouse)
7. **Provider detection**: Added sentinel-based context detection since default context values prevent naive "outside provider" checks

### New Considerations Discovered

- `useTambo()` subscribes to ALL state (threads, streaming, messages) — way too heavy for a read-only registry inspector
- `TamboRegistryContext` has default values (empty registries, no-op functions) so `useContext` never returns undefined — need explicit sentinel for provider detection
- The `@tambo-ai/vite-config` package handles `"use client"` directive preservation via `rollup-plugin-preserve-directives`, dual ESM/CJS output, and type declarations automatically
- Exporting `useTamboRegistry` also gives us `componentToolAssociations` for free — can include in MVP at zero extra cost

---

## Overview

A floating DevTools panel for Tambo that surfaces registered components and tools at runtime. Ships as a separate `@tambo-ai/devtools` package. Follows the TanStack React Query DevTools pattern: a floating trigger button that opens a resizable panel with tabs for inspecting registry contents.

(see brainstorm: devdocs/brainstorms/2026-03-03-tambo-devtools-brainstorm.md)

## Problem Statement

Tambo's component and tool registries are invisible at runtime. When components or tools don't appear in AI responses, developers have no way to verify what's actually registered, what schemas are configured, or which tools are associated with which components. This makes debugging registration issues a guessing game.

## Proposed Solution

A `<TamboDevtools />` component that renders a floating panel inside the host app. Place it anywhere inside `<TamboProvider>` and it reads from `useTamboRegistry()`.

### Usage

```tsx
import { TamboDevtools } from "@tambo-ai/devtools";

<TamboProvider apiKey="...">
  <App />
  <TamboDevtools />
</TamboProvider>;
```

### Component API

```typescript
interface TamboDevtoolsProps {
  /** Whether the panel starts open. Default: false */
  initialOpen?: boolean;
}
```

Keep the API minimal for MVP. `position` (corner selection), `zIndex`, and `defaultTab` can be added when someone requests them.

## Technical Approach

### Package Structure

New package at `packages/devtools/` (auto-discovered by `packages/*` workspace glob):

```
packages/devtools/
├── package.json
├── tsconfig.json               # Single tsconfig extending react-library.json
├── vite.config.ts              # Uses @tambo-ai/vite-config
├── jest.config.ts
├── src/
│   ├── index.ts                # Dev entry (returns null in production)
│   ├── production.ts           # Production entry (always renders)
│   ├── tambo-devtools.tsx      # Main component (trigger button inlined)
│   ├── tambo-devtools.test.tsx
│   ├── devtools-panel.tsx      # Panel container + tabs (portal, resize)
│   ├── registry-list.tsx       # Shared list view for both tabs
│   ├── schema-view.tsx         # JSON Schema display (<pre> for MVP)
│   ├── schema-view.test.tsx
│   ├── use-panel-state.ts      # Open/close, tab, color scheme, localStorage
│   ├── use-panel-state.test.ts
│   ├── use-resize.ts           # Pointer-event drag-to-resize
│   ├── styles.ts               # Flat inline style objects (light + dark)
│   └── tambo-icon.tsx          # Simplified Tambo logo SVG
```

### Build System (Vite via `@tambo-ai/vite-config`)

Following `react-ui-base` as the reference pattern.

**`vite.config.ts`:**

```typescript
import { tamboViteConfig } from "@tambo-ai/vite-config";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";

export default mergeConfig(
  { plugins: [react()] },
  tamboViteConfig({
    entry: ["./src/index.ts", "./src/production.ts"],
  }),
);
```

**`tsconfig.json`** (single file, no CJS/ESM variants needed):

```json
{
  "extends": "@tambo-ai/typescript-config/react-library.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["dist", "node_modules"]
}
```

**`package.json` key fields:**

```json
{
  "name": "@tambo-ai/devtools",
  "version": "0.1.0",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "@tambo-ai/source": "./src/index.ts",
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/cjs/index.d.ts",
        "default": "./dist/cjs/index.cjs"
      }
    },
    "./production": {
      "@tambo-ai/source": "./src/production.ts",
      "import": {
        "types": "./dist/esm/production.d.ts",
        "default": "./dist/esm/production.js"
      },
      "require": {
        "types": "./dist/cjs/production.d.ts",
        "default": "./dist/cjs/production.cjs"
      }
    }
  },
  "files": ["dist", "LICENSE"],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "check-types": "tsc --noEmit",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "clean": "rimraf dist"
  }
}
```

`@tambo-ai/vite-config` handles: `"use client"` directive preservation (via `rollup-plugin-preserve-directives`), dependency externalization, dual ESM/CJS output (`dist/esm/*.js` + `dist/cjs/*.cjs`), type declaration generation (via `vite-plugin-dts`), and source maps. No `tsc-esm-fix` or `concurrently` needed.

### Entry Points (TanStack pattern)

**`src/index.ts`** — dev-only default:

```typescript
"use client";
import * as Devtools from "./tambo-devtools";

export const TamboDevtools: (typeof Devtools)["TamboDevtools"] =
  process.env.NODE_ENV !== "development"
    ? function () {
        return null;
      }
    : Devtools.TamboDevtools;
```

**`src/production.ts`** — always renders:

```typescript
"use client";
export { TamboDevtools } from "./tambo-devtools";
```

Bundlers dead-code-eliminate the real component in production because the `process.env.NODE_ENV` check is a top-level conditional assignment. The `sideEffects: false` assertion enables webpack/Rollup to drop the unused import graph entirely.

### Data Access

Use `useTamboRegistry()` — **not** `useTambo()`. This is a critical architectural decision:

- `useTambo()` subscribes to the full stream state (thread map, current thread ID, streaming state, transformed messages). The devtools would re-render on every message, stream event, and thread switch — none of which it cares about.
- `useTamboRegistry()` only subscribes to the registry context (component list, tool registry, associations). It only re-renders when registrations change, which is rare.

| Data                        | Source               | Access                                                    |
| --------------------------- | -------------------- | --------------------------------------------------------- |
| Components                  | `useTamboRegistry()` | `.componentList` → `Record<string, RegisteredComponent>`  |
| Tools                       | `useTamboRegistry()` | `.toolRegistry` → `Record<string, TamboTool>`             |
| Component-tool associations | `useTamboRegistry()` | `.componentToolAssociations` → `Record<string, string[]>` |

**Required react-sdk change:** Export `useTamboRegistry` from the public API. Add one line to `react-sdk/src/v1/index.ts`:

```typescript
export { useTamboRegistry } from "../providers/tambo-registry-provider";
```

This is a minor, non-breaking, backwards-compatible addition. It also gives us `componentToolAssociations` for free — include in MVP since it's zero extra work.

### Rendering Strategy

- **React Portal** to `document.body` via a `useEffect`-created container element. Guard against duplicates during HMR:
  ```typescript
  useEffect(() => {
    const existing = document.querySelector("[data-tambo-devtools-portal]");
    if (existing) {
      setContainer(existing);
      return;
    }
    const el = document.createElement("div");
    el.setAttribute("data-tambo-devtools-portal", "");
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      el.remove();
    };
  }, []);
  ```
- **`"use client"` directive** on entry points for RSC compatibility. Preserved automatically by Vite build.
- **Context validation:** Use a sentinel value to detect "outside provider." The `TamboRegistryContext` has default values (empty registries, no-op functions), so `useContext` never returns undefined. Add a check for a known field (e.g., verify the context object has the expected shape or use a separate `__initialized` marker).

### Styling

Inline style objects — no CSS-in-JS library, no Tailwind dependency. A single `styles.ts` file with a `getStyles(isDark: boolean)` function that returns style objects. No design token abstraction — just hardcoded values for ~15 CSS properties.

Theme detection via `window.matchMedia("(prefers-color-scheme: dark)")` with an event listener, inlined into `usePanelState`. Guarded with `typeof window !== "undefined"` for SSR safety.

### Panel Behavior

- **Position:** Fixed-position trigger button in bottom-right corner. Panel expands upward and to the left.
- **Z-index:** Hardcoded `99999`.
- **Resize:** Single drag handle on the top edge of the panel. Uses Pointer Events + `setPointerCapture` (not mouse events) for reliable tracking even during fast cursor movement. `requestAnimationFrame` throttling to prevent layout thrashing. `touch-action: none` on the handle element. Min height 150px, max 80% viewport.
- **State persistence:** `localStorage` under key `tambo-devtools-state`, accessed via `useSyncExternalStore` for correct concurrent rendering and cross-tab sync. Stores `{ isOpen, activeTab, panelHeight }`.
- **Initial state:** Closed by default. Respects `initialOpen` prop on first load (localStorage takes precedence after first interaction).

### Tab Content

**Components tab:**

- List of registered components, sorted alphabetically
- Each item shows: name (bold), description, associated tools (from `componentToolAssociations`)
- Expandable section: props schema as formatted `<pre>` + `JSON.stringify(schema, null, 2)` for MVP
- Tab label shows count: "Components (3)"

**Tools tab:**

- List of registered tools, sorted alphabetically
- Each item shows: name (bold), description
- Expandable sections: input schema, output schema as formatted `<pre>` JSON
- Tab label shows count: "Tools (7)"

**Empty state:** Inline "No components registered" / "No tools registered" with guidance text. No separate component file.

**Schema display:** `<pre>` with `JSON.stringify` for MVP. A recursive collapsible tree view can replace this later when someone actually complains that raw JSON is hard to read.

### Accessibility

Built into each component as it's created, not as a separate pass:

- Trigger button: `<button>` with `aria-label="Toggle Tambo DevTools"`, `aria-expanded`
- Panel: `role="dialog"`, `aria-label="Tambo DevTools"`
- Tabs: `role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-selected`
- Keyboard: Enter/Space on trigger, Tab navigation within panel, Escape to close
- Focus: Move to panel on open, return to trigger on close

### Tambo Logo Icon

The existing Octo-Icon SVG is 404KB — way too large. Use a placeholder SVG icon initially (a simple "T" mark or stylized octopus silhouette at 24x24, inlined as a React component). Swap for a proper simplified octopus when design provides one.

## Acceptance Criteria

### Functional

- [x] `<TamboDevtools />` renders a floating trigger button when placed inside `<TamboProvider>`
- [x] Clicking the trigger opens/closes a panel
- [x] Components tab lists all registered components with name, description, associated tools, and props schema
- [x] Tools tab lists all registered tools with name, description, and input/output schemas
- [x] Tab labels show item counts
- [x] Panel is resizable via drag handle
- [x] Panel state (open/closed, active tab, height) persists to localStorage
- [x] Empty states shown when no components/tools are registered
- [x] Throws clear error when rendered outside TamboProvider

### Build & Packaging

- [x] Package at `packages/devtools/` with `@tambo-ai/devtools` name
- [x] Vite build via `@tambo-ai/vite-config` (dual ESM/CJS output)
- [x] Default import returns `null` in production (`process.env.NODE_ENV !== "development"`)
- [x] `@tambo-ai/devtools/production` export always renders
- [x] `"use client"` directive preserved on entry points
- [x] `sideEffects: false` in package.json
- [x] `@tambo-ai/react` as peerDependency

### Accessibility

- [x] Keyboard operable (Enter/Space/Escape/Tab)
- [x] Proper ARIA roles and labels on trigger, panel, and tabs
- [x] Focus management on open/close

### react-sdk Change

- [x] Export `useTamboRegistry` from `react-sdk/src/v1/index.ts`

### Testing

- [x] Unit tests for panel state hook (localStorage persistence, defaults)
- [x] Unit tests for resize hook (bounds clamping)
- [x] Component tests: renders trigger, opens panel, shows correct tab content
- [x] Component tests: empty state rendering
- [x] Component tests: error when outside provider

## Implementation Phases

### Phase 1: Package scaffold + styles + hooks

1. Create `packages/devtools/` with package.json, vite.config.ts, tsconfig.json, jest.config.ts
2. Create `src/index.ts` (dev entry) and `src/production.ts` (production entry)
3. Add `useTamboRegistry` export to `react-sdk/src/v1/index.ts`
4. Inline style objects (`styles.ts`) with light/dark variants
5. Panel state hook (`use-panel-state.ts`) — open/close, active tab, height, color scheme, localStorage via `useSyncExternalStore`
6. Resize hook (`use-resize.ts`) — Pointer Events + `setPointerCapture` + rAF throttling
7. Verify builds and type checking work

**Files:**

- `packages/devtools/package.json`
- `packages/devtools/vite.config.ts`
- `packages/devtools/tsconfig.json`
- `packages/devtools/jest.config.ts`
- `packages/devtools/src/index.ts`
- `packages/devtools/src/production.ts`
- `packages/devtools/src/styles.ts`
- `packages/devtools/src/use-panel-state.ts`
- `packages/devtools/src/use-resize.ts`
- `react-sdk/src/v1/index.ts` (add export)

### Phase 2: UI components + assembly + accessibility

Build all UI components with accessibility baked in from the start.

1. Placeholder Tambo logo SVG component
2. Main `TamboDevtools` component (trigger button inlined, context validation)
3. Panel container (portal, resize handle, tabs with counts)
4. Shared registry list view (used by both tabs)
5. Schema display (`<pre>` + `JSON.stringify`)
6. Empty states (inline in list component)
7. Keyboard navigation (Escape to close) and focus management

**Files:**

- `packages/devtools/src/tambo-icon.tsx`
- `packages/devtools/src/tambo-devtools.tsx`
- `packages/devtools/src/devtools-panel.tsx`
- `packages/devtools/src/registry-list.tsx`
- `packages/devtools/src/schema-view.tsx`

### Phase 3: Tests + integration

1. Unit tests for hooks (panel state persistence, resize bounds)
2. Component tests (renders trigger, opens panel, tab content, empty states, error outside provider)
3. Verify build, lint, types pass
4. Add to showcase app for manual testing

**Files:**

- `packages/devtools/src/tambo-devtools.test.tsx`
- `packages/devtools/src/use-panel-state.test.ts`
- `packages/devtools/src/use-resize.test.ts`
- `packages/devtools/src/schema-view.test.tsx`

### Phase 4: Cleanup

1. Add documentation for the package in the `/docs/content` directory (Overview, usage guide, API reference)
2. Add references to the new package in pages and locations that make sense (e.g., "Debugging" section of the main docs, "DevTools" page in the showcase)
3. Delete the brainstorm document and this plan document

## Dependencies

**peerDependencies:**

- `react` ^18.0.0 || ^19.0.0
- `react-dom` ^18.0.0 || ^19.0.0 (for `createPortal`)
- `@tambo-ai/react` \*

**devDependencies:**

- `@tambo-ai/vite-config` \*
- `@tambo-ai/eslint-config` \*
- `@tambo-ai/typescript-config` \*
- `@tambo-ai/react` \* (for types during development)
- `@vitejs/plugin-react` ^4.5.2
- `vite` ^7.3.1
- `typescript` ^5.9.3
- `jest` ^30.2.0, `jest-environment-jsdom` ^30.0.2, `ts-jest` ^29.4.6
- `@testing-library/react` ^16.3.2, `@testing-library/jest-dom` ^6.6.3
- `@types/jest` ^30.0.0, `@types/node` ^22.19.8
- `react` ^19.0.0, `react-dom` ^19.0.0 (dev instances)
- `rimraf` ^6.0.1

No new runtime dependencies.

## Out of Scope (MVP)

- Thread/message inspection
- Streaming state visualization
- MCP server info display
- Network request logging
- Component render highlighting
- Performance profiling
- Source link for components (pending research into Next.js approach)
- Search/filter within tabs
- Theme prop (uses system preference for now)
- Touch/mobile resize support
- Configurable position prop (hardcode bottom-right)
- Configurable zIndex prop (hardcode 99999)
- Collapsible JSON Schema tree view (use `<pre>` + `JSON.stringify` for now)

## Research Insights

### localStorage with `useSyncExternalStore`

Use `useSyncExternalStore` instead of `useState` + `useEffect` for localStorage persistence:

- Handles tearing (stale values during concurrent renders) which `useState`+`useEffect` cannot
- `getServerSnapshot` gives SSR safety for free — no `typeof window` checks
- Cross-tab sync via `storage` event listener + custom event for same-tab updates
- Immune to React Strict Mode double-mounting

### Portal Rendering

- Create container in `useEffect`, not during render (SSR safe)
- Use `data-tambo-devtools-portal` attribute for singleton detection
- React synthetic events still bubble through the React tree to the portal's React parent — `stopPropagation` if needed
- `z-index: 2147483647` (max 32-bit int) is the nuclear option; `99999` is reasonable for dev tooling

### Resize with Pointer Events

- `setPointerCapture(pointerId)` ties all subsequent events to the capturing element, even if pointer leaves it
- No need for `document.addEventListener` / cleanup — events stay on the element
- `touch-action: none` on the handle is critical to prevent browser scroll/zoom during drag
- Throttle updates with `requestAnimationFrame` to prevent layout thrashing
- Use `useRef` for drag state (not `useState`) to avoid re-renders per pointer event

### Provider Detection

`TamboRegistryContext` provides default values (empty registries, no-op functions). `useContext` never returns `undefined`. Two options:

1. Check for a sentinel: add `__initialized: true` to the real provider value, check for its absence
2. Use a separate boolean context that defaults to `false` and is set to `true` inside `TamboProvider`

Option 1 requires a minor addition to `TamboRegistryProvider` in `react-sdk`. Option 2 requires no SDK changes but means the devtools package creates its own detection context (awkward). Recommend option 1.

## Sources & References

### Origin

- **Brainstorm document:** [devdocs/brainstorms/2026-03-03-tambo-devtools-brainstorm.md](devdocs/brainstorms/2026-03-03-tambo-devtools-brainstorm.md) — Key decisions: separate package, lazy-loaded entry points, inline styles, configurable position, resizable panel, Tambo logo trigger.

### Internal References

- **Build pattern (reference):** `packages/react-ui-base/vite.config.ts`, `packages/react-ui-base/package.json`
- **Vite config:** `packages/vite-config/src/index.ts` (`tamboViteConfig`)
- **TSConfig base:** `packages/typescript-config/react-library.json`
- **Jest config pattern:** `packages/react-ui-base/jest.config.ts`
- Registry provider: `react-sdk/src/providers/tambo-registry-provider.tsx`
- Component types: `packages/client/src/model/component-metadata.ts`
- React component types: `react-sdk/src/model/component-metadata.ts`
- Schema conversion: `react-sdk/src/util/registry.ts` (`convertPropsToJsonSchema`)
- Workspace config: root `package.json` (workspaces), `turbo.json`
- Tambo logo: `showcase/public/logo/icon/Octo-Icon.svg`

### External References

- TanStack React Query DevTools entry point pattern: `@tanstack/react-query-devtools` src/index.ts
- TanStack DevTools styling: goober CSS-in-JS with design tokens
- TanStack DevTools resize: mouse drag with height tracking, min threshold to auto-close
- `useSyncExternalStore` for localStorage: https://react.dev/reference/react/useSyncExternalStore
- `use-local-storage-state` library: https://github.com/astoilkov/use-local-storage-state
- Pointer Events + `setPointerCapture`: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- release-please lockfile gotcha: `devdocs/solutions/build-errors/release-please-lockfile-sync.md`
