# Implementation Spec: Tambo Headless Primitives - Phase 5 (Vertical Slice: MCP Components Primitive)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Deliver a dedicated phase for `McpComponents` because rendered-component behavior and canvas interoperability require focused implementation and testing.

This phase introduces and hardens `McpComponents` primitives in `react-ui-base`, then aligns registry canvas/rendered-component integrations to compose those primitives.

## Scope

### In Scope

- Add dedicated `McpComponents` primitives to `react-ui-base`.
- Define explicit rendered-component availability/state boundaries in base primitives.
- Align registry rendered-component/canvas integrations with the new primitive boundary.
- Preserve `canvas-space` interoperability via the existing `tambo:showComponent` event API.

### Out of Scope

- Thread block variant layout orchestration (Phase 4).
- `apps/web` adoption (Phase 6).
- New primitive domains beyond `mcp-components`.

## File Changes

### New Files

| File Path                                                 | Changes                                            |
| --------------------------------------------------------- | -------------------------------------------------- |
| `packages/react-ui-base/src/mcp-components/index.tsx`     | McpComponents namespace export                     |
| `packages/react-ui-base/src/mcp-components/**/*.tsx`      | McpComponents root/parts/context + render behavior |
| `packages/react-ui-base/src/mcp-components/**/*.test.tsx` | McpComponents behavior + guard coverage            |

### Modified Files

| File Path                                                           | Changes                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/react-ui-base/src/index.ts`                               | Export `McpComponents` namespace                                     |
| `packages/react-ui-base/package.json`                               | Add `mcp-components` subpath export                                  |
| `packages/ui-registry/src/components/canvas-space/canvas-space.tsx` | Compose `McpComponents` behavior while keeping event API integration |
| `packages/ui-registry/src/components/message/message.tsx`           | Align rendered-component composition boundary where applicable       |

## Implementation Details

1. `McpComponents.Root` owns rendered-component availability/state boundaries and exposes explicit parts for trigger/content orchestration.
2. Canvas integration keeps the existing global `tambo:showComponent` event API.
3. Registry consumers keep styling/display ownership and do not own primitive behavior state.
4. Fail-fast behavior remains explicit for invalid/unknown rendered component payloads.

## Testing Requirements

### Unit Tests

| Test File                                                                | Coverage                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `packages/react-ui-base/src/mcp-components/**/*.test.tsx`                | availability/state transitions, context guards         |
| `packages/ui-registry/src/components/canvas-space/canvas-space.test.tsx` | canvas interoperability with `McpComponents`           |
| `packages/ui-registry/src/components/message/message-content.test.tsx`   | rendered component composition with updated boundaries |

### Manual Testing

- [ ] Validate rendered component trigger/content behavior through `McpComponents` parts.
- [ ] Validate `tambo:showComponent` canvas event flow remains intact.
- [ ] Validate unknown or invalid component payloads fail fast with explicit errors.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- mcp-components
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- canvas-space message
```

## Implementation Tracking

- **Current Status**: `In Progress`
- **Implementation PR(s)**: `codex/showcase-page-specific-suggestions`
- **Completion Date (YYYY-MM-DD)**: `TBD`
- **Completion Notes**: `apps/web` adoption started via updates to `message-thread-panel` and `tambo-subscribe-integration`; remaining wrapper migrations in Phase 5 scope are pending.
