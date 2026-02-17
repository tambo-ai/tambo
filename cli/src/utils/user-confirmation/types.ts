/**
 * Type definitions for user confirmation flow
 *
 * These types support the interactive approval workflow where users
 * review and approve installation plans before execution.
 */

import type { InstallationPlan } from "../plan-generation/types.js";
import type { ProjectAnalysis } from "../project-analysis/types.js";

/**
 * Represents a single item in the confirmation checklist
 */
export interface PlanItem {
  /** Unique identifier for this item */
  id: string;

  /** Type of recommendation */
  type: "provider" | "component" | "tool" | "interactable" | "chat-widget";

  /** Human-readable label for display */
  label: string;

  /** Confidence score (0.0 to 1.0) */
  confidence: number;

  /** Whether this item is selected for installation */
  checked: boolean;

  /** Optional reason why this item cannot be modified (makes it read-only) */
  disabled?: boolean | string;
}

/**
 * Represents a file diff for display
 */
export interface FileDiff {
  /** Path to the file being modified */
  filePath: string;

  /** Whether this is a new file (no existing content) */
  isNew: boolean;

  /** Original file content (empty string for new files) */
  oldContent: string;

  /** Modified file content */
  newContent: string;

  /** Unified diff patch (empty string for new files) */
  patch: string;
}

/**
 * Result of the confirmation flow
 */
export interface ConfirmationResult {
  /** Whether the user approved the plan */
  approved: boolean;

  /** IDs of selected items to install */
  selectedItems: string[];

  /** Complete installation plan (potentially filtered) */
  plan: InstallationPlan;
}

/**
 * Options for the confirmation flow
 */
export interface ConfirmPlanOptions {
  /** Skip confirmation and auto-approve (--yes flag) */
  yes?: boolean;
  /** Original project analysis for showing candidate counts in summary */
  analysis?: ProjectAnalysis;
}
