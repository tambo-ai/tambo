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

import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { EventType } from "@ag-ui/core";
import { TamboClient, type TamboTool } from "@tambo-ai/client";
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

/**
 * Wrap a TamboTool with side-effect callbacks for tracking and retry limiting.
 * Keeps tool definitions pure while injecting orchestration concerns.
 *
 * @returns A new TamboTool with wrapped `tool` function
 */
function wrapTool(
  baseTool: TamboTool,
  callbacks: {
    onExecute: (name: string, input: unknown) => void;
    onSuccess: (name: string, input: unknown, result: unknown) => void;
    onError: (name: string, input: unknown, err: Error) => void;
  },
): TamboTool {
  return {
    ...baseTool,
    async tool(input: unknown) {
      callbacks.onExecute(baseTool.name, input);
      try {
        const result = await baseTool.tool(input);
        callbacks.onSuccess(baseTool.name, input, result);
        return result;
      } catch (err) {
        callbacks.onError(
          baseTool.name,
          input,
          err instanceof Error ? err : new Error(String(err)),
        );
        throw err;
      }
    },
  };
}

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
  /** Framework env var prefix (e.g. "NEXT_PUBLIC_", "VITE_") */
  envPrefix?: string | null;
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

  // Track last known status for error reporting
  let lastStatus = "Preparing execution...";

  // Progress display state
  let currentStepDescription = "";
  let progressVisible = false;
  const PROGRESS_LINES = 5; // header, bar, blank, description, blank

  /**
   * Build the progress block string
   */
  function buildProgressBlock(done: number, total: number): string {
    const barWidth = 20;
    const filled = Math.round((done / total) * barWidth);
    const empty = barWidth - filled;
    const bar = chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
    const counter = chalk.bold(`${done}/${total}`);

    return [
      chalk.bold("Executing plan:"),
      `${bar} ${counter}`,
      "",
      chalk.cyan(currentStepDescription),
      "",
    ].join("\n");
  }

  /**
   * Write the progress block to stderr above the spinner.
   * Stops the spinner, writes the block, restarts the spinner.
   */
  function writeProgress(done: number, total: number): void {
    spinner.stop();
    writeProgressBlock(done, total);
    spinner.start();
  }

  /**
   * Write the progress block to stderr without managing the spinner.
   * Use when the spinner is already stopped.
   */
  function writeProgressBlock(done: number, total: number): void {
    if (progressVisible) {
      // Move cursor up past previous progress lines and clear them
      process.stderr.write(`\x1b[${PROGRESS_LINES}A\x1b[0J`);
    }

    process.stderr.write(buildProgressBlock(done, total) + "\n");
    progressVisible = true;
  }

  /**
   * Update the spinner status text (agent activity line)
   */
  function setStatus(status: string): void {
    lastStatus = status;
    spinner.text = status;
  }

  /**
   * Update the progress display above the spinner
   */
  function setProgress(done: number, total: number, stepLabel?: string): void {
    if (stepLabel !== undefined) {
      currentStepDescription = stepLabel;
    }
    writeProgress(done, total);
  }

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

    // Set up wrapped tools with tracking side effects
    spinner.text = "Setting up execution agent...";

    // Track consecutive failures per tool for retry limiting
    const MAX_CONSECUTIVE_FAILURES = 3;
    const consecutiveFailures = new Map<string, number>();

    const wrappedTools = agentTools.map((tool) =>
      wrapTool(tool, {
        onExecute: (name, input) => {
          const typedInput = input as Record<string, unknown>;

          // Check retry limit before executing
          const failures = consecutiveFailures.get(name) ?? 0;
          if (failures >= MAX_CONSECUTIVE_FAILURES) {
            const msg = `Tool "${name}" failed ${MAX_CONSECUTIVE_FAILURES} times consecutively. Skipping to avoid infinite loop.`;
            debug(msg);
            throw new Error(msg);
          }

          // Update spinner with tool activity
          if (name === "readFile" && typeof typedInput.filePath === "string") {
            setStatus(`Reading ${typedInput.filePath}`);
            filesRead.add(typedInput.filePath);
          } else if (
            name === "writeFile" &&
            typeof typedInput.filePath === "string"
          ) {
            setStatus(`Writing ${typedInput.filePath}`);
            filesWritten.add(typedInput.filePath);
          } else if (
            name === "readFiles" &&
            Array.isArray(typedInput.filePaths)
          ) {
            const paths = typedInput.filePaths as string[];
            setStatus(`Reading ${paths.length} files`);
            for (const p of paths) {
              filesRead.add(p);
            }
          } else if (name === "listFiles") {
            const dir =
              typeof typedInput.dirPath === "string" ? typedInput.dirPath : ".";
            setStatus(`Listing files in ${dir}`);
          }

          debug(`Executing tool: ${name}`, typedInput);
        },
        onSuccess: (name, input, result) => {
          debug(`Tool ${name} completed`, typeof result);
          consecutiveFailures.set(name, 0);

          const typedInput = input as Record<string, unknown>;

          // Update plan tracking state after execution
          if (
            name === "submitPlan" &&
            result &&
            typeof result === "object" &&
            "steps" in result
          ) {
            planSteps = (result as { steps: PlanStep[] }).steps;

            setProgress(
              0,
              planSteps.length,
              planSteps[0]?.description ?? "Starting...",
            );
          } else if (name === "updatePlan") {
            const stepId = typedInput.stepId as string;
            const doneStep = planSteps.find((s) => s.id === stepId);
            if (doneStep) {
              doneStep.status = "done";
            }

            const doneCount = planSteps.filter(
              (s) => s.status === "done",
            ).length;

            const next = planSteps.find((s) => s.status === "pending");
            setProgress(
              doneCount,
              planSteps.length,
              next?.description ?? "All steps complete",
            );
          }
        },
        onError: (name, _input, err) => {
          const count = (consecutiveFailures.get(name) ?? 0) + 1;
          consecutiveFailures.set(name, count);

          debug(
            `Tool ${name} failed (${count}/${MAX_CONSECUTIVE_FAILURES}): ${err.message}`,
          );
          setStatus(
            `Error in ${name}: ${err.message} (retry ${count}/${MAX_CONSECUTIVE_FAILURES})`,
          );
        },
      }),
    );

    // Create Tambo client with tools
    spinner.text = "Creating execution thread...";
    const client = new TamboClient({
      apiKey: options.apiKey,
      userKey: options.userKey ?? "cli",
      ...(options.baseUrl ? { tamboUrl: options.baseUrl } : {}),
      tools: wrappedTools,
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
      options.envPrefix,
    );

    // Execute the agentic loop
    debug("Starting agentic loop");
    debug("Prompt length:", prompt.length);
    spinner.text = "Waiting for agent...";
    const SOFT_ROUND_LIMIT = 50;
    let extendedLimit = false;
    let isCancelledByUser = false;

    /**
     * Run the agentic stream, iterating events for UI updates.
     * Uses autoExecuteTools so the stream handles tool call loops internally.
     * Returns the thread ID for continuation runs.
     *
     * @returns The thread ID from the completed run
     */
    async function runStream(
      message: string,
      runOptions: { threadId?: string; maxSteps: number },
    ): Promise<string | undefined> {
      const stream = client.run(message, {
        threadId: runOptions.threadId,
        autoExecuteTools: true,
        maxSteps: runOptions.maxSteps,
      });

      let threadId: string | undefined = runOptions.threadId;

      for await (const { event } of stream) {
        const data = event as Record<string, unknown>;
        debug(
          `Event: ${event.type}`,
          data.toolCallName ?? data.toolCallId ?? "",
        );

        switch (event.type) {
          case EventType.RUN_STARTED:
            setStatus("Agent is thinking...");
            if (typeof data.threadId === "string") {
              threadId = data.threadId;
            }
            break;
          case EventType.TEXT_MESSAGE_CONTENT:
            if (typeof data.delta === "string" && data.delta) {
              setStatus("Agent is working...");
              options.onProgress?.(data.delta);
            }
            break;
          case EventType.TOOL_CALL_START:
            setStatus(
              `Calling ${typeof data.toolCallName === "string" ? data.toolCallName : "tool"}...`,
            );
            if (
              typeof data.toolCallId === "string" &&
              typeof data.toolCallName === "string"
            ) {
              toolCallNames.set(data.toolCallId, data.toolCallName);
            }
            break;
          case EventType.TOOL_CALL_ARGS: {
            const toolName =
              typeof data.toolCallId === "string"
                ? toolCallNames.get(data.toolCallId)
                : undefined;
            setStatus(`Receiving ${toolName ?? "tool"} data...`);
            break;
          }
          case EventType.TOOL_CALL_END:
            debug(`Tool call ended: ${data.toolCallId}`);
            break;
          case EventType.RUN_FINISHED:
            debug("Run finished");
            break;
          case EventType.RUN_ERROR:
            debug("Run error", data);
            setStatus(
              chalk.red(
                `Agent error: ${typeof data.message === "string" ? data.message : "unknown error"}`,
              ),
            );
            break;
        }
      }

      return threadId;
    }

    // First run: use soft round limit as maxSteps
    const threadId = await runStream(prompt, { maxSteps: SOFT_ROUND_LIMIT });

    // Check if we hit the soft limit and need to continue
    // The stream completes when maxSteps is reached with pending tool calls.
    // We check plan progress to determine if more rounds are needed.
    const hasPendingWork =
      planSteps.length > 0 && planSteps.some((s) => s.status === "pending");

    if (hasPendingWork && !extendedLimit) {
      spinner.stop();

      // Reprint the progress block so it's visible above the prompt
      if (planSteps.length > 0) {
        const doneCount = planSteps.filter((s) => s.status === "done").length;
        writeProgressBlock(doneCount, planSteps.length);
      }

      if (options.yes) {
        // Non-interactive: just keep going
        extendedLimit = true;
        spinner.start("Agent is working...");
      } else {
        const { shouldContinue } = await inquirer.prompt<{
          shouldContinue: boolean;
        }>([
          {
            type: "confirm",
            name: "shouldContinue",
            message: `Agent has used ${SOFT_ROUND_LIMIT} tool rounds. Continue?`,
            default: true,
          },
        ]);
        if (!shouldContinue) {
          isCancelledByUser = true;
        } else {
          extendedLimit = true;
          spinner.start("Agent is working...");
        }
      }

      // Continue on the same thread with remaining budget
      if (extendedLimit && threadId) {
        await runStream("Continue executing the remaining plan steps.", {
          threadId,
          maxSteps: 200 - SOFT_ROUND_LIMIT,
        });
      }
    }

    if (isCancelledByUser) {
      throw new Error("Execution aborted by user at soft round limit");
    }

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
    const errMsg = err instanceof Error ? err.message : String(err);
    const isCancelled = errMsg.includes("aborted by user at soft round limit");

    spinner.prefixText = "";

    if (isCancelled) {
      spinner.stop();

      const doneCount = planSteps.filter((s) => s.status === "done").length;
      const total = planSteps.length;

      console.log(chalk.yellow("\nExecution stopped by user."));
      if (total > 0) {
        console.log(
          chalk.gray(`  Progress: ${doneCount}/${total} steps completed`),
        );
      }
      if (filesWritten.size > 0) {
        console.log(
          chalk.gray(
            `  Files written so far: ${filesWritten.size} (changes kept)`,
          ),
        );
      }
      console.log(
        chalk.gray("  Run ") +
          chalk.cyan("tambo init --magic") +
          chalk.gray(" again to continue where you left off."),
      );

      return {
        success: false,
        filesCreated: [...filesWritten].filter((f) => !filesRead.has(f)),
        filesModified: [...filesWritten].filter((f) => filesRead.has(f)),
        dependenciesInstalled: [],
        errors: [],
      };
    }

    spinner.fail("Execution failed");

    console.error(chalk.gray(`  Last status: ${lastStatus}`));
    if (planSteps.length > 0) {
      const doneCount = planSteps.filter((s) => s.status === "done").length;
      console.error(
        chalk.gray(
          `  Progress: ${doneCount}/${planSteps.length} steps completed`,
        ),
      );
    }

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
