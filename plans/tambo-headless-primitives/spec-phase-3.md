# Implementation Spec: Tambo Headless Primitives - Phase 3 (Vertical Slice: Thread Controls + Suggestions)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Deliver thread control interactions as a coherent vertical slice in registry components:

- thread history/search/switch/new-thread
- thread dropdown actions and shortcuts
- suggestions status/list behavior

This phase keeps these features registry-owned and opinionated, per contract.

## Scope

### In Scope

- `thread-history`, `thread-dropdown`, `message-suggestions`.
- Caller-provided suggestion defaults behavior.
- Rename UI kept with explicit TODO for API wiring.
- Block-level hotkeys retained.

### Out of Scope

- Thread container layout variants (`full/panel/collapsible/control-bar`).
- apps/web consumer migration.

## File Changes

### Modified Files

| File Path                                                                         | Changes                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/ui-registry/src/components/thread-history/thread-history.tsx`           | Keep rename UX; add TODO for rename API integration       |
| `packages/ui-registry/src/components/thread-dropdown/thread-dropdown.tsx`         | Shortcut and action contract cleanup                      |
| `packages/ui-registry/src/components/message-suggestions/message-suggestions.tsx` | Caller-provided suggestions contract and behavior cleanup |

## Implementation Details

1. Remove/avoid baked app-specific suggestion defaults in reusable components.
2. Preserve existing hotkey behavior as registry opinion (`Alt+Shift+N`, etc.).
3. Keep thread rename UI visible; document deferred API implementation inline.
4. Keep empty/loading/error states explicit and non-silent.

## Testing Requirements

### Unit Tests

| Test File                                                                              | Coverage                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `packages/ui-registry/src/components/thread-dropdown/thread-dropdown.test.tsx`         | switch/new thread + shortcut behavior            |
| `packages/ui-registry/src/components/thread-history/thread-history.test.tsx`           | list/search/collapse/rename UI behavior          |
| `packages/ui-registry/src/components/message-suggestions/message-suggestions.test.tsx` | caller-provided suggestions + selection behavior |

### Manual Testing

- [ ] Validate search and switch thread flow.
- [ ] Validate new-thread creation from controls and hotkey.
- [ ] Validate rename UI presence and deferred behavior.
- [ ] Validate suggestion rendering when provided vs omitted.

## Validation Commands

```bash
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- thread-dropdown thread-history message-suggestions
```
