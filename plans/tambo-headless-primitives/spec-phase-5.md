# Implementation Spec: Tambo Headless Primitives - Phase 5 (Vertical Slice: apps/web Consumer Adoption)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Adopt the updated base/registry contracts in `apps/web` as the first production consumer slice. API stability for old wrappers is not required in this phase.

## Scope

### In Scope

- Migrate `apps/web` wrappers to updated primitive/block contracts.
- Align message input integration points with new submit/stop/elicitation semantics.
- Align thread panel integrations with caller-provided suggestions and updated block APIs.

### Out of Scope

- docs/showcase migration.
- Final contract/documentation cleanup.

## File Changes

### Modified Files

| File Path                                                           | Changes                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `apps/web/components/ui/tambo/message-thread-panel.tsx`             | align with updated registry/base contracts                    |
| `apps/web/components/ui/tambo/message-input-with-interactables.tsx` | align with MessageInput API updates                           |
| `apps/web/hooks/use-interactables-resource-provider.ts`             | verify compatibility with updated resource insertion behavior |
| `apps/web/components/ui/tambo/edit-with-tambo-button.tsx`           | align with updated orchestration contracts where needed       |
| `apps/web/app/subscribe/tambo-subscribe-integration.tsx`            | update usage of input/thread primitives if required           |

## Implementation Details

1. Replace assumptions about old MessageInput toolbar internals.
2. Ensure submit/stop behavior follows primitive state visibility contract.
3. Ensure suggestions are passed from caller configuration, not taken from component internals.
4. Keep app-specific opinionated UX in apps/web wrappers when needed.

## Testing Requirements

### Unit / Integration

| Area                            | Coverage                                               |
| ------------------------------- | ------------------------------------------------------ |
| apps/web thread panel wrappers  | compile and behavior parity for open/close/switch/send |
| apps/web message input wrappers | resource/prompt/file/send/stop flows                   |

### Manual Testing

- [ ] Validate apps/web message send/stop/file/image flow.
- [ ] Validate apps/web panel thread switching + suggestions.
- [ ] Validate apps/web interactables insertion path.

## Validation Commands

```bash
npm run check-types -w apps/web
npm run lint -w apps/web
npm test -w apps/web
```
