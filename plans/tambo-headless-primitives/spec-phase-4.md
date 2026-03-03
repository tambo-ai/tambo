# Implementation Spec: Tambo Headless Primitives - Phase 4 (Vertical Slice: Thread Block Variants + Thread Content)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Deliver the thread container slice by introducing `ThreadContent` primitives and aligning all registry block variants to compose those primitives while retaining display-specific orchestration.

This phase covers thread timeline/container behavior boundaries in `react-ui-base`, then applies them across `message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, and `control-bar`.

## Scope

### In Scope

- Add dedicated `ThreadContent` primitives to `react-ui-base`.
- Move timeline/container behavior boundaries from registry internals into base primitives.
- Update all thread block variants to compose base timeline/thread-control primitives only.
- Preserve block-owned orchestration (`open`, panel width, hotkeys, docking).
- Author Base UI-style primitive docs page for `ThreadContent` using `spec-template-base-primitive-doc-page.md`.

### Out of Scope

- Dedicated `McpComponents` primitive work (Phase 5).
- `apps/web` adoption.
- First-pass primitive docs authoring (completed in Phases 1 and 2).
- New block variants or additional primitive domains.

## File Changes

### New Files

| File Path                                                 | Changes                                            |
| --------------------------------------------------------- | -------------------------------------------------- |
| `packages/react-ui-base/src/thread-content/index.tsx`     | ThreadContent namespace export                     |
| `packages/react-ui-base/src/thread-content/**/*.tsx`      | ThreadContent root/parts/context + timeline wiring |
| `packages/react-ui-base/src/thread-content/**/*.test.tsx` | ThreadContent behavior + guard coverage            |

### Modified Files

| File Path                                                                                       | Changes                                                   |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/react-ui-base/src/index.ts`                                                           | Export `ThreadContent` namespace                          |
| `packages/react-ui-base/package.json`                                                           | Add `thread-content` subpath export                       |
| `packages/ui-registry/src/components/thread-content/thread-content.tsx`                         | Styled wrapper over `ThreadContent` primitive             |
| `packages/ui-registry/src/components/message-thread-full/message-thread-full.tsx`               | Compose updated primitives for full layout                |
| `packages/ui-registry/src/components/message-thread-panel/message-thread-panel.tsx`             | Compose updated primitives for panel layout               |
| `packages/ui-registry/src/components/message-thread-collapsible/message-thread-collapsible.tsx` | Compose updated primitives for collapsible layout         |
| `packages/ui-registry/src/components/control-bar/control-bar.tsx`                               | Compose updated primitives while preserving block hotkeys |
| `docs/content/docs/reference/react-ui-base/thread-content.mdx`                                  | ThreadContent primitive docs page                         |
| `docs/content/docs/reference/react-ui-base/meta.json`                                           | Add thread-content docs page to section order             |

## Implementation Details

1. `ThreadContent.Root` owns timeline state derivation and exposes composable rendering slots for loading, empty, and populated states.
2. Registry blocks remain styled display shells with opinionated layout state, but do not call Tambo hooks directly.
3. Block variants continue to differ in presentation, not behavior ownership.
4. Fail-fast semantics stay explicit for missing required context/inputs and unknown component payloads.
5. Docs page follows Base UI heading structure and includes runtime behavior notes and styling hooks.

## Testing Requirements

### Unit Tests

| Test File                                                                                            | Coverage                                                     |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/react-ui-base/src/thread-content/**/*.test.tsx`                                            | timeline state transitions, context guards, slot composition |
| `packages/ui-registry/src/components/thread-content/thread-content.test.tsx`                         | styled timeline composition parity                           |
| `packages/ui-registry/src/components/message-thread-panel/message-thread-panel.test.tsx`             | panel orchestration + primitive composition                  |
| `packages/ui-registry/src/components/message-thread-collapsible/message-thread-collapsible.test.tsx` | collapsible orchestration + primitive composition            |
| `packages/ui-registry/src/components/message-thread-full/message-thread-full.test.tsx`               | full-layout composition + behavior parity                    |
| `packages/ui-registry/src/components/control-bar/control-bar.test.tsx`                               | block-level controls/hotkeys with updated composition        |

### Manual Testing

- [ ] Validate all thread block variants with shared behavior and distinct layouts.
- [ ] Validate open/close/resize/hotkey flows for panel/collapsible/control-bar variants.
- [ ] Validate timeline empty/loading/content states in each block variant.
- [ ] Validate no registry block uses Tambo hooks directly.
- [ ] Validate `thread-content` docs page compiles and matches template structure.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- thread-content
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- thread-content message-thread-full message-thread-panel message-thread-collapsible control-bar
npm run check-types -w docs
npm run lint -w docs
```

## Implementation Tracking

- **Current Status**: `Complete`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `2026-02-26`
- **Completion Notes**: Added ThreadContent headless primitives (Root, Messages, Empty, Loading) to react-ui-base. Refactored registry thread-content and control-bar to compose base primitives instead of calling Tambo hooks directly. Added thread-content docs page and tests.
