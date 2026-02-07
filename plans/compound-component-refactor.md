# Compound Component Refactor Plan

## Summary

This plan covers creating individual PRs for compound components in the `react-ui-base` package. The goal is to break down the large `compound-components` branch into reviewable PRs while ensuring each component is refactored correctly and tested thoroughly.

### Current State

**Branch:** `compound-components`
**Stats:** 142 files changed, +13,030 / -4,206 lines

### Pattern Change: `render` Prop Deprecated

The `render` prop pattern is **deprecated** across all base components. All styled wrappers must use **children as a function** instead. The `render` prop is retained in the type system for backwards compatibility but should not appear in any new code.

**State access hierarchy for styled wrappers** (in order of preference):

1. **Context-aware sub-components** — render base sub-components directly with `className`
2. **Data attributes** — use `data-[attr]` Tailwind selectors for state-based styling
3. **Children as render function** — only when rendering entirely different component trees
4. **Context hooks** — import directly from base source file for deep access

See `.claude/skills/styled-compound-wrappers/SKILL.md` for details.

---

## Phase 1: Independent Components — COMPLETE

All 9 PRs created, reviewed, lint/type-checked, and fixes applied.

| PR | Component | Branch | Linear |
|----|-----------|--------|--------|
| #2267 | message-suggestions | `lachieh/tam-1057-message-suggestions` | TAM-1057 |
| #2268 | thread-history | `lachieh/tam-1064-thread-history` | TAM-1064 |
| #2269 | graph | `lachieh/tam-1052-graph` | TAM-1052 |
| #2270 | form | `lachieh/tam-1051-form` | TAM-1051 |
| #2271 | elicitation-ui | `lachieh/tam-1050-elicitation-ui` | TAM-1050 |
| #2272 | edit-with-tambo-button | `lachieh/tam-1049-edit-with-tambo-button` | TAM-1049 |
| #2273 | map | `lachieh/tam-1054-map` | TAM-1054 |
| #2274 | input-fields | `lachieh/tam-1053-input-fields` | TAM-1053 |
| #2275 | canvas-space | `lachieh/tam-1047-canvas-space` | TAM-1047 |

PR #2267 targets `main`. PRs #2268-#2275 target `lachieh/tam-1057-message-suggestions`.

---

## Phase 2: Shared Infrastructure — COMPLETE

| PR | Component | Branch | Linear |
|----|-----------|--------|--------|
| #2276 | scrollable-message-container | `lachieh/tam-1061-scrollable-message-container` | TAM-1061 |
| #2277 | thread-content | `lachieh/tam-1062-thread-content` | TAM-1062 |
| #2278 | thread-dropdown | `lachieh/tam-1063-thread-dropdown` | TAM-1063 |

All target `lachieh/tam-1057-message-suggestions`.

### Review Fixes Applied

- Type errors in elicitation-ui-field.tsx (stripped children/render before sub-field dispatch)
- 18 `render=` usages converted to children-as-function across all 10 styled wrappers
- Missing `./control-bar` subpath export added to package.json
- No-nested-ternary lint errors fixed in 3 root components
- Render priority fixed (children first, render fallback) in 3 root components
- FieldSchema type used instead of loose `{type: string}` in styled elicitation-ui

---

## Phase 3: Implement Stub Components — IN PROGRESS

These directories exist on `compound-components` but contain **no component files** (empty subdirs only):

| Component | Directory | Subdirs | Linear | Styled Wrapper Exists? |
|-----------|-----------|---------|--------|----------------------|
| message-thread-collapsible | `src/message-thread-collapsible/` | content/, header/, root/, trigger/ | TAM-1058 | Yes, in `packages/ui-registry/src/components/message-thread-collapsible/` |
| message-thread-full | `src/message-thread-full/` | container/, root/, sidebar/ | TAM-1059 | Yes, in `packages/ui-registry/src/components/message-thread-full/` |
| message-thread-panel | `src/message-thread-panel/` | content/, resizable/, root/, sidebar/ | TAM-1060 | Yes, in `packages/ui-registry/src/components/message-thread-panel/` |

### Implementation Approach

Each message-thread variant composes existing base components (MessageInput, ThreadContent, ScrollableMessageContainer, ThreadDropdown, etc.) into a specific layout. The base primitive for each should:

1. **Root** — provide layout context (sidebar open/closed, panel size, etc.)
2. **Layout sub-components** — render structural regions (container, sidebar, content, header, trigger)
3. **Compose** existing base components within those regions

The styled wrappers already exist in `ui-registry` — the task is to extract the business logic into base primitives.

---

## Phase 4: Composed Components — BLOCKED on Phase 3

| Component | Linear | Dependencies | Notes |
|-----------|--------|-------------|-------|
| control-bar | TAM-1048 | MessageInput, ThreadContent, ScrollableMessageContainer | Base primitive exists, needs styled wrapper PR |
| message-thread-full | TAM-1059 | All core components | Needs base primitive (Phase 3) then PR |
| message-thread-panel | TAM-1060 | All core components | Needs base primitive (Phase 3) then PR |
| message-thread-collapsible | TAM-1058 | All core + ThreadDropdown | Needs base primitive (Phase 3) then PR |
| mcp-components | TAM-1055 | TBD | Separate PR #2252 already exists |

---

## Test Checklist

### Base Component Tests

- [ ] Component renders without errors
- [ ] All sub-components work within Root context
- [ ] Data attributes exposed correctly for CSS styling (`data-*`)
- [ ] Children-as-function exposes expected state (no `render` prop usage)
- [ ] No hooks exported from component barrel file (`index.tsx`)
- [ ] Types exported correctly from main `index.ts`
- [ ] Subpath export works (`@tambo-ai/react-ui-base/<component>`)

### Styled Wrapper Tests

- [ ] Styled wrapper imports from base package correctly
- [ ] Styled wrapper composes base sub-components (not duplicating logic)
- [ ] Visual appearance matches original
- [ ] All existing functionality preserved
- [ ] Showcase renders component correctly
