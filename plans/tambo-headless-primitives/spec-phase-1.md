# Implementation Spec: Tambo Headless Primitives - Phase 1 (Vertical Slice: Message Input + Elicitation)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: L

## Technical Approach

Deliver one complete user-facing vertical slice for authoring messages:

- typing/editing input
- submitting and stopping generation
- file/image staging
- elicitation mode switching

This phase makes base primitives own the input/elicitation behavior boundary and keeps `ui-registry` focused on styling/composition.

## Scope

### In Scope

- Add dedicated `Elicitation` primitives to `react-ui-base`.
- Update `MessageInput` base primitives to own hide-input/show-elicitation behavior.
- Add `SubmitButton` and `StopButton` visibility semantics (`keepMounted` + `data-hidden`).
- Remove toolbar child-type partitioning from registry input composition.
- Author Base UI-style primitive docs pages for `MessageInput` and `Elicitation` using `spec-template-base-primitive-doc-page.md`.

### Out of Scope

- Thread block API cleanup.
- Thread suggestions defaults cleanup.
- apps/web migration.

## File Changes

### New Files

| File Path                                                     | Changes                                  |
| ------------------------------------------------------------- | ---------------------------------------- |
| `packages/react-ui-base/src/elicitation/index.tsx`            | Elicitation namespace export             |
| `packages/react-ui-base/src/elicitation/**/*.tsx`             | Elicitation root/parts/context           |
| `docs/content/docs/reference/react-ui-base/meta.json`         | Primitive docs section page registration |
| `docs/content/docs/reference/react-ui-base/message-input.mdx` | MessageInput primitive docs page         |
| `docs/content/docs/reference/react-ui-base/elicitation.mdx`   | Elicitation primitive docs page          |

### Modified Files

| File Path                                                             | Changes                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/react-ui-base/src/index.ts`                                 | Export elicitation namespace                                               |
| `packages/react-ui-base/package.json`                                 | Add elicitation subpath export                                             |
| `packages/react-ui-base/src/message-input/**/*.tsx`                   | Base-owned input/elicitation mode + submit/stop mount/visibility semantics |
| `packages/ui-registry/src/components/message-input/message-input.tsx` | Styled composition only; no child-type splitting logic                     |

## Implementation Details

### Base behavior ownership

1. `MessageInput.Root` remains the source of submit/cancel/drag/image lifecycle behavior.
2. `MessageInput` mode switching is handled by base parts, not registry conditional composition.
3. `SubmitButton` and `StopButton` expose visibility in state and `data-hidden`, and support `keepMounted`.
4. `Elicitation` primitive is independently composable and usable outside MessageInput.
5. Docs pages follow Base UI heading structure: `Demo` -> `Anatomy` -> `Examples` -> `API reference`.

### Registry composition rules

1. Presence of a layout item controls availability.
2. Toolbar does not re-order buttons based on element type checks.
3. Styling continues via classes/data attributes only.

## Testing Requirements

### Unit Tests

| Test File                                                                | Coverage                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `packages/react-ui-base/src/message-input/**/*.test.tsx`                 | submit/stop visibility semantics, mode switching, drag/images |
| `packages/react-ui-base/src/elicitation/**/*.test.tsx`                   | request/response flow and composability                       |
| `packages/ui-registry/src/components/message-input/text-editor.test.tsx` | editor integration with updated primitive contracts           |

### Manual Testing

- [ ] Validate send -> stop -> send loop.
- [ ] Validate `keepMounted` + `data-hidden` behavior for submit/stop controls.
- [ ] Validate input hidden while elicitation active, then restored when resolved.
- [ ] Validate staged images + max image constraints.
- [ ] Validate `message-input` and `elicitation` docs pages compile and match template structure.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- message-input elicitation
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- message-input
npm run check-types -w docs
npm run lint -w docs
```
