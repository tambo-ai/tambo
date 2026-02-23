# Implementation Spec: Tambo Headless Primitives - Phase 0 (Feature Evaluation + Documentation Contract)

**Contract**: ./contract.md  
**Feature Contract**: ./ui-feature-contract.md  
**Estimated Effort**: M

## Technical Approach

Before more component rewrites, define one explicit behavior and composition contract for every in-scope Tambo UI feature. This phase is documentation-first and blocks implementation changes until approved.

## Deliverables

1. Evaluate each in-scope feature and define expected behavior boundaries.
2. Provide canonical compound-component usage examples that mirror Base UI idioms.
3. Define implementation gates and acceptance criteria for downstream phases.
4. Define docs information architecture for base primitive reference pages.
5. Add a reusable Base UI-style docs page template for primitive reference pages.
6. Define docs rollout mapping so primitive docs ship with the relevant implementation slices (not as a late catch-up phase).

## In Scope

- Existing primitive domains: `message`, `toolcall-info`, `reasoning-info`, `message-input`
- New base primitive domain: `elicitation` (and MessageInput integration contract)
- New base primitive domains: `thread-history`, `thread-dropdown`, `thread-content`
- New base primitive domain: `mcp-components` (will need deep analysis)
- Registry block contracts: `message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, `control-bar`
- Registry behavior contracts: `thread-history`, `canvas-space`, `message-suggestions`
- Base primitive docs template + page taxonomy for docs site
- Base primitive docs page structure aligned to Base UI docs heading pattern (`Demo`, `Anatomy`, `Examples`, `API reference`)

## Out of Scope

- New base primitive domains for composed message-thread-\* blocks, map, form, and input-fields
- Actual component implementation changes (except rollback/stabilization)
- Styling decisions beyond what is needed for usage examples

## Feedback Strategy

**Inner-loop command**: `npm run check-types`  
**Playground**: Markdown contracts and usage examples under `plans/tambo-headless-primitives/`

## Approval Checklist

- [ ] Every in-scope feature has a behavior contract.
- [ ] Every in-scope feature has at least one canonical usage example.
- [ ] MessageInput contract reflects desired declarative composition shape.
- [ ] Contract clearly separates behavior ownership (`react-ui-base`) from styling ownership (`ui-registry`).
- [ ] Contract includes explicit implementation gate.
- [ ] Base primitive docs template exists and is referenced by later phases.
- [ ] Docs rollout matrix is explicit and aligned to vertical slices.

## Validation Commands

```bash
npm run check-types
npm run lint
```

## Implementation Tracking

- **Current Status**: `Not Started`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `TBD`
- **Completion Notes**: `TBD`
