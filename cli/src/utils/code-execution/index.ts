/**
 * Code execution orchestrator
 *
 * Main entry point for Phase 5 code execution. Takes a confirmed installation
 * plan and executes it using an agentic tool-call loop: the LLM reads files,
 * generates code, and writes files through tools — iterating until done.
 */

import * as childProcess from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";

const execAsync = promisify(childProcess.exec);

const isDebug = Boolean(process.env.DEBUG);
function debug(msg: string, ...args: unknown[]): void {
  if (isDebug) {
    console.error(`[tambo:exec] ${msg}`, ...args);
  }
}

import inquirer from "inquirer";
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
import type { PlanStep } from "./agent-tools.js";
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

  // Plan tracking state
  let planSteps: PlanStep[] = [];
  let currentStepIndex = 0;

  // Track tool call names by ID for spinner display during arg streaming
  const toolCallNames = new Map<string, string>();

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
          const typedInput = input as Record<string, unknown>;

          // Update spinner with tool activity
          if (
            tool.name === "readFile" &&
            typeof typedInput.filePath === "string"
          ) {
            spinner.text = `Reading ${typedInput.filePath}`;
            filesRead.add(typedInput.filePath);
          } else if (
            tool.name === "writeFile" &&
            typeof typedInput.filePath === "string"
          ) {
            spinner.text = `Writing ${typedInput.filePath}`;
            filesWritten.add(typedInput.filePath);
          } else if (
            tool.name === "readFiles" &&
            Array.isArray(typedInput.filePaths)
          ) {
            const paths = typedInput.filePaths as string[];
            spinner.text = `Reading ${paths.length} files`;
            for (const p of paths) {
              filesRead.add(p);
            }
          } else if (tool.name === "listFiles") {
            const dir =
              typeof typedInput.dirPath === "string" ? typedInput.dirPath : ".";
            spinner.text = `Listing files in ${dir}`;
          }

          debug(`Executing tool: ${tool.name}`, typedInput);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic tool execution
          const result = await (tool as any).execute(input);
          debug(`Tool ${tool.name} completed`, typeof result);

          // Update plan tracking state after execution
          if (tool.name === "submitPlan" && result?.steps) {
            planSteps = result.steps as PlanStep[];
            currentStepIndex = 0;
            const total = planSteps.length;
            const first = planSteps[0];
            spinner.text = `Step 1/${total}: ${first?.description ?? ""}`;
          } else if (tool.name === "updatePlan") {
            const doneCount = planSteps.filter(
              (s) => s.status === "done",
            ).length;
            currentStepIndex = doneCount;
            const total = planSteps.length;
            // Mark the step done in our local copy
            const stepId = typedInput.stepId as string;
            const doneStep = planSteps.find((s) => s.id === stepId);
            if (doneStep) {
              doneStep.status = "done";
            }

            const next = planSteps.find((s) => s.status === "pending");
            if (next) {
              const nextIdx = currentStepIndex + 1;
              spinner.text = `\u2713 Step ${currentStepIndex}/${total} done \u2014 Step ${nextIdx}/${total}: ${next.description}`;
            } else {
              spinner.text = `\u2713 All ${total} steps complete`;
            }
          }

          return result;
        },
      });
    }

    // Create Tambo client and thread
    spinner.text = "Creating execution thread...";
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
        await execAsync("npx tambo add message-thread-full --yes", {
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
      options.apiKey,
    );

    // Execute the agentic loop
    debug("Starting agentic loop", { threadId: thread.id });
    debug("Prompt length:", prompt.length);
    spinner.text = "Waiting for agent...";
    const SOFT_ROUND_LIMIT = 50;
    let extendedLimit = false;
    await executeRun(client, thread.id, prompt, {
      tools: registry,
      maxToolRounds: 200,
      async onRoundComplete(round: number) {
        debug(`Round ${round} complete`);
        if (round === SOFT_ROUND_LIMIT && !extendedLimit) {
          spinner.stop();
          if (options.yes) {
            // Non-interactive: just keep going
            extendedLimit = true;
            spinner.start("Agent is working...");
            return true;
          }
          const { shouldContinue } = await inquirer.prompt<{
            shouldContinue: boolean;
          }>([
            {
              type: "confirm",
              name: "shouldContinue",
              message: `Agent has used ${round} tool rounds. Continue?`,
              default: true,
            },
          ]);
          if (!shouldContinue) {
            return false;
          }
          extendedLimit = true;
          spinner.start("Agent is working...");
        }
        return true;
      },
      onEvent: (event: unknown) => {
        const data = event as {
          type: string;
          delta?: string;
          toolCallName?: string;
          toolCallId?: string;
        };

        debug(
          `Event: ${data.type}`,
          data.toolCallName ?? data.toolCallId ?? "",
        );

        switch (data.type) {
          case "RUN_STARTED":
            spinner.text = "Agent is thinking...";
            break;
          case "TEXT_MESSAGE_CONTENT":
            if (data.delta) {
              spinner.text = "Agent is working...";
              options.onProgress?.(data.delta);
            }
            break;
          case "TOOL_CALL_START":
            spinner.text = `Calling ${data.toolCallName ?? "tool"}...`;
            if (data.toolCallId && data.toolCallName) {
              toolCallNames.set(data.toolCallId, data.toolCallName);
            }
            break;
          case "TOOL_CALL_ARGS":
            {
              // Keep spinner alive during arg streaming so it doesn't look frozen
              const toolName = data.toolCallId
                ? toolCallNames.get(data.toolCallId)
                : undefined;
              spinner.text = `Receiving ${toolName ?? "tool"} data...`;
              break;
            }
            break;
          case "TOOL_CALL_END":
            debug(`Tool call ended: ${data.toolCallId}`);
            break;
          case "RUN_FINISHED":
            debug("Run finished");
            break;
          case "RUN_ERROR":
            debug("Run error", data);
            break;
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

    const executionError = categorizeExecutionError(
      err instanceof Error ? err : new Error(String(err)),
    );
    console.error(formatExecutionError(executionError));

    // In non-interactive mode, auto-revert (preserve existing behavior)
    if (options.yes) {
      const createdFiles = [...filesWritten].filter((f) => !filesRead.has(f));
      if (createdFiles.length > 0) {
        console.log("\nCleaning up created files...");
        await deleteCreatedFiles(createdFiles);
      }
      console.log("\nRestoring backups...");
      await restoreBackups(manifest);
      throw err;
    }

    // Interactive mode: let user choose
    let decided = false;
    while (!decided) {
      const { action } = await inquirer.prompt<{ action: string }>([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "Revert all changes (restore backups)", value: "revert" },
            { name: "Keep changes as-is (delete backups)", value: "keep" },
            {
              name: "View execution plan (.tambo/execution-plan.md)",
              value: "view",
            },
          ],
        },
      ]);

      switch (action) {
        case "revert": {
          const createdFiles = [...filesWritten].filter(
            (f) => !filesRead.has(f),
          );
          if (createdFiles.length > 0) {
            console.log("\nCleaning up created files...");
            await deleteCreatedFiles(createdFiles);
          }
          console.log("\nRestoring backups...");
          await restoreBackups(manifest);
          decided = true;
          break;
        }
        case "keep":
          console.log("\nKeeping changes. Cleaning up backup files...");
          await cleanupBackups(manifest);
          decided = true;
          break;
        case "view": {
          try {
            const planContent = await fs.readFile(
              ".tambo/execution-plan.md",
              "utf-8",
            );
            console.log(`\n${planContent}`);
          } catch {
            console.log(
              "\nNo execution plan found (.tambo/execution-plan.md does not exist).",
            );
          }
          // Re-prompt
          break;
        }
      }
    }

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
