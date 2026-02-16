/**
 * Code execution orchestrator
 *
 * Main entry point for Phase 5 code execution. Takes a confirmed installation
 * plan and executes it: backup → write files → install deps → verify → report.
 */

import fs from "node:fs/promises";
import ora from "ora";
import {
  createBackup,
  restoreBackups,
  cleanupBackups,
  executeFileOperations,
} from "./file-operations.js";
import {
  installDependencies,
  collectDependencies,
} from "./dependency-installer.js";
import { verifyExecution } from "./verification.js";
import {
  categorizeExecutionError,
  formatExecutionError,
} from "./error-recovery.js";
import { generateContentForRecommendation } from "../user-confirmation/content-generator.js";
import type {
  ConfirmationResult,
  ExecutionResult,
  FileOperation,
  BackupManifest,
  InstallationPlan,
} from "./types.js";

/**
 * Recommendation with type discriminator for content generation
 */
type RecommendationWithType =
  | {
      type: "provider";
      filePath: string;
      plan: Pick<InstallationPlan, "providerSetup">;
    }
  | {
      type: "component";
      filePath: string;
      plan: Pick<InstallationPlan, "componentRecommendations">;
    }
  | {
      type: "tool";
      filePath: string;
      plan: Pick<InstallationPlan, "toolRecommendations">;
    }
  | {
      type: "interactable";
      filePath: string;
      plan: Record<string, unknown>;
    }
  | {
      type: "chat-widget";
      filePath: string;
      plan: Pick<InstallationPlan, "chatWidgetSetup">;
    };

/**
 * Executes code changes from a confirmed installation plan.
 * Orchestrates the full execution flow with error handling and rollback.
 *
 * @param confirmation - Confirmed installation plan with selected items
 * @param options - Execution options (e.g., --yes flag)
 * @returns ExecutionResult with success status, file lists, and any errors
 * @throws Error if plan was not approved or execution fails
 */
export async function executeCodeChanges(
  confirmation: ConfirmationResult,
  options?: { yes?: boolean },
): Promise<ExecutionResult> {
  // Guard: ensure plan was approved
  if (!confirmation.approved) {
    throw new Error("Cannot execute: plan was not approved");
  }

  const { selectedItems, plan } = confirmation;
  const spinner = ora("Preparing execution...").start();

  // Create backup manifest
  const manifest: BackupManifest = {
    backups: new Map(),
    timestamp: Date.now().toString(),
  };

  try {
    // Build FileOperation array from selected items
    spinner.text = "Analyzing selected items...";
    const operations: FileOperation[] = [];

    for (const itemId of selectedItems) {
      let filePath: string;
      let recommendation: RecommendationWithType;

      // Map item ID to plan data
      if (itemId === "provider-setup") {
        filePath = plan.providerSetup.filePath;
        recommendation = {
          type: "provider" as const,
          filePath,
          plan: { providerSetup: plan.providerSetup },
        };
      } else if (itemId.startsWith("component-")) {
        const index = Number.parseInt(itemId.split("-")[1], 10);
        const component = plan.componentRecommendations[index];
        if (!component) continue;
        filePath = component.filePath;
        recommendation = {
          type: "component" as const,
          filePath,
          plan: { componentRecommendations: [component] },
        };
      } else if (itemId.startsWith("tool-")) {
        const index = Number.parseInt(itemId.split("-")[1], 10);
        const tool = plan.toolRecommendations[index];
        if (!tool) continue;
        filePath = tool.filePath;
        recommendation = {
          type: "tool" as const,
          filePath,
          plan: { toolRecommendations: [tool] },
        };
      } else if (itemId.startsWith("interactable-")) {
        const index = Number.parseInt(itemId.split("-")[1], 10);
        const interactable = plan.interactableRecommendations[index];
        if (!interactable) continue;
        filePath = interactable.filePath;
        recommendation = {
          type: "interactable" as const,
          filePath,
          plan: {},
        };
      } else if (itemId === "chat-widget") {
        filePath = plan.chatWidgetSetup.filePath;
        recommendation = {
          type: "chat-widget" as const,
          filePath,
          plan: { chatWidgetSetup: plan.chatWidgetSetup },
        };
      } else {
        continue;
      }

      // Read existing file content (empty string for new files)
      let existingContent = "";
      try {
        existingContent = await fs.readFile(filePath, "utf-8");
      } catch (err) {
        const errno = (err as NodeJS.ErrnoException).code;
        if (errno !== "ENOENT") {
          throw err; // Re-throw non-ENOENT errors
        }
        // File doesn't exist (new file) - existingContent stays empty
      }

      // Generate new content
      const newContent = generateContentForRecommendation(
        recommendation,
        existingContent,
      );

      operations.push({
        filePath,
        content: newContent,
        isNew: existingContent === "",
      });
    }

    // Backup existing files (skip new files)
    spinner.text = "Creating backups...";
    for (const operation of operations) {
      if (!operation.isNew) {
        await createBackup(operation.filePath, manifest);
      }
    }

    // Execute file writes
    spinner.text = "Writing files...";
    await executeFileOperations(operations);

    // Install dependencies
    spinner.text = "Installing dependencies...";
    const deps = collectDependencies(plan, selectedItems);
    await installDependencies(deps, options);

    // Verify execution
    spinner.text = "Verifying files...";
    const verificationErrors = await verifyExecution(operations);

    // Clean up backups on success
    await cleanupBackups(manifest);

    // Build result
    const filesCreated = operations
      .filter((op) => op.isNew)
      .map((op) => op.filePath);
    const filesModified = operations
      .filter((op) => !op.isNew)
      .map((op) => op.filePath);

    const result: ExecutionResult = {
      success: true,
      filesCreated,
      filesModified,
      dependenciesInstalled: [...deps.dependencies, ...deps.devDependencies],
      errors: verificationErrors,
    };

    // Display appropriate spinner status
    if (verificationErrors.length > 0) {
      spinner.warn("Execution completed with warnings");
      console.log("\nWarnings:");
      for (const error of verificationErrors) {
        console.log(`  ${error.filePath}: ${error.issue}`);
        console.log(`    → ${error.suggestion}`);
      }
    } else {
      spinner.succeed("Execution completed successfully");
    }

    // Display summary
    console.log("\nSummary:");
    console.log(`  Files created: ${filesCreated.length}`);
    console.log(`  Files modified: ${filesModified.length}`);
    console.log(
      `  Dependencies installed: ${result.dependenciesInstalled.length}`,
    );

    return result;
  } catch (err) {
    // Restore backups on error
    spinner.fail("Execution failed");
    console.log("\nRestoring backups...");
    await restoreBackups(manifest);

    // Format and display error
    const executionError = categorizeExecutionError(
      err instanceof Error ? err : new Error(String(err)),
    );
    console.error(formatExecutionError(executionError));

    throw err;
  }
}

// Re-exports
export type {
  FileOperation,
  BackupManifest,
  DependencySet,
  VerificationError,
  ExecutionError,
  ExecutionResult,
  InstallationPlan,
  ConfirmationResult,
} from "./types.js";

export { verifyExecution } from "./verification.js";
export {
  formatExecutionError,
  categorizeExecutionError,
} from "./error-recovery.js";
export { writeFileAtomic } from "./file-operations.js";
export {
  installDependencies,
  collectDependencies,
} from "./dependency-installer.js";
