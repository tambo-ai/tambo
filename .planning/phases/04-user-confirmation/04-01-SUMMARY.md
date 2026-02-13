---
phase: 04-user-confirmation
plan: 01
subsystem: cli/user-confirmation
tags: [types, diff-generation, diff-display, content-generation, tdd]
dependencies:
  requires:
    - cli/plan-generation (InstallationPlan types)
    - diff package (createTwoFilesPatch)
    - chalk package (terminal colors)
  provides:
    - PlanItem, FileDiff, ConfirmationResult, ConfirmPlanOptions types
    - generateFileDiff (unified diff generation)
    - formatDiffForDisplay, displayFileDiff, displayNewFileMessage (colored terminal output)
    - generateContentForRecommendation (file content transformation)
  affects:
    - cli/confirmation-orchestrator (will consume these utilities in 04-02)
tech-stack:
  added:
    - diff: unified diff generation for file modifications
  patterns:
    - TDD: RED → GREEN → REFACTOR for all three tasks
    - Template-based transformations: string manipulation for code generation
    - Best-effort pattern matching: graceful fallback when structure doesn't match
key-files:
  created:
    - cli/src/utils/user-confirmation/types.ts
    - cli/src/utils/user-confirmation/diff-generator.ts
    - cli/src/utils/user-confirmation/diff-generator.test.ts
    - cli/src/utils/user-confirmation/diff-display.ts
    - cli/src/utils/user-confirmation/diff-display.test.ts
    - cli/src/utils/user-confirmation/content-generator.ts
    - cli/src/utils/user-confirmation/content-generator.test.ts
  modified: []
decisions:
  - title: Use diff package for unified patch generation
    rationale: Battle-tested, standard unified diff format, better than regex-based diff
    alternatives: [custom diff implementation, git diff subprocess]
    impact: Reliable diff generation with proper context lines
  - title: Template-based content transformations (not LLM-generated)
    rationale: Predictable, fast, no API costs, deterministic output
    alternatives: [LLM generation, AST manipulation with ts-morph]
    impact: Simple string-based transformations with graceful fallback
  - title: Best-effort pattern matching with fallback
    rationale: Real codebases have varied structures; failing gracefully is better than crashing
    alternatives: [strict AST parsing, require specific code structure]
    impact: More robust across different coding styles; warnings guide debugging
  - title: Separate types file instead of inline types
    rationale: Shared types used across diff-generator, diff-display, content-generator modules
    alternatives: [inline types in each module, barrel export]
    impact: Single source of truth for confirmation flow types
metrics:
  duration_seconds: 335
  tasks_completed: 3
  files_created: 7
  files_modified: 0
  tests_added: 16
  tests_passing: 16
  commits: 4
  lines_added: ~1000
  completed_at: "2026-02-13"
---

# Phase 04 Plan 01: Confirmation Types & Diff Utilities Summary

**One-liner:** Template-based content transformations with unified diff generation for all 5 recommendation types (provider, component, tool, interactable, chat-widget).

## Objective

Define confirmation types and implement diff generation/display utilities for the user confirmation flow. Provides the type foundation and diff primitives that the confirmation orchestrator (Plan 02) will compose into the interactive approval flow.

## Approach

Followed TDD protocol (RED → GREEN → REFACTOR) for all three tasks:

1. **Task 1: Types & Diff Generator** - Define core types (PlanItem, FileDiff, ConfirmationResult) and implement generateFileDiff with ENOENT handling
2. **Task 2: Diff Display** - Implement colored terminal output with chalk (green/red/cyan/dim/bold)
3. **Task 3: Content Generator** - Template-based transformations for all 5 recommendation types

## Implementation Details

### Types (types.ts)

- **PlanItem**: Checklist item with id, type, label, confidence, checked state
- **FileDiff**: File diff with isNew flag, oldContent, newContent, and unified patch
- **ConfirmationResult**: Approval result with selectedItems and filtered plan
- **ConfirmPlanOptions**: Configuration (yes flag for auto-approval)

### Diff Generation (diff-generator.ts)

- **generateFileDiff**: Reads existing file, generates unified patch using `diff.createTwoFilesPatch`
- **ENOENT handling**: Returns `isNew: true` and empty patch for new files
- **Error handling**: Re-throws non-ENOENT errors (permissions, etc.)
- Uses 3 lines of context in unified diff format

### Diff Display (diff-display.ts)

- **formatDiffForDisplay**: Colorizes patch lines based on prefix
  - `@@` hunk headers → cyan
  - `+` additions → green
  - `-` deletions → red
  - `---`/`+++` file headers → bold dim
  - Context lines → dim
  - Index/separator → bold
- **displayFileDiff**: Prints file path header + colored patch
- **displayNewFileMessage**: Pretty message for new file creation

### Content Generator (content-generator.ts)

Five transformation functions, one per recommendation type:

1. **Provider setup** (`applyProviderSetup`):
   - Insert `import { TamboProvider } from "@tambo-ai/react"`
   - Wrap JSX children in `<TamboProvider>...</TamboProvider>`
   - Pattern match: find last import, find return statement JSX

2. **Component registration** (`applyComponentRegistration`):
   - Append `suggestedRegistration` snippet to end of file
   - Simple: trim content, add blank line, append snippet

3. **Tool creation** (`applyToolCreation`):
   - Generate complete tool file template from scratch
   - Includes zod import, schema export, async function stub
   - For new files (empty existingContent)

4. **Interactable** (`applyInteractable`):
   - Insert `import { useTamboInteractable } from "@tambo-ai/react"`
   - Add `const { ref } = useTamboInteractable();` at function start
   - Add `ref={ref}` prop to first JSX element in return

5. **Chat widget** (`applyChatWidget`):
   - Insert `import { TamboChatWidget } from "@tambo-ai/react"`
   - Add `<TamboChatWidget position="..." />` before closing tag
   - Pattern match: find outermost closing JSX tag

**Fallback behavior**: All transformations have try-catch with console.warn; return original content unchanged if pattern matching fails.

## Test Coverage

16 tests total, all passing:

- **diff-generator.test.ts** (3 tests):
  - Existing file produces patch with +/- lines
  - New file (ENOENT) returns isNew=true and empty patch
  - Non-ENOENT errors are re-thrown

- **diff-display.test.ts** (7 tests):
  - formatDiffForDisplay colorizes additions, deletions, headers, context
  - displayNewFileMessage outputs correct message
  - displayFileDiff prints file path + formatted patch

- **content-generator.test.ts** (6 tests):
  - Provider setup wraps JSX in TamboProvider
  - Component registration appends snippet
  - Tool creation returns complete template
  - Interactable adds hook and ref prop
  - Chat widget adds import and component
  - Fallback returns original content and logs warning

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

1. **Used diff package for unified patch generation** - Reliable, standard format, better than regex-based diff
2. **Template-based transformations (not LLM)** - Predictable, fast, no API costs, deterministic
3. **Best-effort pattern matching with fallback** - More robust across varied codebases
4. **Separate types file** - Shared types across multiple modules

## Verification Results

```bash
npm test -- --testPathPatterns='user-confirmation'
# 3 test suites, 16 tests, all passing

npm run check-types
# No errors

npm run lint
# No errors
```

All verification passed ✓

## Files Created

1. `cli/src/utils/user-confirmation/types.ts` - Core types (88 lines)
2. `cli/src/utils/user-confirmation/diff-generator.ts` - Diff generation (61 lines)
3. `cli/src/utils/user-confirmation/diff-generator.test.ts` - Tests (60 lines)
4. `cli/src/utils/user-confirmation/diff-display.ts` - Terminal display (77 lines)
5. `cli/src/utils/user-confirmation/diff-display.test.ts` - Tests (180 lines)
6. `cli/src/utils/user-confirmation/content-generator.ts` - Transformations (307 lines)
7. `cli/src/utils/user-confirmation/content-generator.test.ts` - Tests (243 lines)

## Next Steps

Plan 04-02 will compose these utilities into the confirmation orchestrator, which orchestrates the interactive approval flow with the following sequence:

1. Convert InstallationPlan to PlanItem[] checklist
2. Show interactive checkbox prompt
3. For each selected item, generate content and display diff
4. Confirm approval
5. Return ConfirmationResult with filtered plan

## Self-Check

Verifying all claims made in this summary:

```bash
# Check created files exist
[ -f cli/src/utils/user-confirmation/types.ts ] && echo "✓ types.ts"
[ -f cli/src/utils/user-confirmation/diff-generator.ts ] && echo "✓ diff-generator.ts"
[ -f cli/src/utils/user-confirmation/diff-generator.test.ts ] && echo "✓ diff-generator.test.ts"
[ -f cli/src/utils/user-confirmation/diff-display.ts ] && echo "✓ diff-display.ts"
[ -f cli/src/utils/user-confirmation/diff-display.test.ts ] && echo "✓ diff-display.test.ts"
[ -f cli/src/utils/user-confirmation/content-generator.ts ] && echo "✓ content-generator.ts"
[ -f cli/src/utils/user-confirmation/content-generator.test.ts ] && echo "✓ content-generator.test.ts"

# Check commits exist
git log --oneline --all | grep -q "4e7e3dc19" && echo "✓ Commit 4e7e3dc19"
git log --oneline --all | grep -q "50450862f" && echo "✓ Commit 50450862f"
git log --oneline --all | grep -q "3457df7a0" && echo "✓ Commit 3457df7a0"
git log --oneline --all | grep -q "7080460c5" && echo "✓ Commit 7080460c5"
```

## Self-Check: PASSED

All files created and commits exist as documented.
