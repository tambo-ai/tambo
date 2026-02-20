# Implementation Spec: Tambo Headless Primitives - Phase 4 (Vertical Slice: Thread Block Variants)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Align all registry thread block variants to one behavior contract while preserving distinct display shells:

- `message-thread-full`
- `message-thread-panel`
- `message-thread-collapsible`
- `control-bar`

These remain registry blocks with orchestration state and opinionated hotkeys.

## Scope

### In Scope

- Unify shared behavior expectations across block variants.
- Remove baked suggestion defaults; require caller-provided suggestions.
- Preserve block-specific orchestration state (`open`, width, shortcuts).
- Keep canvas-space event interoperability where relevant.

### Out of Scope

- New base primitive domains for block containers.
- apps/web consumer updates.

## File Changes

### Modified Files

| File Path                                                                                       | Changes                                                     |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `packages/ui-registry/src/components/message-thread-full/message-thread-full.tsx`               | caller-provided suggestion contract                         |
| `packages/ui-registry/src/components/message-thread-panel/message-thread-panel.tsx`             | caller-provided suggestion contract + orchestration cleanup |
| `packages/ui-registry/src/components/message-thread-collapsible/message-thread-collapsible.tsx` | caller-provided suggestion contract + orchestration cleanup |
| `packages/ui-registry/src/components/control-bar/control-bar.tsx`                               | block hotkey/orchestration contract cleanup                 |

## Implementation Details

1. Keep layout/state logic internal to each block variant.
2. Keep styling differences as-is; align behavior inputs/outputs.
3. Ensure each block can operate without embedded app-specific suggestion data.
4. Ensure callback props are sufficient for external control hooks where needed.

## Testing Requirements

### Unit Tests

| Test File                                                                                                | Coverage                                    |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `packages/ui-registry/src/components/scrollable-message-container/scrollable-message-container.test.tsx` | shared scrolling behavior in block contexts |
| `packages/ui-registry/src/components/thread-dropdown/thread-dropdown.test.tsx`                           | block-level thread switching paths          |
| `packages/ui-registry/src/components/message/message-content.test.tsx`                                   | timeline rendering in block contexts        |

### Manual Testing

- [ ] Validate each block variant with caller-provided suggestions.
- [ ] Validate block-specific open/close/resize behavior.
- [ ] Validate hotkeys still operate in expected blocks.

## Validation Commands

```bash
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- message-thread-full message-thread-panel message-thread-collapsible control-bar
```
