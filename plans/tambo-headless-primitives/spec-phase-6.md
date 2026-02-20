# Implementation Spec: Tambo Headless Primitives - Phase 6 (Vertical Slice: Showcase Adoption + Docs IA/Polish)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Adopt updated contracts in non-production first-party consumers (`docs`, `showcase`) as one vertical slice after apps/web. Primitive docs content is authored in Phases 1 and 2; this phase focuses on docs information architecture integration, consistency, and showcase parity.

## Scope

### In Scope

- Update docs/showcase usages of message input, timeline, and thread blocks.
- Remove stale examples that imply baked suggestions or old composition internals.
- Keep docs copies aligned with registry behavior where duplication exists.
- Register and finalize `react-ui-base-primitives` reference section navigation.
- Run a consistency pass over primitive docs pages created in Phases 1 and 2.

### Out of Scope

- New feature development.
- Additional base primitive domain expansion.
- First-pass authoring of primitive docs pages for input/timeline domains.

## File Changes

### Modified Files

| File Path                                                        | Changes                                                           |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `docs/src/components/tambo/*.tsx`                                | align with updated registry/base contracts                        |
| `showcase/src/app/components/**/*.tsx`                           | align primitive examples with new contracts                       |
| `showcase/src/components/generative/*.tsx`                       | align block usage and suggestion sourcing                         |
| `docs/content/docs/reference/meta.json`                          | register `react-ui-base-primitives` section in docs reference nav |
| `docs/content/docs/reference/react-ui-base-primitives/index.mdx` | section landing page and cross-links                              |
| `docs/content/docs/reference/react-ui-base-primitives/meta.json` | finalize page ordering and navigation for primitive docs          |
| `docs/content/docs/reference/react-ui-base-primitives/*.mdx`     | consistency polish (heading structure/API table alignment)        |

## Implementation Details

1. Update examples to show caller-provided suggestions where thread blocks are used.
2. Ensure message input examples reflect submit/stop/elicitation responsibilities correctly.
3. Keep showcase/demo behavior representative of intended consumer patterns.
4. Ensure all primitive docs pages follow the shared Base UI-style template and heading order.
5. Ensure reference navigation exposes primitive docs section cleanly.

## Testing Requirements

### Manual Testing

- [ ] Docs examples render and compile.
- [ ] Showcase block pages render and function.
- [ ] Showcase message primitive pages match current API.
- [ ] Reference nav includes `react-ui-base-primitives`.
- [ ] Primitive docs pages have consistent `Demo`/`Anatomy`/`Examples`/`API reference` structure.

## Validation Commands

```bash
npm run check-types -w docs
npm run check-types -w showcase
npm run lint -w docs
npm run lint -w showcase
npm run build -w docs
```
