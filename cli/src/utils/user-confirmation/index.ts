/**
 * User confirmation orchestrator
 *
 * This module ties together checklist selection, diff display, and final confirmation
 * to produce a filtered InstallationPlan that Phase 5 can execute.
 */

import { checkbox, confirm } from "@inquirer/prompts";
import fs from "node:fs/promises";
import { isInteractive, NonInteractiveError } from "../interactive.js";
import type { InstallationPlan } from "../plan-generation/types.js";
import { generateContentForRecommendation } from "./content-generator.js";
import { generateFileDiff } from "./diff-generator.js";
import { displayFileDiff, displayNewFileMessage } from "./diff-display.js";
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
  displayPlanSummary(plan);

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

  // Generate and display diffs for selected items
  for (const selectedId of selectedIds) {
    const item = items.find((i) => i.id === selectedId);
    if (!item) {
      continue;
    }

    // Determine recommendation details based on item type
    let filePath: string;
    let recommendationType:
      | "provider"
      | "component"
      | "tool"
      | "interactable"
      | "chat-widget";

    if (item.type === "provider") {
      filePath = plan.providerSetup.filePath;
      recommendationType = "provider";
    } else if (item.type === "component") {
      const idx = Number.parseInt(selectedId.replace("component-", ""), 10);
      const component = plan.componentRecommendations[idx];
      if (!component) {
        continue;
      }
      filePath = component.filePath;
      recommendationType = "component";
    } else if (item.type === "tool") {
      const idx = Number.parseInt(selectedId.replace("tool-", ""), 10);
      const tool = plan.toolRecommendations[idx];
      if (!tool) {
        continue;
      }
      filePath = tool.filePath;
      recommendationType = "tool";
    } else if (item.type === "interactable") {
      const idx = Number.parseInt(selectedId.replace("interactable-", ""), 10);
      const interactable = plan.interactableRecommendations[idx];
      if (!interactable) {
        continue;
      }
      filePath = interactable.filePath;
      recommendationType = "interactable";
    } else if (item.type === "chat-widget") {
      filePath = plan.chatWidgetSetup.filePath;
      recommendationType = "chat-widget";
    } else {
      continue;
    }

    // Read existing file content (empty string if ENOENT)
    let existingContent = "";
    try {
      existingContent = await fs.readFile(filePath, "utf-8");
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        // Re-throw non-ENOENT errors
        throw error;
      }
      // ENOENT is fine - new file
    }

    // Generate modified content
    const newContent = generateContentForRecommendation(
      {
        type: recommendationType,
        filePath,
        plan: plan as never, // Type assertion to satisfy discriminated union
      },
      existingContent,
    );

    // Generate and display diff
    const diff = await generateFileDiff(filePath, newContent);

    if (diff.isNew) {
      displayNewFileMessage(filePath, newContent.split("\n").length);
    } else {
      displayFileDiff(diff);
    }
  }

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
