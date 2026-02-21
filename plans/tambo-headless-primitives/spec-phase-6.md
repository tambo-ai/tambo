# Implementation Spec: Tambo Headless Primitives - Phase 6 (Vertical Slice: docs + showcase Adoption)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Adopt the finalized primitive/registry contracts in `docs` and `showcase` as one slice focused on reference accuracy, runnable examples, and docs information architecture consistency.

Primitive reference authoring is already delivered in Phases 1 and 2. This phase focuses on navigation, consistency, and consumer usage parity.

## Scope

### In Scope

- Update `docs` and `showcase` component usage to current primitive/block contracts.
- Remove stale examples that imply old composition internals or baked suggestions.
- Register/finalize `react-ui-base` reference navigation structure.
- Run a consistency pass on primitive docs pages authored in Phases 1 and 2.
- Ensure docs copies of CLI/registry-driven UI examples reflect current contract boundaries.

### Out of Scope

- New primitive behavior.
- Additional primitive docs domains beyond agreed scope.
- apps/web production feature changes.

## File Changes

### Modified Files

| File Path                                             | Changes                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `docs/src/components/tambo/*.tsx`                     | Align docs examples with updated primitive + registry contracts       |
| `showcase/src/app/components/**/*.tsx`                | Align showcase examples with updated composition model                |
| `showcase/src/components/generative/*.tsx`            | Align thread blocks/suggestions usage with caller-provided semantics  |
| `docs/content/docs/reference/meta.json`               | Register/position `react-ui-base` reference section                   |
| `docs/content/docs/reference/react-ui-base/index.mdx` | Update landing content and cross-links                                |
| `docs/content/docs/reference/react-ui-base/meta.json` | Finalize page order and navigation consistency                        |
| `docs/content/docs/reference/react-ui-base/*.mdx`     | Consistency polish for heading/API/styling-hook alignment             |

## Implementation Details

1. Ensure all examples reflect render-prop composition and current namespace exports.
2. Ensure docs/showcase thread block usage passes suggestions from caller-owned data.
3. Keep docs structure aligned to `spec-template-base-primitive-doc-page.md` (`Demo`, `Anatomy`, `Examples`, `API reference`).
4. Preserve clear separation statements: behavior in `react-ui-base`, styling/orchestration in `ui-registry`.
5. Keep examples minimal, copy/pasteable, and free from hidden fallback assumptions.

## Testing Requirements

### Manual Testing

- [ ] Docs examples compile and render.
- [ ] Showcase pages compile and render with updated APIs.
- [ ] Primitive docs pages preserve required heading structure.
- [ ] Reference navigation exposes and orders `react-ui-base` pages correctly.
- [ ] Showcase thread blocks demonstrate caller-provided suggestions behavior.

## Validation Commands

```bash
npm run check-types -w docs
npm run check-types -w showcase
npm run lint -w docs
npm run lint -w showcase
npm run build -w docs
```
