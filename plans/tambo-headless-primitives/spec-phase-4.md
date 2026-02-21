# Implementation Spec: Tambo Headless Primitives - Phase 4 (Vertical Slice: Thread Block Variants + Timeline Containers)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Deliver the thread container slice by introducing headless timeline/container primitives and aligning all registry block variants to compose those primitives while retaining display-specific orchestration.

This phase covers `thread-content` and `mcp-components` behavior boundaries in `react-ui-base`, then applies them across `message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, and `control-bar`.

## Scope

### In Scope

- Add dedicated `ThreadContent` primitives to `react-ui-base`.
- Add dedicated `McpComponents` primitives to `react-ui-base`.
- Move timeline/container behavior boundaries from registry internals into base primitives.
- Update all thread block variants to compose base timeline/thread-control primitives only.
- Preserve block-owned orchestration (`open`, panel width, hotkeys, docking).
- Preserve `canvas-space` interoperability via the existing `tambo:showComponent` event API.

### Out of Scope

- `apps/web` adoption.
- First-pass primitive docs authoring (completed in Phases 1 and 2).
- New block variants or additional primitive domains.

## File Changes

### New Files

| File Path                                                 | Changes                                             |
| --------------------------------------------------------- | --------------------------------------------------- |
| `packages/react-ui-base/src/thread-content/index.tsx`    | ThreadContent namespace export                      |
| `packages/react-ui-base/src/thread-content/**/*.tsx`     | ThreadContent root/parts/context + timeline wiring |
| `packages/react-ui-base/src/mcp-components/index.tsx`    | McpComponents namespace export                      |
| `packages/react-ui-base/src/mcp-components/**/*.tsx`     | McpComponents root/parts/context + render behavior |
| `packages/react-ui-base/src/thread-content/**/*.test.tsx` | ThreadContent behavior + guard coverage            |
| `packages/react-ui-base/src/mcp-components/**/*.test.tsx` | McpComponents behavior + guard coverage            |

### Modified Files

| File Path                                                                                       | Changes                                                               |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/react-ui-base/src/index.ts`                                                           | Export `ThreadContent` + `McpComponents` namespaces                  |
| `packages/react-ui-base/package.json`                                                           | Add `thread-content` + `mcp-components` subpath exports              |
| `packages/ui-registry/src/components/thread-content/thread-content.tsx`                         | Styled wrapper over `ThreadContent` primitive                        |
| `packages/ui-registry/src/components/canvas-space/canvas-space.tsx`                             | Compose `McpComponents` behavior while keeping event API integration |
| `packages/ui-registry/src/components/message-thread-full/message-thread-full.tsx`               | Compose updated primitives for full layout                           |
| `packages/ui-registry/src/components/message-thread-panel/message-thread-panel.tsx`             | Compose updated primitives for panel layout                          |
| `packages/ui-registry/src/components/message-thread-collapsible/message-thread-collapsible.tsx` | Compose updated primitives for collapsible layout                    |
| `packages/ui-registry/src/components/control-bar/control-bar.tsx`                               | Compose updated primitives while preserving block hotkeys            |

## Implementation Details

1. `ThreadContent.Root` owns timeline state derivation and exposes composable rendering slots for loading, empty, and populated states.
2. `McpComponents.Root` owns rendered-component availability/state boundaries and exposes explicit parts for trigger/content orchestration.
3. Registry blocks remain styled display shells with opinionated layout state, but do not call Tambo hooks directly.
4. Block variants continue to differ in presentation, not behavior ownership.
5. Fail-fast semantics stay explicit for missing required context/inputs and unknown component payloads.

## Testing Requirements

### Unit Tests

| Test File                                                                                                  | Coverage                                                     |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/react-ui-base/src/thread-content/**/*.test.tsx`                                                 | timeline state transitions, context guards, slot composition |
| `packages/react-ui-base/src/mcp-components/**/*.test.tsx`                                                 | rendered component availability + state behavior             |
| `packages/ui-registry/src/components/thread-content/thread-content.test.tsx`                              | styled timeline composition parity                           |
| `packages/ui-registry/src/components/message-thread-panel/message-thread-panel.test.tsx`                  | panel orchestration + primitive composition                  |
| `packages/ui-registry/src/components/message-thread-collapsible/message-thread-collapsible.test.tsx`      | collapsible orchestration + primitive composition            |
| `packages/ui-registry/src/components/message-thread-full/message-thread-full.test.tsx`                    | full-layout composition + behavior parity                    |
| `packages/ui-registry/src/components/control-bar/control-bar.test.tsx`                                    | block-level controls/hotkeys with updated composition        |

### Manual Testing

- [ ] Validate all thread block variants with shared behavior and distinct layouts.
- [ ] Validate open/close/resize/hotkey flows for panel/collapsible/control-bar variants.
- [ ] Validate rendered component display and `tambo:showComponent` interoperability.
- [ ] Validate timeline empty/loading/content states in each block variant.
- [ ] Validate no registry block uses Tambo hooks directly.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- thread-content mcp-components
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- thread-content message-thread-full message-thread-panel message-thread-collapsible control-bar
```

## Implementation Tracking

- **Current Status**: `Not Started`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `TBD`
- **Completion Notes**: `TBD`
