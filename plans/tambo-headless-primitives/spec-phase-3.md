# Implementation Spec: Tambo Headless Primitives - Phase 3 (Vertical Slice: Thread Controls + Suggestions)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Deliver thread control interactions as one behavior-first slice by introducing dedicated headless primitives for thread controls and keeping styled orchestration in `ui-registry`.

This phase moves Tambo-specific hook usage for thread control concerns into `react-ui-base` and keeps registry components focused on visual composition and product-level interaction choices.

## Scope

### In Scope

- Add dedicated `ThreadHistory` primitives to `react-ui-base`.
- Add dedicated `ThreadDropdown` primitives to `react-ui-base`.
- Move thread list/search/switch/new-thread behavior boundaries to base primitives.
- Keep rename UI visible and explicit with deferred backend wiring (TODO remains intentional).
- Update registry `thread-history` and `thread-dropdown` components to compose primitives only.
- Ensure suggestions remain caller-provided in `message-suggestions` and block entry points (no baked defaults).

### Out of Scope

- Thread block variant layout/orchestration unification (`full/panel/collapsible/control-bar`).
- `apps/web` adoption.
- Docs IA polish (Phase 6).

## File Changes

### New Files

| File Path                                                  | Changes                                           |
| ---------------------------------------------------------- | ------------------------------------------------- |
| `packages/react-ui-base/src/thread-history/index.tsx`      | ThreadHistory namespace export                    |
| `packages/react-ui-base/src/thread-history/**/*.tsx`       | ThreadHistory root/parts/context + behavior hooks |
| `packages/react-ui-base/src/thread-dropdown/index.tsx`     | ThreadDropdown namespace export                   |
| `packages/react-ui-base/src/thread-dropdown/**/*.tsx`      | ThreadDropdown root/parts/context + actions       |
| `packages/react-ui-base/src/thread-history/**/*.test.tsx`  | ThreadHistory behavior + guard coverage           |
| `packages/react-ui-base/src/thread-dropdown/**/*.test.tsx` | ThreadDropdown behavior + guard coverage          |

### Modified Files

| File Path                                                                         | Changes                                                           |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/react-ui-base/src/index.ts`                                             | Export `ThreadHistory` + `ThreadDropdown` namespaces              |
| `packages/react-ui-base/package.json`                                             | Add `thread-history` + `thread-dropdown` subpath exports          |
| `packages/ui-registry/src/components/thread-history/thread-history.tsx`           | Styled wrapper over base primitives; keep rename TODO             |
| `packages/ui-registry/src/components/thread-dropdown/thread-dropdown.tsx`         | Styled wrapper over base primitives + shortcut wiring             |
| `packages/ui-registry/src/components/message-suggestions/message-suggestions.tsx` | Enforce caller-provided suggestions behavior and empty-state path |

## Implementation Details

1. `ThreadHistory.Root` owns thread collection state derivation, selection callbacks, and search filtering inputs.
2. `ThreadDropdown.Root` owns action availability state (switch/new-thread/rename affordances) and exposes composable trigger/content parts.
3. Registry thread controls do not call Tambo hooks directly; they compose primitives and style via classes/data attributes.
4. Rename UI remains visible with a clear TODO for backend rename API integration; no silent fallback behavior.
5. Suggestions are only rendered when caller-provided data exists; do not inject reusable-component defaults.

## Testing Requirements

### Unit Tests

| Test File                                                                              | Coverage                                                        |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/react-ui-base/src/thread-history/**/*.test.tsx`                              | list/search/select behavior, context guards, render composition |
| `packages/react-ui-base/src/thread-dropdown/**/*.test.tsx`                             | action availability, trigger/content behavior, context guards   |
| `packages/ui-registry/src/components/thread-history/thread-history.test.tsx`           | styled composition + rename affordance parity                   |
| `packages/ui-registry/src/components/thread-dropdown/thread-dropdown.test.tsx`         | keyboard shortcuts + styled action rendering                    |
| `packages/ui-registry/src/components/message-suggestions/message-suggestions.test.tsx` | caller-provided suggestion rendering + selection flow           |

### Manual Testing

- [ ] Validate thread search/filter and active-thread switching.
- [ ] Validate new-thread action from dropdown and keyboard shortcut paths.
- [ ] Validate rename UI presence and deferred behavior messaging.
- [ ] Validate suggestion rendering when provided vs omitted.
- [ ] Validate no registry thread-control component uses Tambo hooks directly.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- thread-history thread-dropdown
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- thread-history thread-dropdown message-suggestions
```

## Implementation Tracking

- **Current Status**: `Not Started`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `TBD`
- **Completion Notes**: `TBD`
