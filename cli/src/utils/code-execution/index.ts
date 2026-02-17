/**
 * Code execution orchestrator
 *
 * Main entry point for Phase 5 code execution. Takes a confirmed installation
 * plan and executes it using an agentic tool-call loop: the LLM reads files,
 * generates code, and writes files through tools — iterating until done.
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import ora from "ora";
import {
  createTamboClient,
  createToolRegistry,
  executeRun,
} from "@tambo-ai/client-core";
import {
  createBackup,
  restoreBackups,
  cleanupBackups,
} from "./file-operations.js";
import {
  installDependencies,
  collectDependencies,
} from "./dependency-installer.js";
import {
  categorizeExecutionError,
  formatExecutionError,
} from "./error-recovery.js";
import { agentTools } from "./agent-tools.js";
import { buildExecutionPrompt } from "./execution-prompt.js";
import type {
  ConfirmationResult,
  ExecutionResult,
  BackupManifest,
  InstallationPlan,
} from "./types.js";

/** Options for executeCodeChanges */
export interface ExecuteCodeChangesOptions {
  /** Skip interactive prompts */
  yes?: boolean;
  /** Tambo API key for the agentic execution loop */
  apiKey: string;
  /** Optional user key for V1 API authentication */
  userKey?: string;
  /** Optional base URL for API */
  baseUrl?: string;
  /** Optional progress callback for streaming text from the agent */
  onProgress?: (text: string) => void;
}

/**
 * Executes code changes from a confirmed installation plan using an agentic loop.
 * The LLM reads and writes files through tool calls until all changes are applied.
 *
 * @param confirmation - Confirmed installation plan with selected items
 * @param options - Execution options including API key
 * @returns ExecutionResult with success status, file lists, and any errors
 */
export async function executeCodeChanges(
  confirmation: ConfirmationResult,
  options: ExecuteCodeChangesOptions,
): Promise<ExecutionResult> {
  if (!confirmation.approved) {
    throw new Error("Cannot execute: plan was not approved");
  }

  const { selectedItems, plan } = confirmation;
  const spinner = ora("Preparing execution...").start();

  // Track files touched by the agent
  const filesWritten = new Set<string>();
  const filesRead = new Set<string>();

  // Create backup manifest for rollback
  const manifest: BackupManifest = {
    backups: new Map(),
    timestamp: Date.now().toString(),
  };

  try {
    // Backup existing files that might be modified
    spinner.text = "Creating backups...";
    const filesToBackup = collectFilePaths(plan, selectedItems);
    for (const filePath of filesToBackup) {
      await createBackup(filePath, manifest);
    }

    // Set up tool registry with filesystem tools
    spinner.text = "Setting up execution agent...";
    const registry = createToolRegistry();
    for (const tool of agentTools) {
      registry.register({
        ...tool,
        execute: async (input: unknown) => {
          // Wrap execute to track file operations
          const typedInput = input as Record<string, unknown>;
          if (
            tool.name === "writeFile" &&
            typeof typedInput.filePath === "string"
          ) {
            filesWritten.add(typedInput.filePath);
          }
          if (
            tool.name === "readFile" &&
            typeof typedInput.filePath === "string"
          ) {
            filesRead.add(typedInput.filePath);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic tool execution
          return await (tool as any).execute(input);
        },
      });
    }

    // Create Tambo client and thread
    const client = createTamboClient({
      apiKey: options.apiKey,
      userKey: options.userKey ?? "cli",
      ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
    });

    const thread = await client.threads.create({
      metadata: { purpose: "magic-init-execution" },
    });

    // Pre-install chat widget via `tambo add` if selected
    let chatWidgetInstalled = false;
    if (selectedItems.includes("chat-widget")) {
      spinner.text = "Installing chat widget component...";
      try {
        execSync("npx tambo add message-thread-full --yes", {
          stdio: "pipe",
          cwd: process.cwd(),
        });
        chatWidgetInstalled = true;
      } catch {
        // Fall back to letting the LLM handle it
      }
    }

    // Build the execution prompt
    const prompt = buildExecutionPrompt(
      plan,
      selectedItems,
      chatWidgetInstalled,
    );

    // Execute the agentic loop
    spinner.text = "Agent is applying changes...";
    await executeRun(client, thread.id, prompt, {
      tools: registry,
      maxToolRounds: 20,
      onEvent: (event: unknown) => {
        const data = event as { type: string; delta?: string };
        if (data.type === "TEXT_MESSAGE_CONTENT" && data.delta) {
          options.onProgress?.(data.delta);
        }
      },
    });

    // Install dependencies
    spinner.text = "Installing dependencies...";
    const deps = collectDependencies(plan, selectedItems);
    await installDependencies(deps, { yes: options.yes });

    // Clean up backups on success
    await cleanupBackups(manifest);

    // Determine which files were created vs modified
    const filesCreated: string[] = [];
    const filesModified: string[] = [];
    for (const filePath of filesWritten) {
      if (filesRead.has(filePath)) {
        filesModified.push(filePath);
      } else {
        filesCreated.push(filePath);
      }
    }

    const result: ExecutionResult = {
      success: true,
      filesCreated,
      filesModified,
      dependenciesInstalled: [...deps.dependencies, ...deps.devDependencies],
      errors: [],
    };

    spinner.succeed("Execution completed successfully");

    console.log("\nSummary:");
    console.log(`  Files created: ${filesCreated.length}`);
    console.log(`  Files modified: ${filesModified.length}`);
    console.log(
      `  Dependencies installed: ${result.dependenciesInstalled.length}`,
    );

    return result;
  } catch (err) {
    spinner.fail("Execution failed");

    // Delete files the agent created (not pre-existing)
    const createdFiles = [...filesWritten].filter((f) => !filesRead.has(f));
    if (createdFiles.length > 0) {
      console.log("\nCleaning up created files...");
      await deleteCreatedFiles(createdFiles);
    }

    console.log("\nRestoring backups...");
    await restoreBackups(manifest);

    const executionError = categorizeExecutionError(
      err instanceof Error ? err : new Error(String(err)),
    );
    console.error(formatExecutionError(executionError));

    throw err;
  }
}

/**
 * Delete files that were created by the agent during execution.
 * Silently skips files that no longer exist.
 */
async function deleteCreatedFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
    } catch {
      // File may already be gone — ignore
    }
  }
}

/**
 * Collect file paths from the plan that might need backups
 */
function collectFilePaths(
  plan: InstallationPlan,
  selectedItems: string[],
): string[] {
  const paths: string[] = [];

  if (selectedItems.includes("provider-setup")) {
    paths.push(plan.providerSetup.filePath);
  }

  for (const id of selectedItems) {
    if (id.startsWith("component-")) {
      const idx = Number.parseInt(id.split("-")[1], 10);
      const component = plan.componentRecommendations[idx];
      if (component) {
        paths.push(component.filePath);
      }
    } else if (id.startsWith("interactable-")) {
      const idx = Number.parseInt(id.split("-")[1], 10);
      const interactable = plan.interactableRecommendations[idx];
      if (interactable) {
        paths.push(interactable.filePath);
      }
    }
  }

  if (selectedItems.includes("chat-widget")) {
    paths.push(plan.chatWidgetSetup.filePath);
  }

  return paths;
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
