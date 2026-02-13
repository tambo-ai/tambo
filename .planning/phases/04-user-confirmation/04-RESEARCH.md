# Phase 4: User Confirmation - Research

**Researched:** 2026-02-13
**Domain:** Interactive CLI confirmation flows with diff preview
**Confidence:** HIGH

## Summary

Phase 4 implements an interactive confirmation flow that allows users to review and approve the installation plan generated in Phase 3 before any code modifications occur. The implementation uses the existing `inquirer` package (already installed) for interactive prompts and the `diff` package (already installed) for generating unified diffs. The core pattern follows industry-standard CLI tools like Terraform, Helm, and Drizzle: preview changes first, present as batch checklist, show diffs for each file, then request confirmation.

The CLI already has comprehensive non-interactive detection via `isInteractive()` and `interactivePrompt()` utilities in `cli/src/utils/interactive.ts`. The phase extends this pattern with checkbox multi-select for plan item selection and unified diff display for file change preview.

**Primary recommendation:** Use `@inquirer/checkbox` for batch checklist UI with pre-selected items, `diff.createTwoFilesPatch()` for generating unified diffs of file changes, and extend existing `interactivePrompt()` pattern to support `--yes` flag for non-interactive CI/CD workflows.

## Standard Stack

### Core

| Library              | Version        | Purpose                   | Why Standard                                                                              |
| -------------------- | -------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `inquirer`           | ^13.2.1        | Interactive CLI prompts   | Already installed; industry standard for Node.js CLIs; provides checkbox, confirm, select |
| `@inquirer/checkbox` | (via inquirer) | Multi-select checklist UI | Part of inquirer v9+; enables batch item selection/deselection                            |
| `@inquirer/prompts`  | (via inquirer) | Modern prompt API         | Already used in `auth.ts`; cleaner API than classic inquirer                              |
| `diff`               | ^8.0.3         | Unified diff generation   | Already installed; standard for text diffing in Node.js                                   |
| `chalk`              | ^5.6.0         | Terminal colors/styling   | Already installed; universal choice for CLI text formatting                               |

### Supporting

| Library      | Version | Purpose                     | When to Use                                                  |
| ------------ | ------- | --------------------------- | ------------------------------------------------------------ |
| `ora`        | ^9.0.0  | Spinner/progress indicators | Already installed; useful for "generating diffs..." progress |
| `cli-table3` | ^0.6.5  | Table formatting            | Already installed; could display plan summary table          |

### Alternatives Considered

| Instead of  | Could Use                | Tradeoff                                                                                        |
| ----------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| inquirer    | @clack/prompts           | Clack has better aesthetics but would add new dependency; inquirer already installed and proven |
| diff        | fast-myers-diff          | Fast-myers-diff is faster but diff is more mature with unified format support built-in          |
| Checkbox UI | Custom TUI (blessed/ink) | Over-engineered for simple checklist; violates "simple prompts sufficient" decision             |

**Installation:**

```bash
# No new dependencies needed
# inquirer ^13.2.1 and diff ^8.0.3 already in cli/package.json
```

## Architecture Patterns

### Recommended Project Structure

```
cli/src/
├── commands/
│   └── magic-init.ts                    # Main command entry point
├── utils/
│   ├── plan-generation/                 # Phase 3 (existing)
│   │   ├── index.ts                     # generatePlan() orchestrator
│   │   └── types.ts                     # InstallationPlan type
│   ├── user-confirmation/               # Phase 4 (new)
│   │   ├── index.ts                     # confirmPlan() orchestrator
│   │   ├── types.ts                     # ConfirmationResult, PlanItem types
│   │   ├── plan-presenter.ts            # Display plan as checklist
│   │   ├── diff-generator.ts            # Generate diffs for file changes
│   │   └── diff-display.ts              # Format/display diffs to terminal
│   └── interactive.ts                   # Existing utilities (isInteractive, etc)
```

### Pattern 1: Batch Checklist Confirmation

**What:** Present entire plan as interactive checkbox list, user selects/deselects items, returns approved subset

**When to use:** When plan has multiple independent items that can be individually accepted/rejected

**Example:**

```typescript
// Source: Context7 Inquirer.js + established patterns
import { checkbox } from "@inquirer/prompts";
import type { InstallationPlan } from "../plan-generation/types.js";
import { interactivePrompt } from "../interactive.js";

export interface PlanItem {
  id: string;
  type: "provider" | "component" | "tool" | "interactable" | "chat-widget";
  label: string; // Human-readable description
  confidence: number; // 0.0-1.0 from Phase 3
  checked: boolean; // Pre-selected if confidence >= threshold
  disabled?: boolean; // Provider setup is required, can't deselect
}

export async function presentPlanChecklist(
  items: PlanItem[],
): Promise<string[]> {
  // In non-interactive mode, throw NonInteractiveError with guidance
  const choices = items.map((item) => ({
    value: item.id,
    name: item.label,
    checked: item.checked,
    disabled: item.disabled ? "(required)" : false,
  }));

  const selected = await checkbox({
    message: "Select changes to apply (space to toggle, enter to confirm):",
    choices,
    required: true, // At least provider setup must be selected
    validate: (items) => {
      const hasProvider = items.some((id) => id.startsWith("provider-"));
      if (!hasProvider) {
        return "Provider setup is required for Tambo to function";
      }
      return true;
    },
  });

  return selected;
}
```

### Pattern 2: Unified Diff Generation

**What:** Generate unified diff showing line-by-line changes for file modifications

**When to use:** Any file modification operation (edit existing file, not file creation)

**Example:**

```typescript
// Source: Context7 jsdiff + established patterns
import { createTwoFilesPatch } from "diff";
import fs from "node:fs/promises";

export interface FileDiff {
  filePath: string;
  oldContent: string;
  newContent: string;
  patch: string;
}

export async function generateFileDiff(
  filePath: string,
  newContent: string,
): Promise<FileDiff> {
  // Read existing file content (if exists)
  let oldContent = "";
  try {
    oldContent = await fs.readFile(filePath, "utf-8");
  } catch (error) {
    // File doesn't exist - this is a creation, not modification
    // For new files, diff is not meaningful; just show file will be created
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  // Generate unified diff
  const patch = createTwoFilesPatch(
    filePath, // old filename
    filePath, // new filename
    oldContent, // old content
    newContent, // new content
    "Current", // old header
    "After changes", // new header
    { context: 3 }, // 3 lines of context
  );

  return {
    filePath,
    oldContent,
    newContent,
    patch,
  };
}
```

### Pattern 3: Diff Display with Syntax Highlighting

**What:** Format unified diff with colors for additions (green), deletions (red), context (dim)

**When to use:** Displaying diffs to terminal after generation

**Example:**

```typescript
// Source: Established CLI patterns (git diff, terraform plan)
import chalk from "chalk";

export function formatDiffForDisplay(patch: string): string {
  const lines = patch.split("\n");

  return lines
    .map((line) => {
      // Header lines (Index, ===, ---, +++, @@)
      if (line.startsWith("Index:") || line.startsWith("===")) {
        return chalk.bold(line);
      }
      if (line.startsWith("---") || line.startsWith("+++")) {
        return chalk.bold.dim(line);
      }
      if (line.startsWith("@@")) {
        return chalk.cyan(line);
      }

      // Diff content
      if (line.startsWith("+")) {
        return chalk.green(line);
      }
      if (line.startsWith("-")) {
        return chalk.red(line);
      }

      // Context lines
      return chalk.dim(line);
    })
    .join("\n");
}

export async function displayFileDiff(diff: FileDiff): Promise<void> {
  console.log(chalk.bold(`\n${diff.filePath}`));
  console.log(formatDiffForDisplay(diff.patch));
}
```

### Pattern 4: Non-Interactive Mode with --yes Flag

**What:** Skip all prompts and apply default selections when --yes flag provided

**When to use:** CI/CD environments, automated testing, scripted workflows

**Example:**

```typescript
// Source: Existing pattern from cli/src/utils/interactive.ts
import { isInteractive, NonInteractiveError } from "../interactive.js";

export interface ConfirmPlanOptions {
  yes?: boolean; // Skip prompts, use defaults
}

export async function confirmPlan(
  plan: InstallationPlan,
  options: ConfirmPlanOptions = {},
): Promise<ConfirmationResult> {
  // Non-interactive mode with --yes: auto-approve high-confidence items
  if (options.yes || !isInteractive()) {
    if (!options.yes) {
      throw new NonInteractiveError(
        `${chalk.red("Error: Cannot prompt for confirmation in non-interactive mode.")}\n\n` +
          `${chalk.yellow("Solution:")} Use ${chalk.cyan("--yes")} flag to auto-approve recommended changes.\n\n` +
          `Example: ${chalk.cyan("tambo magic-init --yes")}`,
      );
    }

    // Auto-approve: select all items with confidence >= 0.7
    return autoApproveHighConfidence(plan);
  }

  // Interactive mode: show full confirmation flow
  const items = planToItems(plan);
  const selectedIds = await presentPlanChecklist(items);
  const diffs = await generateDiffsForSelection(plan, selectedIds);

  for (const diff of diffs) {
    await displayFileDiff(diff);
  }

  const confirmed = await confirm({
    message: "Apply these changes?",
    default: true,
  });

  if (!confirmed) {
    return { approved: false, selectedItems: [] };
  }

  return { approved: true, selectedItems: selectedIds };
}
```

### Pattern 5: Plan Summary Table

**What:** Display plan overview in table format before detailed confirmation

**When to use:** Before presenting checklist, to give user high-level understanding

**Example:**

```typescript
// Source: Existing pattern from cli-table3 usage in CLI
import Table from "cli-table3";
import chalk from "chalk";

export function displayPlanSummary(plan: InstallationPlan): void {
  console.log(chalk.bold("\n📋 Installation Plan\n"));

  const table = new Table({
    head: ["Category", "Count", "Avg Confidence"],
    colWidths: [30, 10, 20],
  });

  const categories = [
    {
      name: "Provider Setup",
      count: 1,
      confidence: plan.providerSetup.confidence,
    },
    {
      name: "Component Registrations",
      count: plan.componentRecommendations.length,
      confidence: avgConfidence(plan.componentRecommendations),
    },
    {
      name: "Tool Definitions",
      count: plan.toolRecommendations.length,
      confidence: avgConfidence(plan.toolRecommendations),
    },
    {
      name: "Interactables",
      count: plan.interactableRecommendations.length,
      confidence: avgConfidence(plan.interactableRecommendations),
    },
    {
      name: "Chat Widget",
      count: 1,
      confidence: plan.chatWidgetSetup.confidence,
    },
  ];

  categories.forEach((cat) => {
    if (cat.count > 0) {
      table.push([
        cat.name,
        cat.count.toString(),
        formatConfidence(cat.confidence),
      ]);
    }
  });

  console.log(table.toString());
  console.log(); // blank line
}

function formatConfidence(score: number): string {
  const percent = Math.round(score * 100);
  if (score >= 0.8) return chalk.green(`${percent}%`);
  if (score >= 0.6) return chalk.yellow(`${percent}%`);
  return chalk.red(`${percent}%`);
}
```

### Anti-Patterns to Avoid

- **Executing changes before confirmation:** NEVER modify files before user explicitly approves. This violates user trust and is a security risk.
- **Hiding diffs behind "show details" toggle:** Users must see what will change. Don't make diffs optional; display them automatically.
- **One-by-one confirmation:** Don't prompt for each individual change. Present as batch, let user select subset, confirm once.
- **Unclear rejection flow:** If user declines or deselects all items, make it clear the command will exit without changes.
- **Ignoring --yes in CI:** If --yes is provided, never prompt. Promptless mode must work without any interactivity.

## Don't Hand-Roll

| Problem                   | Don't Build                    | Use Instead                      | Why                                                                                          |
| ------------------------- | ------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------- |
| Interactive prompts       | Custom readline wrapper        | `inquirer` / `@inquirer/prompts` | Already installed; battle-tested; handles TTY detection, keyboard events, validation         |
| Unified diff format       | String diff with custom format | `diff.createTwoFilesPatch()`     | Standard format; compatible with patch tools; handles edge cases (empty files, line endings) |
| Terminal colors           | ANSI code strings              | `chalk`                          | Already installed; cross-platform; handles color support detection                           |
| Non-interactive detection | Manual TTY checks              | `isInteractive()` utility        | Already implemented in `cli/src/utils/interactive.ts`; handles CI detection                  |
| Checkbox UI rendering     | Custom blessed/ink TUI         | `@inquirer/checkbox`             | Simpler; sufficient for checklist; no heavy TUI dependency                                   |

**Key insight:** The CLI already has the foundation (inquirer, diff, chalk, isInteractive). Phase 4 composes these existing tools into a confirmation flow pattern, not building primitives from scratch.

## Common Pitfalls

### Pitfall 1: Prompting in Non-Interactive Environment

**What goes wrong:** CLI hangs indefinitely waiting for user input when stdin is piped or running in CI

**Why it happens:** Forgot to check `isInteractive()` before calling prompt functions

**How to avoid:**

- Always use `interactivePrompt()` wrapper or check `isInteractive()` first
- If `!isInteractive() && !options.yes`, throw `NonInteractiveError` with `--yes` guidance
- Test with piped stdin: `echo | tambo magic-init` should fail gracefully, not hang

**Warning signs:** CI jobs hang/timeout, "no terminal" errors, command never completes when piped

### Pitfall 2: Generating Diffs for Non-Existent Files

**What goes wrong:** `createTwoFilesPatch()` generates meaningless diff showing entire file as additions

**Why it happens:** Treating file creation as modification; trying to diff against empty string

**How to avoid:**

- Check if file exists before generating diff
- For new files, skip diff and just show "Will create: /path/to/file.ts"
- Only generate diffs for modifications (file already exists)
- Consider showing file preview (first 20 lines) instead of diff for new files

**Warning signs:** Diffs show hundreds of green lines with no red; "everything is additions" diffs

### Pitfall 3: Diff Context Overwhelm

**What goes wrong:** Diffs are too large, scrolling past screen; user can't review effectively

**Why it happens:** Large files with small changes generate massive diffs with default context lines

**How to avoid:**

- Use `{ context: 3 }` (default is 3, that's good)
- For files with >100 line diffs, show summary: "provider.tsx: 3 changes across 150 lines"
- Offer `--full-diff` flag to see complete diffs
- Consider paginating with `less` for very large diffs

**Warning signs:** Terminal scrollback fills with diffs; user feedback "too much to review"

### Pitfall 4: Required Items Not Marked Disabled

**What goes wrong:** User deselects provider setup; command proceeds to Phase 5 with incomplete plan

**Why it happens:** Checkbox allows deselecting any item; forgot to mark required items as disabled

**How to avoid:**

- Mark provider setup as `disabled: '(required)'` in checkbox choices
- Add validation function checking required items are selected
- Return clear error if user somehow deselects required items
- Document in prompt message that some items are required

**Warning signs:** Phase 5 fails with "no provider" error; user confused why command didn't work

### Pitfall 5: Confirmation Result Not Persisted

**What goes wrong:** User approves plan, then Phase 5 regenerates plan from scratch (different results)

**Why it happens:** Phase 4 only returns approval boolean; Phase 5 calls `generatePlan()` again

**How to avoid:**

- Return full `ConfirmationResult` with selected item IDs and filtered plan
- Phase 5 receives the approved plan subset, not original plan
- Don't regenerate plan in Phase 5; use exact approved items
- Consider saving confirmation to disk for debugging

**Warning signs:** User reports "different files changed than what I approved"; non-deterministic results

### Pitfall 6: Confidence Threshold Assumptions

**What goes wrong:** Auto-selecting all items with confidence >0.7 includes too many low-quality recommendations

**Why it happens:** Phase 3 model calibration doesn't match user expectations; 0.7 threshold arbitrary

**How to avoid:**

- Start conservative: pre-select only confidence >0.8 items
- Always include provider setup (required)
- User can manually select additional items from list
- Gather feedback to calibrate threshold over time

**Warning signs:** User deselects most items; low approval rate; feedback "too many suggestions"

## Code Examples

Verified patterns from official sources:

### Complete Confirmation Flow

```typescript
// Source: Established patterns from Phase 3 research + Context7 Inquirer.js
import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import type { InstallationPlan } from "../plan-generation/types.js";

export interface ConfirmationResult {
  approved: boolean;
  selectedItems: string[];
  plan: InstallationPlan; // Filtered to selected items
}

export interface ConfirmPlanOptions {
  yes?: boolean;
}

export async function confirmPlan(
  plan: InstallationPlan,
  options: ConfirmPlanOptions = {},
): Promise<ConfirmationResult> {
  // Handle non-interactive mode
  if (options.yes || !isInteractive()) {
    if (!options.yes) {
      throw new NonInteractiveError(
        `${chalk.red("Error: Cannot prompt for confirmation in non-interactive mode.")}\n\n` +
          `${chalk.yellow("Solution:")} Use ${chalk.cyan("--yes")} flag to auto-approve.\n\n` +
          `Example: ${chalk.cyan("tambo magic-init --yes")}`,
      );
    }

    return autoApproveHighConfidence(plan);
  }

  // Display plan summary
  displayPlanSummary(plan);

  // Convert plan to checklist items
  const items = planToCheckboxItems(plan);

  // Present checklist
  console.log(chalk.bold("\n✓ Select changes to apply\n"));
  const selectedIds = await checkbox({
    message: "Use space to select/deselect, enter to confirm:",
    choices: items,
    required: true,
    validate: (selected) => {
      const hasProvider = selected.some((id) => id === "provider-setup");
      if (!hasProvider) {
        return "Provider setup is required";
      }
      return true;
    },
  });

  // Generate and display diffs for selected items
  console.log(chalk.bold("\n📝 File changes:\n"));
  const diffs = await generateDiffsForSelection(plan, selectedIds);

  for (const diff of diffs) {
    displayFileDiff(diff);
  }

  // Final confirmation
  const approved = await confirm({
    message: `Apply ${selectedIds.length} changes?`,
    default: true,
  });

  if (!approved) {
    console.log(chalk.yellow("\n❌ Installation cancelled\n"));
    return {
      approved: false,
      selectedItems: [],
      plan,
    };
  }

  // Filter plan to selected items
  const filteredPlan = filterPlanBySelection(plan, selectedIds);

  console.log(chalk.green("\n✓ Changes approved\n"));
  return {
    approved: true,
    selectedItems: selectedIds,
    plan: filteredPlan,
  };
}
```

### Plan to Checkbox Items Conversion

```typescript
// Convert InstallationPlan to checkbox choice items
function planToCheckboxItems(plan: InstallationPlan): Array<{
  value: string;
  name: string;
  checked: boolean;
  disabled?: string | boolean;
}> {
  const items = [];

  // Provider setup (required, always selected, disabled)
  items.push({
    value: "provider-setup",
    name: `Add TamboProvider to ${plan.providerSetup.filePath}`,
    checked: true,
    disabled: "(required)",
  });

  // Component registrations (pre-select high confidence)
  plan.componentRecommendations.forEach((rec, idx) => {
    items.push({
      value: `component-${idx}`,
      name: `Register ${rec.name} component (${formatConfidence(rec.confidence)})`,
      checked: rec.confidence >= 0.8,
    });
  });

  // Tool definitions (pre-select high confidence)
  plan.toolRecommendations.forEach((rec, idx) => {
    items.push({
      value: `tool-${idx}`,
      name: `Create ${rec.name} tool from ${rec.type} (${formatConfidence(rec.confidence)})`,
      checked: rec.confidence >= 0.8,
    });
  });

  // Interactables (pre-select high confidence)
  plan.interactableRecommendations.forEach((rec, idx) => {
    items.push({
      value: `interactable-${idx}`,
      name: `Add interactability to ${rec.componentName} (${formatConfidence(rec.confidence)})`,
      checked: rec.confidence >= 0.8,
    });
  });

  // Chat widget (always high confidence)
  items.push({
    value: "chat-widget",
    name: `Add chat widget to ${plan.chatWidgetSetup.filePath}`,
    checked: plan.chatWidgetSetup.confidence >= 0.8,
  });

  return items;
}

function formatConfidence(score: number): string {
  const percent = Math.round(score * 100);
  if (score >= 0.8) return chalk.green(`${percent}% confident`);
  if (score >= 0.6) return chalk.yellow(`${percent}% confident`);
  return chalk.dim(`${percent}% confident`);
}
```

## State of the Art

| Old Approach                    | Current Approach                       | When Changed                     | Impact                                                      |
| ------------------------------- | -------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| Auto-execute without preview    | Preview-then-confirm pattern           | 2020-2024 (Terraform influence)  | User trust; ability to review before destructive operations |
| One-by-one confirmation         | Batch checklist selection              | 2022-2024 (modern CLI UX)        | Faster workflow; better overview of full change set         |
| Plain text diffs                | Colored unified diffs                  | Standard since 2010s (git diff)  | Easier to parse visually; + green / - red is universal      |
| Prompt libraries block on stdin | Detect non-interactive + provide flags | 2023-2025 (CI/CD adoption)       | CLIs work in pipelines; clear error messages guide users    |
| Custom TUI frameworks           | Simple prompts (inquirer/clack)        | 2024-2025 (complexity reduction) | Lower maintenance; faster development; adequate UX          |

**Deprecated/outdated:**

- Inquirer classic API (`inquirer.prompt(questions)`) - Use `@inquirer/prompts` individual functions instead (cleaner imports)
- Prompting without TTY checks - Always check `isInteractive()` first
- DIY diff algorithms - Use `diff` package (handles edge cases, standard format)

## Open Questions

1. **Diff Pagination Strategy**
   - What we know: Large diffs are hard to review in terminal scrollback
   - What's unclear: Should we paginate with `less`? Limit diff size and provide `--full-diff` flag?
   - Recommendation: Start with full diffs (most changes are small); add `--full-diff` flag later if needed

2. **Confidence Threshold Calibration**
   - What we know: Pre-selecting items based on confidence >0.8 is arbitrary
   - What's unclear: What threshold matches user expectations? Should it be configurable?
   - Recommendation: Start with 0.8, gather feedback in Phase 5 UAT, adjust based on approval rates

3. **New File Preview vs Diff**
   - What we know: Diffing new files shows entire file as additions (not useful)
   - What's unclear: Show first N lines? Show full file? Just show "will create" message?
   - Recommendation: Skip diff for new files, show message like "Will create provider.tsx (45 lines)"

4. **Diff Storage for Debugging**
   - What we know: Users may report "wrong changes applied"; hard to debug without seeing what they approved
   - What's unclear: Should we save approved diffs to `.tambo/last-confirmation.json`?
   - Recommendation: Defer to Phase 5; if debugging becomes issue, add logging then

5. **Partial Plan Execution**
   - What we know: User can deselect items, resulting in partial plan execution
   - What's unclear: Should we validate that partial plan is coherent (e.g., registering component requires provider)?
   - Recommendation: Provider setup is always required (disabled in checkbox); other items are independent

## Sources

### Primary (HIGH confidence)

- [Context7: Inquirer.js](https://context7.com/sboudrias/inquirer.js/llms.txt) - Checkbox, confirm, select prompts with examples
- [Context7: jsdiff](https://context7.com/kpdecker/jsdiff/llms.txt) - Unified diff generation with createTwoFilesPatch
- [Context7: Clack prompts](https://context7.com/bombshell-dev/clack/llms.txt) - Modern prompt patterns (for comparison)
- [Inquirer.js GitHub](https://github.com/sboudrias/Inquirer.js) - Official documentation and API reference
- [jsdiff GitHub](https://github.com/kpdecker/jsdiff) - Diff algorithm documentation

### Secondary (MEDIUM confidence)

- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts) - Modern inquirer API documentation
- [diff npm](https://www.npmjs.com/package/diff) - Package documentation and examples
- [Helm Diff Plugin](https://oneuptime.com/blog/post/2026-02-09-helm-diff-plugin-preview-changes/view) - Preview-then-confirm pattern example
- [Azure CLI What-If](https://techcommunity.microsoft.com/blog/azuretoolsblog/gaining-confidence-with-az-cli-and-az-powershell-introducing-what-if--export-bic/4472147) - Preview changes pattern in infrastructure tools
- [CLI Tools with Previews](https://nickjanetakis.com/blog/cli-tools-that-support-previews-dry-runs-or-non-destructive-actions) - Industry best practices for dry-run/preview

### Tertiary (LOW confidence)

- [Drizzle ORM Issue #5249](https://github.com/drizzle-team/drizzle-orm/issues/5249) - Discussion of confirmation flow improvements
- WebSearch: CLI confirmation patterns - General patterns, not specific to this implementation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - inquirer and diff already installed and proven in CLI
- Architecture: HIGH - Pattern extends existing `interactivePrompt()` utility from `cli/src/utils/interactive.ts`
- Checkbox UI: HIGH - @inquirer/checkbox is standard, well-documented, already available
- Diff generation: HIGH - diff.createTwoFilesPatch is standard unified format with Node.js usage
- Non-interactive mode: HIGH - CLI already has comprehensive detection and error handling

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stable domain, established patterns)

**Key risks:**

1. User experience - Diffs may be overwhelming for large changes; need to test with real projects
2. Confidence calibration - Pre-selection threshold (0.8) may not match user expectations; needs UAT validation
3. Partial plan coherence - Allowing arbitrary deselection may create invalid states; provider setup mitigation helps

**Dependencies:**

- Phase 3 (plan-generation) must be complete: `generatePlan()` produces `InstallationPlan` type
- Existing CLI utilities: `isInteractive()`, `interactivePrompt()`, `NonInteractiveError` from `cli/src/utils/interactive.ts`
- inquirer ^13.2.1 and diff ^8.0.3 already installed in `cli/package.json`
