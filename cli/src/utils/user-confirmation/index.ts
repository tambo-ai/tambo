/**
 * User confirmation orchestrator
 *
 * This module ties together checklist selection and final confirmation
 * to produce a filtered InstallationPlan that Phase 5 can execute.
 */

import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { isInteractive, NonInteractiveError } from "../interactive.js";
import type { InstallationPlan } from "../plan-generation/types.js";
import { generateChangeSummary } from "./content-generator.js";
import {
  displayPlanSummary,
  filterPlanBySelection,
  planToCheckboxItems,
} from "./plan-presenter.js";
import type { ConfirmationResult, ConfirmPlanOptions } from "./types.js";

// Re-export types
export type {
  ConfirmationResult,
  ConfirmPlanOptions,
  PlanItem,
  FileDiff,
} from "./types.js";

// Re-export utilities
export { generateFileDiff } from "./diff-generator.js";
export {
  formatDiffForDisplay,
  displayFileDiff,
  displayNewFileMessage,
} from "./diff-display.js";
export {
  planToCheckboxItems,
  displayPlanSummary,
  filterPlanBySelection,
} from "./plan-presenter.js";

/**
 * Orchestrate the user confirmation flow
 *
 * @param plan - The installation plan to confirm
 * @param options - Confirmation options
 * @returns Promise resolving to confirmation result
 */
export async function confirmPlan(
  plan: InstallationPlan,
  options: ConfirmPlanOptions = {},
): Promise<ConfirmationResult> {
  // Non-interactive path
  if (!isInteractive()) {
    if (!options.yes) {
      throw new NonInteractiveError(
        "Cannot run confirmation in non-interactive mode without --yes flag. " +
          "Use --yes to auto-approve high-confidence changes (>= 80% confidence).",
      );
    }

    // Auto-approve with --yes: select all items with confidence >= 0.8 plus provider-setup
    const items = planToCheckboxItems(plan);
    const selectedItems = items
      .filter(
        (item) =>
          item.id === "provider-setup" || // Always include
          item.confidence >= 0.8, // High-confidence items
      )
      .map((item) => item.id);

    const filteredPlan = filterPlanBySelection(plan, selectedItems);

    return {
      approved: true,
      selectedItems,
      plan: filteredPlan,
    };
  }

  // Interactive path
  displayPlanSummary(plan, options.analysis);

  const items = planToCheckboxItems(plan);

  // Convert to @inquirer/prompts choices format
  const choices = items.map((item) => ({
    value: item.id,
    name: item.label,
    checked: item.checked,
    disabled: item.disabled ?? false,
  }));

  // Present checklist
  const selectedIds = await checkbox({
    message: "Select changes to apply:",
    choices,
    required: true,
  });

  // Display change summaries for selected items
  console.log(chalk.bold("\nPlanned changes:"));
  for (const selectedId of selectedIds) {
    const summary = generateChangeSummary(selectedId, plan);
    console.log(chalk.gray(`  • ${summary}`));
  }
  console.log();

  // Final confirmation
  const confirmed = await confirm({
    message: "Apply selected changes?",
    default: true,
  });

  if (!confirmed) {
    return {
      approved: false,
      selectedItems: [],
      plan,
    };
  }

  // Return approved result with filtered plan
  const filteredPlan = filterPlanBySelection(plan, selectedIds);

  return {
    approved: true,
    selectedItems: selectedIds,
    plan: filteredPlan,
  };
}
