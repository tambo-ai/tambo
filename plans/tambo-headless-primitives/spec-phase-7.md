# Implementation Spec: Tambo Headless Primitives - Phase 7 (Stabilization, Cleanup, Release Gate)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Final stabilization pass after all vertical slices land. Focus on removing residual drift, validating exports/tests, and hardening release readiness.

## Scope

### In Scope

- Remove stale references to pre-contract architecture.
- Verify package exports and import paths.
- Verify first-party consumers compile together.
- Final pass on TODOs and intentional deferred items (rename API wiring TODO remains intentionally deferred).

### Out of Scope

- New behavior/features.
- Additional contract changes.

## File Changes

### Modified Files

| File Path                              | Changes                                          |
| -------------------------------------- | ------------------------------------------------ |
| `packages/react-ui-base/src/index.ts`  | final export consistency                         |
| `packages/react-ui-base/package.json`  | final subpath export consistency                 |
| `packages/ui-registry/package.json`    | dependency/export alignment                      |
| `plans/tambo-headless-primitives/*.md` | closeout edits if needed for implemented reality |

## Implementation Details

1. Run full workspace validation and fix integration regressions only.
2. Keep fail-fast behavior and explicit errors intact.
3. Confirm no reintroduction of `asChild`/legacy composition paths.
4. Confirm registry blocks remain registry-owned and base scope remains aligned to contract.

## Testing Requirements

### Full Validation

- [ ] Root typecheck.
- [ ] Root lint.
- [ ] Root tests.
- [ ] Build for touched packages.
- [ ] `ui-registry` export verification.

## Validation Commands

```bash
npm run check-types
npm run lint
npm test
npm run build
npm run verify-exports -w packages/ui-registry
```
