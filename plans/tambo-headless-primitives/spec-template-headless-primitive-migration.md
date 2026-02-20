# Implementation Template: Headless Primitive Migration Pattern

**Contract**: ./contract.md
**Applies to**: primitive namespace migrations in `packages/react-ui-base`

## Pattern

For each primitive namespace migration:

1. Keep the public compound namespace export shape (`Namespace.Root`, etc.).
2. Replace Radix Slot + `asChild` composition with Base UI render composition.
3. Standardize render prop typing using exported `useRender.*` types directly.
4. Ensure context values are memoized and state transitions remain explicit.
5. Keep styling concerns out of base package.

## Standard File Changes

### Modified Files (namespace-scoped)

- `packages/react-ui-base/src/{namespace}/index.tsx`
- `packages/react-ui-base/src/{namespace}/**/*.tsx`
- `packages/react-ui-base/src/index.ts`

### Optional New Files

- `packages/react-ui-base/src/{namespace}/**/*.test.tsx`
- `packages/react-ui-base/src/{namespace}/**/*.test.ts`

## Implementation Details

### 1. Render API normalization

- Replace current prop unions and ad-hoc `children`/`render` handling with `@base-ui/react/use-render`.
- Use `@base-ui/react/merge-props` to merge generated/consumer props deterministically.
- Use explicit runtime errors for missing required context dependencies.

### 2. Composition and accessibility

- Keep semantic tags by default (`button`, `div`, `span`, etc.) and data attributes used by styled consumers.
- Preserve aria attributes and keyboard behavior.
- Keep toggle/expand state handling colocated in root contexts.

### 3. Context and re-render safety

- Keep context values memoized with minimal dependency arrays.
- Derive state from source-of-truth hooks and message blocks; avoid duplicated derived state where possible.
- Preserve fail-fast guards for invalid usage outside required root providers.

## Testing Pattern

### Unit coverage

- Context-required usage throws expected errors.
- Render function path and static children path both work.
- Open/close state behavior for collapsible primitives.
- Data attributes and aria attributes remain stable for consumer styling.

### Regression coverage

- Verify behavior parity for existing test fixtures.
- Add tests when previously untested branches become migration hotspots.

## Feedback Strategy

**Inner-loop command**: `npm run test -w packages/react-ui-base -- {namespace}`

**Playground**: Scoped Jest tests in `packages/react-ui-base`.

**Why this approach**: primitive migrations are mostly behavior and composition; targeted tests give the fastest loop without requiring UI boot.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run lint -w packages/react-ui-base
npm run test -w packages/react-ui-base
npm run build -w packages/react-ui-base
```
