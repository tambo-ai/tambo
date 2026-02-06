# Compound Component Refactor Plan

## Summary

This plan covers creating individual PRs for compound components in the `react-ui-base` package. The goal is to break down the large `compound-components` branch into reviewable PRs while ensuring each component is refactored correctly and tested thoroughly.

### Current State

**Branch:** `compound-components`
**Stats:** 142 files changed, +13,030 / -4,206 lines
**Done:** 14 components with complete base primitives, 2 skill documents
**Pending:** 3 components have empty stub directories (no implementation)

---

## Phase 1: Independent Components (Target `main`)

These components have no dependencies on other refactored components. Create PRs in parallel.

| Component              | Linear Issue                                        | Styled Wrapper                                         |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| message-suggestions    | [TAM-1057](https://linear.app/tambo/issue/TAM-1057) | `cli/dist/registry/components/message-suggestions/`    |
| thread-history         | [TAM-1064](https://linear.app/tambo/issue/TAM-1064) | `cli/dist/registry/components/thread-history/`         |
| graph                  | [TAM-1052](https://linear.app/tambo/issue/TAM-1052) | `cli/dist/registry/components/graph/`                  |
| form                   | [TAM-1051](https://linear.app/tambo/issue/TAM-1051) | `cli/dist/registry/components/form/`                   |
| elicitation-ui         | [TAM-1050](https://linear.app/tambo/issue/TAM-1050) | `cli/dist/registry/components/elicitation-ui/`         |
| edit-with-tambo-button | [TAM-1049](https://linear.app/tambo/issue/TAM-1049) | `cli/dist/registry/components/edit-with-tambo-button/` |
| map                    | [TAM-1054](https://linear.app/tambo/issue/TAM-1054) | `cli/dist/registry/components/map/`                    |
| input-fields           | [TAM-1053](https://linear.app/tambo/issue/TAM-1053) | `cli/dist/registry/components/input-fields/`           |
| canvas-space           | [TAM-1047](https://linear.app/tambo/issue/TAM-1047) | `cli/dist/registry/components/canvas-space/`           |

---

## Phase 2: Shared Infrastructure (Target `main`, Merge Before Phase 3)

These components are used by the composed message-thread components.

| Component                    | Linear Issue                                        | Used By                      |
| ---------------------------- | --------------------------------------------------- | ---------------------------- |
| scrollable-message-container | [TAM-1061](https://linear.app/tambo/issue/TAM-1061) | control-bar, message-threads |
| thread-content               | [TAM-1062](https://linear.app/tambo/issue/TAM-1062) | control-bar, message-threads |
| thread-dropdown              | [TAM-1063](https://linear.app/tambo/issue/TAM-1063) | message-thread-collapsible   |

---

## Phase 3: Finish remaining components

Before creating individual PRs, complete these items on the `compound-components` branch:

### Implement Stub Components

These directories exist but contain **no component files**:

| Component                  | Directory                         | Empty Subdirs                         | Linear Issue |
| -------------------------- | --------------------------------- | ------------------------------------- | ------------ |
| message-thread-collapsible | `src/message-thread-collapsible/` | content/, header/, root/, trigger/    | TAM-1058     |
| message-thread-full        | `src/message-thread-full/`        | container/, root/, sidebar/           | TAM-1059     |
| message-thread-panel       | `src/message-thread-panel/`       | content/, resizable/, root/, sidebar/ | TAM-1060     |

### Verify All Components Pass Checklist

Run the test checklist (below) for all 14 existing components before splitting.

---

## Phase 4: Composed Components (Target Branch With Dependencies)

These compose multiple base components and should be merged after Phase 2.

| Component                  | Linear Issue                                        | Dependencies                                            | Target Branch        |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------- | -------------------- |
| control-bar                | [TAM-1048](https://linear.app/tambo/issue/TAM-1048) | MessageInput, ThreadContent, ScrollableMessageContainer | main (after Phase 3) |
| message-thread-full        | [TAM-1059](https://linear.app/tambo/issue/TAM-1059) | All core components                                     | main (after Phase 3) |
| message-thread-panel       | [TAM-1060](https://linear.app/tambo/issue/TAM-1060) | All core components                                     | main (after Phase 3) |
| message-thread-collapsible | [TAM-1058](https://linear.app/tambo/issue/TAM-1058) | All core components + ThreadDropdown                    | main (after Phase 3) |
| mcp-components             | [TAM-1055](https://linear.app/tambo/issue/TAM-1055) | TBD                                                     | main                 |

---

## Test Checklist

### Base Component Tests

- [ ] Component renders without errors
- [ ] All sub-components work within Root context
- [ ] Data attributes exposed correctly for CSS styling (`data-*`)
- [ ] Render props expose expected state
- [ ] No hooks exported from component barrel file (`index.tsx`)
- [ ] Types exported correctly from main `index.ts`
- [ ] Subpath export works (`@tambo-ai/react-ui-base/<component>`)

### Styled Wrapper Tests

- [ ] Styled wrapper imports from base package correctly
- [ ] Styled wrapper composes base sub-components (not duplicating logic)
- [ ] Visual appearance matches original
- [ ] All existing functionality preserved
- [ ] Showcase renders component correctly

---

## Execution Steps

### Per-Component Workflow

```bash
# 1. Create worktree from compound-components
git worktree add ../lachieh-tam-XXXX-component-name compound-components
cd ../lachieh-tam-XXXX-component-name

# 2. Reset to main (keeps all changes as uncommitted)
git reset main

# 3. Stage ONLY this component's changes
git add packages/react-ui-base/src/<component-name>/
git add cli/dist/registry/components/<component-name>/
# Add only the relevant exports to index.ts (may need to manually edit)

# 4. Commit with descriptive message
git commit -m "feat(react-ui-base): add <component-name> compound component"

# 5. Push and create PR
git push -u origin lachieh/tam-XXXX-component-name
gh pr create --base main
```

### Important Notes

1. **Don't forget styled wrappers** - Each PR should include both the base component AND updates to the styled wrapper in `cli/dist/registry/components/`

2. **Index.ts exports** - Be careful to only add the relevant exports for your component to avoid conflicts

3. **Run checks before pushing:**
   ```bash
   npm run lint
   npm run check-types
   npm test
   ```

---

## PR Description Template

```markdown
## Summary

Refactors `<component-name>` to use the compound component pattern with base primitives in `@tambo-ai/react-ui-base`.

### Changes

**Base Component** (`packages/react-ui-base/src/<component>/`)

- Root component with context provider
- Sub-components: <list>
- Data attributes: <list>
- Render props: <list>

**Styled Wrapper** (`cli/dist/registry/components/<component>/`)

- Composes base components from `@tambo-ai/react-ui-base/<component>`
- Applies Tailwind styling via className
- Preserves all existing functionality

Fixes TAM-XXXX

## Test Plan

1. Run `npm run dev` and navigate to showcase (port 8262)
2. Test `<component-name>` in isolation
3. Test `<component-name>` in composed contexts
4. Verify styling matches original
5. Run `npm run lint && npm run check-types && npm test`

## Checklist

- [ ] Base component renders without errors
- [ ] Sub-components work within Root context
- [ ] Data attributes exposed correctly
- [ ] Render props expose expected state
- [ ] Styled wrapper composes base components
- [ ] No hooks exported from barrel file
- [ ] Types exported correctly
```

---

## Verification

After all PRs merged, verify the full system:

```bash
# From repo root
npm run lint
npm run check-types
npm test

# Start showcase
npm run dev

# Test at http://localhost:8262
```
