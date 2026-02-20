# Implementation Spec: Tambo Headless Primitives - Phase 2 (Vertical Slice: Message Timeline Rendering)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Deliver one complete read-path vertical slice for message timeline rendering:

- message shell/content/images/rendered-component area
- tool call state + details + result
- reasoning status + expanded steps

This phase finalizes the behavior + composition seam between `react-ui-base` primitives and registry message rendering.

## Scope

### In Scope

- Hardening/refinement of `message`, `toolcall-info`, and `reasoning-info` primitives.
- Registry message composition cleanup.
- Thread timeline rendering cleanup in `thread-content`.
- Author Base UI-style primitive docs pages for `Message`, `ToolcallInfo`, and `ReasoningInfo` using `spec-template-base-primitive-doc-page.md`.

### Out of Scope

- Thread controls and thread block container APIs.
- Suggestion defaults and block hotkeys.

## File Changes

### Modified Files

| File Path                                                                 | Changes                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `packages/react-ui-base/src/message/**/*.tsx`                             | Final render/state contract hardening                       |
| `packages/react-ui-base/src/reasoning-info/**/*.tsx`                      | Final reasoning behavior hardening                          |
| `packages/react-ui-base/src/toolcall-info/**/*.tsx`                       | Final tool association/status behavior hardening            |
| `packages/ui-registry/src/components/message/message.tsx`                 | Styled composition cleanup and dead-path removal            |
| `packages/ui-registry/src/components/thread-content/thread-content.tsx`   | Clean timeline mapping behavior over message content blocks |
| `docs/content/docs/reference/react-ui-base-primitives/message.mdx`        | Message primitive docs page                                 |
| `docs/content/docs/reference/react-ui-base-primitives/toolcall-info.mdx`  | ToolcallInfo primitive docs page                            |
| `docs/content/docs/reference/react-ui-base-primitives/reasoning-info.mdx` | ReasoningInfo primitive docs page                           |
| `docs/content/docs/reference/react-ui-base-primitives/meta.json`          | Add timeline primitive docs pages to section order          |

## Implementation Details

1. Preserve fail-fast context behavior for base roots.
2. Keep data-slot/data-state attributes stable for styling.
3. Remove dead rendering branches that cannot execute under current message model.
4. Ensure timeline rendering remains exhaustive over known content block types.
5. Docs pages follow Base UI heading structure and include runtime behavior notes and styling hooks.

## Testing Requirements

### Unit Tests

| Test File                                                                    | Coverage                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| `packages/react-ui-base/src/toolcall-info/root/toolcall-info.test.tsx`       | tool association, status, expand/collapse |
| `packages/react-ui-base/src/reasoning-info/root/reasoning-info-root.test.ts` | reasoning lifecycle + context fallback    |
| `packages/ui-registry/src/components/message/message-content.test.tsx`       | styled message rendering integration      |
| `packages/ui-registry/src/components/message/format-tool-result.test.tsx`    | tool result rendering parity              |

### Manual Testing

- [ ] Assistant/user message rendering variants.
- [ ] Toolcall loading/success/error display transitions.
- [ ] Reasoning expand/collapse behavior and status text.
- [ ] Rendered component area behavior and canvas button path.
- [ ] Validate `message`, `toolcall-info`, and `reasoning-info` docs pages compile and match template structure.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- message toolcall-info reasoning-info
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- message thread-content
npm run check-types -w docs
npm run lint -w docs
```
