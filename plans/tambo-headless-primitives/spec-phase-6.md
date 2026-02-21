# Implementation Spec: Tambo Headless Primitives - Phase 6 (Vertical Slice: apps/web Consumer Adoption)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Adopt the completed primitive + registry contracts in `apps/web` as the first production consumer slice. This phase updates wrappers and integration points to the finalized composition model without compatibility shims for removed internals.

## Scope

### In Scope

- Migrate `apps/web` wrappers to updated `react-ui-base` and `ui-registry` contracts.
- Align message input integration with submit/stop visibility and elicitation mode semantics.
- Align thread controls/block integrations with caller-provided suggestions and updated thread primitives.
- Verify interactables/rendered-component flows remain compatible with `mcp-components` + canvas-space contracts.

### Out of Scope

- docs/showcase migration.
- New primitive feature development.
- Additional contract expansion.

## File Changes

### Modified Files

| File Path                                                           | Changes                                                           |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/web/components/ui/tambo/message-thread-panel.tsx`             | Adopt updated thread block + thread control composition           |
| `apps/web/components/ui/tambo/message-input-with-interactables.tsx` | Adopt MessageInput/Elicitation contract and submit/stop semantics |
| `apps/web/hooks/use-interactables-resource-provider.ts`             | Validate resource insertion compatibility with updated primitives |
| `apps/web/components/ui/tambo/edit-with-tambo-button.tsx`           | Align orchestration path with updated thread/content contracts    |
| `apps/web/app/subscribe/tambo-subscribe-integration.tsx`            | Adopt updated primitive + registry APIs in subscribe flow         |

## Implementation Details

1. Remove assumptions about old toolbar child-type partitioning and `asChild`-style composition internals.
2. Treat submit/stop visibility via primitive state and `keepMounted`/`data-hidden` semantics.
3. Pass suggestions from app-level configuration/state into block components explicitly.
4. Keep app-specific UX choices in `apps/web` wrappers while preserving primitive behavior boundaries.
5. Maintain fail-fast behavior for missing required app-level configuration inputs.

## Testing Requirements

### Unit / Integration

| Area                            | Coverage                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| `apps/web` thread wrappers      | open/close/switch/new-thread behavior over updated contracts |
| `apps/web` input wrappers       | send/stop/elicitation/file/image/resource flows              |
| `apps/web` interactables wiring | rendered component insertion and canvas interaction parity   |

### Manual Testing

- [ ] Validate apps/web send -> stop -> send loop.
- [ ] Validate apps/web staged images/files + submit flow.
- [ ] Validate thread switching/new-thread/suggestions in panel workflows.
- [ ] Validate rendered component and canvas interaction paths.

## Validation Commands

```bash
npm run check-types -w apps/web
npm run lint -w apps/web
npm test -w apps/web
```

## Implementation Tracking

- **Current Status**: `Not Started`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `TBD`
- **Completion Notes**: `TBD`
