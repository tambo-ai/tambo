---
phase: 04-user-confirmation
plan: 02
subsystem: cli/user-confirmation
tags: [orchestrator, confirmation-flow, plan-presenter, tdd, inquirer]
dependencies:
  requires:
    - cli/plan-generation (InstallationPlan types)
    - cli/user-confirmation/types (PlanItem, ConfirmationResult, FileDiff)
    - cli/user-confirmation/diff-generator (generateFileDiff)
    - cli/user-confirmation/diff-display (displayFileDiff, displayNewFileMessage)
    - cli/user-confirmation/content-generator (generateContentForRecommendation)
    - cli/user-confirmation/plan-presenter (planToCheckboxItems, displayPlanSummary, filterPlanBySelection)
    - cli/interactive (isInteractive, NonInteractiveError)
    - "@inquirer/prompts" (checkbox, confirm)
  provides:
    - confirmPlan orchestrator (complete confirmation flow)
    - planToCheckboxItems (InstallationPlan to PlanItem array conversion)
    - displayPlanSummary (terminal output with counts and confidence)
    - filterPlanBySelection (filtered InstallationPlan based on selection)
  affects:
    - cli/commands (will consume confirmPlan in Phase 5)
tech-stack:
  added:
    - "@inquirer/prompts": interactive checkbox and confirm prompts
  patterns:
    - TDD: RED → GREEN for all implementation
    - Auto-approval: --yes flag selects high-confidence items (>= 0.8)
    - Non-interactive handling: throws NonInteractiveError with guidance
key-files:
  created:
    - cli/src/utils/user-confirmation/plan-presenter.ts
    - cli/src/utils/user-confirmation/plan-presenter.test.ts
    - cli/src/utils/user-confirmation/index.ts
    - cli/src/utils/user-confirmation/index.test.ts
  modified: []
decisions:
  - title: Use @inquirer/prompts for interactive prompts
    rationale: Modular inquirer package with better ESM support and modern API
    alternatives: [full inquirer package, prompts package, enquirer]
    impact: Clean checkbox/confirm API with required validation built-in
  - title: Auto-approve high-confidence items (>= 0.8) in --yes mode
    rationale: 80% confidence threshold balances automation with safety
    alternatives: [approve all items, require explicit list, different threshold]
    impact: Reasonable default that users can override interactively
  - title: Provider setup always included regardless of confidence
    rationale: Provider is required for any Tambo functionality to work
    alternatives: [make provider optional, allow deselection]
    impact: Prevents broken installations where provider is missing
  - title: Generate real diffs in interactive mode, skip in --yes mode
    rationale: Interactive users want to see changes; --yes users trust automation
    alternatives: [always generate diffs, never generate diffs]
    impact: Faster --yes mode; interactive users get detailed preview
  - title: Display summary before checklist
    rationale: Users need context (item counts, avg confidence) before selecting
    alternatives: [show summary after, no summary]
    impact: Better user experience with informed decision-making
metrics:
  duration_seconds: 201
  tasks_completed: 2
  files_created: 4
  files_modified: 0
  tests_added: 11
  tests_passing: 27
  commits: 2
  lines_added: ~700
  completed_at: "2026-02-13"
---

# Phase 04 Plan 02: Confirmation Orchestrator Summary

**One-liner:** Interactive confirmation flow with checklist selection, unified diff display, and --yes auto-approval mode for high-confidence items (>= 80%).

## Objective

Build the plan presenter (checklist conversion) and confirmPlan orchestrator that ties together checklist selection, diff display, and final confirmation. Completes the user confirmation flow so Phase 5 receives an approved, filtered InstallationPlan.

## Approach

Followed TDD protocol (RED → GREEN) for both tasks:

1. **Task 1: Plan Presenter** - Convert InstallationPlan to PlanItem checklist items with pre-selection logic
2. **Task 2: confirmPlan Orchestrator** - Orchestrate the full confirmation flow with interactive and non-interactive modes

## Implementation Details

### Task 1: Plan Presenter (plan-presenter.ts)

**planToCheckboxItems(plan):**

- Converts InstallationPlan to PlanItem[] array for @inquirer/prompts checkbox
- Provider setup: always checked and disabled with "(required)" label
- Component recommendations: `component-{idx}` ids, pre-checked if confidence >= 0.8
- Tool recommendations: `tool-{idx}` ids, pre-checked if confidence >= 0.8
- Interactable recommendations: `interactable-{idx}` ids, pre-checked if confidence >= 0.8
- Chat widget: `chat-widget` id, pre-checked if confidence >= 0.8
- Labels include confidence percentage: "Register UserProfile component (90%)"

**displayPlanSummary(plan):**

- Prints item counts by category (provider: 1, components: N, tools: N, interactables: N, chat widget: 1)
- Calculates and displays average confidence percentage across all items
- Uses chalk for formatting (bold for headers, dim for counts)

**filterPlanBySelection(plan, selectedIds):**

- Filters InstallationPlan to only include selected items
- Provider setup always included (regardless of selection)
- Component/tool/interactable arrays filtered by matching index to id pattern (`component-0` → first component)
- Chat widget: included if "chat-widget" in selectedIds, otherwise empty placeholder (filePath: "", confidence: 0)

### Task 2: confirmPlan Orchestrator (index.ts)

**Non-interactive mode:**

- Checks `!isInteractive()` first
- Without `--yes`: throws NonInteractiveError with guidance message
- With `--yes`: auto-approves all items with confidence >= 0.8 plus provider-setup (always)
  - Converts plan to items, filters by confidence threshold
  - Returns ConfirmationResult with approved: true, selectedItems, and filtered plan
  - No diff generation (faster automation path)

**Interactive mode:**

1. Display plan summary via `displayPlanSummary(plan)`
2. Convert plan to checkbox items via `planToCheckboxItems(plan)`
3. Map to @inquirer/prompts choices format (value, name, checked, disabled)
4. Present checkbox prompt: "Select changes to apply:"
5. For each selected item:
   - Determine filePath and recommendation type from plan
   - Read existing file content (empty string for ENOENT)
   - Generate new content via `generateContentForRecommendation()`
   - Generate unified diff via `generateFileDiff()`
   - Display: new files get `displayNewFileMessage()`, modifications get `displayFileDiff()`
6. Present final confirmation: "Apply selected changes?" (default: true)
7. If not confirmed: return approved: false with original plan
8. If confirmed: return approved: true with filtered plan via `filterPlanBySelection()`

**Re-exports:**

- Types: ConfirmationResult, ConfirmPlanOptions, PlanItem, FileDiff
- Utilities: generateFileDiff, formatDiffForDisplay, displayFileDiff, displayNewFileMessage, planToCheckboxItems, displayPlanSummary, filterPlanBySelection
- Phase 5 can import everything from `./user-confirmation/` barrel index

## Test Coverage

27 tests total, all passing:

**plan-presenter.test.ts (8 tests):**

- planToCheckboxItems converts to PlanItem array with correct structure
- Provider setup always checked and disabled
- High-confidence items (>= 0.8) pre-checked
- Low-confidence items (< 0.8) not pre-checked
- Confidence percentages in labels
- filterPlanBySelection returns filtered plan with only selected items
- Provider always included in filtered plan
- Chat widget filtered based on selection
- displayPlanSummary displays without throwing

**index.test.ts (3 tests):**

- Throws NonInteractiveError when not interactive and --yes not provided
- Auto-approves high-confidence items (>= 0.8) when --yes flag provided
- Always includes provider-setup in --yes mode

**Plus 16 tests from Plan 04-01** (diff-generator, diff-display, content-generator)

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

1. **Use @inquirer/prompts for interactive prompts** - Modular package with better ESM support
2. **Auto-approve threshold at 80% confidence** - Balances automation with safety
3. **Provider setup always included** - Required for any Tambo functionality
4. **Skip diff generation in --yes mode** - Faster automation path
5. **Display summary before checklist** - Users need context for informed decisions

## Verification Results

```bash
npm test -- --testPathPatterns='user-confirmation'
# 5 test suites, 27 tests, all passing

npm run check-types
# No errors

npm run lint
# No errors (fixed nullish coalescing preference)
```

All verification passed ✓

## Files Created

1. `cli/src/utils/user-confirmation/plan-presenter.ts` - Plan to checklist conversion (157 lines)
2. `cli/src/utils/user-confirmation/plan-presenter.test.ts` - Tests (194 lines)
3. `cli/src/utils/user-confirmation/index.ts` - confirmPlan orchestrator (221 lines)
4. `cli/src/utils/user-confirmation/index.test.ts` - Tests (120 lines)

Total: ~700 lines added

## Commits

1. **e4f2a1b1f** - `feat(04-02): implement plan presenter with tests`
   - planToCheckboxItems, displayPlanSummary, filterPlanBySelection
   - TDD: RED → GREEN, 8 tests passing

2. **8cd4f5f62** - `feat(04-02): implement confirmPlan orchestrator with tests`
   - Non-interactive path with --yes auto-approval
   - Interactive path with checkbox, diff display, final confirmation
   - Re-exports for Phase 5 consumption
   - TDD: RED → GREEN, all 27 tests passing

## Next Steps

Phase 5 will consume `confirmPlan()` from this module:

```typescript
import { confirmPlan } from "./utils/user-confirmation/index.js";

const result = await confirmPlan(installationPlan, { yes: options.yes });

if (!result.approved) {
  console.log("User cancelled installation");
  return;
}

// Execute the filtered plan
await executePlan(result.plan);
```

The confirmation flow is now complete and ready for integration into the CLI command.

## Self-Check: PASSED

Verifying all claims made in this summary.

**Files created:**

- ✓ plan-presenter.ts
- ✓ plan-presenter.test.ts
- ✓ index.ts
- ✓ index.test.ts

**Commits:**

- ✓ Commit e4f2a1b1f
- ✓ Commit 8cd4f5f62

**Tests:**

- ✓ 5 test suites passing
- ✓ 27 tests passing

All files created and commits exist as documented.
