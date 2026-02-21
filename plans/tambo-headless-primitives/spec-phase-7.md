# Implementation Spec: Tambo Headless Primitives - Phase 7 (Stabilization, Cleanup, Release Gate)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Execute a final integration gate after all implementation slices land. This phase is strictly for stabilization: contract drift cleanup, dependency/export verification, and cross-workspace confidence checks.

## Scope

### In Scope

- Remove stale references to pre-contract composition mechanics.
- Verify `react-ui-base` exports and subpath exports are consistent with shipped namespaces.
- Verify registry and first-party consumer packages compile together.
- Confirm no first-party reintroduction of `asChild`, Radix Slot, or custom render helpers.
- Confirm registry components/blocks compose primitives for Tambo-specific behavior boundaries.
- Preserve intentional deferred items (rename API wiring TODO remains deferred).

### Out of Scope

- New feature work.
- New contract definitions.
- Additional primitive domain expansion.

## File Changes

### Modified Files

| File Path                              | Changes                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `packages/react-ui-base/src/index.ts`  | Final namespace export alignment                             |
| `packages/react-ui-base/package.json`  | Final subpath export alignment                               |
| `packages/ui-registry/package.json`    | Dependency/export alignment for finalized primitive usage    |
| `plans/tambo-headless-primitives/*.md` | Final closeout edits if implementation reality requires sync |

## Implementation Details

1. Run full workspace validation and only fix regressions or contract drift.
2. Keep explicit fail-fast errors and ownership boundaries intact.
3. Verify no first-party registry component calls Tambo hooks directly where a base primitive contract exists.
4. Confirm docs/showcase/apps/web examples match shipped APIs and behavior expectations.

## Testing Requirements

### Full Validation

- [ ] Root typecheck passes.
- [ ] Root lint passes.
- [ ] Root tests pass.
- [ ] Build passes for touched packages.
- [ ] `ui-registry` export verification passes.
- [ ] Contract audit checks pass (`asChild`, Radix Slot, custom `useRender`, direct registry hook usage).

## Validation Commands

```bash
npm run check-types
npm run lint
npm test
npm run build
npm run verify-exports -w packages/ui-registry
rg "asChild" packages/react-ui-base packages/ui-registry
rg "@radix-ui/react-slot" packages/react-ui-base packages/ui-registry
rg "useTambo" packages/ui-registry/src/components
```

## Implementation Tracking

- **Current Status**: `Not Started`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `TBD`
- **Completion Notes**: `TBD`
