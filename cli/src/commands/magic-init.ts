/**
 * Magic init orchestrator - connects all phases into a single --magic pipeline
 *
 * This module implements the handleMagicInit function that orchestrates:
 * - Phase 2: Project analysis
 * - Phase 3: Plan generation
 * - Phase 4: User confirmation
 * - Phase 5: Code execution
 *
 * It includes progressive spinner UX, analysis summary display, additive
 * re-run detection, and error recovery with fix commands.
 */

import chalk from "chalk";
import fs from "node:fs";
import ora from "ora";
import {
  analyzeProject,
  type ProjectAnalysis,
} from "../utils/project-analysis/index.js";
import {
  generatePlan,
  type InstallationPlan,
} from "../utils/plan-generation/index.js";
import {
  confirmPlan,
  type ConfirmationResult,
} from "../utils/user-confirmation/index.js";
import {
  executeCodeChanges,
  categorizeExecutionError,
  formatExecutionError,
} from "../utils/code-execution/index.js";
import {
  GuidanceError,
  interactivePrompt,
  isInteractive,
} from "../utils/interactive.js";
import { findTamboApiKey } from "../utils/dotenv-utils.js";

export interface MagicInitOptions {
  yes?: boolean;
  skipAgentDocs?: boolean;
}

interface ExistingSetup {
  hasProvider: boolean;
  existingComponents: string[];
}

/**
 * Gets the Tambo API key for magic init
 * Reads from .env.local or process.env.TAMBO_API_KEY
 *
 * @returns API key string or undefined if not found
 */
function getApiKeyForMagic(): string | undefined {
  // Check process.env first
  if (process.env.TAMBO_API_KEY) {
    return process.env.TAMBO_API_KEY;
  }

  // Check .env.local file
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, "utf-8");
      const keyInfo = findTamboApiKey(content);
      if (keyInfo) {
        return keyInfo.value;
      }
    }
  }

  return undefined;
}

/**
 * Displays a summary of the analysis results
 *
 * @param analysis - Project analysis result
 */
function displayAnalysisSummary(analysis: ProjectAnalysis): void {
  console.log("\n" + chalk.bold("Analysis Summary:"));
  console.log(
    chalk.gray(
      `  Framework: ${analysis.framework.displayName}${
        analysis.framework.variant ? ` (${analysis.framework.variant})` : ""
      }`,
    ),
  );
  console.log(chalk.gray(`  Components found: ${analysis.components.length}`));
  console.log(
    chalk.gray(`  Tool candidates: ${analysis.toolCandidates.length}`),
  );
  console.log(chalk.gray(`  Providers in use: ${analysis.providers.length}`));
}

/**
 * Detects existing Tambo setup for additive re-runs
 * Checks for TamboProvider in root layout and registered components in tambo.ts
 *
 * @param analysis - Project analysis result
 * @returns Information about existing setup
 */
function detectExistingSetup(analysis: ProjectAnalysis): ExistingSetup {
  const existing: ExistingSetup = {
    hasProvider: false,
    existingComponents: [],
  };

  // Check for TamboProvider in root layout
  if (analysis.structure.rootLayoutPath) {
    try {
      const layoutContent = fs.readFileSync(
        analysis.structure.rootLayoutPath,
        "utf-8",
      );
      existing.hasProvider = layoutContent.includes("TamboProvider");
    } catch {
      // If file doesn't exist or can't be read, treat as no provider
    }
  }

  // Check for tambo.ts in lib directory
  const possibleTamboPaths = [
    "src/lib/tambo.ts",
    "lib/tambo.ts",
    "src/lib/tambo.tsx",
    "lib/tambo.tsx",
  ];

  for (const tamboPath of possibleTamboPaths) {
    if (fs.existsSync(tamboPath)) {
      try {
        const tamboContent = fs.readFileSync(tamboPath, "utf-8");
        // Extract component names from components array
        // Look for patterns like: import { ComponentName } from "..."
        const importMatches = tamboContent.matchAll(
          /import\s+\{\s*([^}]+)\s*\}\s+from/g,
        );
        for (const match of importMatches) {
          const imports = match[1].split(",").map((s) => s.trim());
          existing.existingComponents.push(...imports);
        }
      } catch {
        // If file can't be read, skip
      }
      break; // Only check first found tambo file
    }
  }

  return existing;
}

/**
 * Filters an installation plan to remove already-configured items
 * Used for additive re-runs
 *
 * @param plan - Original installation plan
 * @param existing - Existing setup information
 * @returns Filtered plan with existing items removed/marked as skipped
 */
function filterPlanForRerun(
  plan: InstallationPlan,
  existing: ExistingSetup,
): InstallationPlan {
  // Clone the plan to avoid mutation
  const filtered: InstallationPlan = JSON.parse(JSON.stringify(plan));

  // If provider already exists, mark provider setup as skipped
  if (existing.hasProvider) {
    filtered.providerSetup.confidence = 0; // Will be filtered out by confirmPlan
  }

  // Filter out components that are already registered
  filtered.componentRecommendations = filtered.componentRecommendations.filter(
    (component) => !existing.existingComponents.includes(component.name),
  );

  return filtered;
}

/**
 * Main magic init orchestrator
 * Runs the full analyze → plan → confirm → execute pipeline
 *
 * @param options - Magic init options
 */
export async function handleMagicInit(
  options: MagicInitOptions,
): Promise<void> {
  // 1. API key check
  const apiKey = getApiKeyForMagic();
  if (!apiKey) {
    throw new Error(
      "No API key found. Please run `tambo init` first to set up your API key.",
    );
  }

  let analysis: ProjectAnalysis;
  let spinner = ora();

  try {
    // 2. Phase 2 — Analysis
    spinner.start("Analyzing project...");

    try {
      spinner.text = "Detecting framework...";
      // Framework detection happens first in analyzeProject
      analysis = analyzeProject(process.cwd());

      spinner.text = "Detecting components...";
      // Component detection is part of analyzeProject

      spinner.text = "Finding tools...";
      // Tool detection is part of analyzeProject

      spinner.succeed("Analysis complete");

      // Display analysis summary
      displayAnalysisSummary(analysis);
    } catch (error) {
      spinner.fail("Analysis failed");

      // If interactive, prompt to continue anyway
      if (isInteractive()) {
        const { continueAnyway } = await interactivePrompt<{
          continueAnyway: boolean;
        }>(
          {
            type: "confirm",
            name: "continueAnyway",
            message: chalk.yellow(
              "Could not detect framework. Continue anyway?",
            ),
            default: false,
          },
          chalk.yellow(
            "Analysis failed in non-interactive mode. Cannot continue.",
          ),
        );

        if (!continueAnyway) {
          throw error;
        }

        // Use minimal analysis object to continue
        analysis = {
          framework: {
            name: "unknown",
            displayName: "Unknown",
            envPrefix: null,
          },
          structure: {
            hasSrcDir: false,
            srcPath: null,
            appDirPath: null,
            pagesDirPath: null,
            componentsDirs: [],
            rootLayoutPath: null,
          },
          typescript: {
            isTypeScript: false,
            configPath: null,
            strict: null,
          },
          packageManager: "npm",
          providers: [],
          components: [],
          toolCandidates: [],
        };
      } else {
        // Non-interactive mode - throw
        throw error;
      }
    }

    // 3. Additive re-run detection
    const existingSetup = detectExistingSetup(analysis);
    if (
      existingSetup.hasProvider ||
      existingSetup.existingComponents.length > 0
    ) {
      console.log(chalk.blue("\nDetected existing Tambo setup:"));
      if (existingSetup.hasProvider) {
        console.log(chalk.gray("  • TamboProvider already configured"));
      }
      if (existingSetup.existingComponents.length > 0) {
        console.log(
          chalk.gray(
            `  • ${existingSetup.existingComponents.length} component(s) already registered`,
          ),
        );
      }
      console.log(chalk.gray("  → Will only recommend new items\n"));
    }

    // 4. Phase 3 — Plan generation
    spinner = ora("Generating installation plan...").start();

    let plan: InstallationPlan;
    try {
      plan = await generatePlan({
        projectAnalysis: analysis,
        apiKey,
      });
      spinner.succeed("Plan generated");
    } catch (error) {
      spinner.fail("Plan generation failed");
      throw error;
    }

    // Filter plan for re-runs
    if (
      existingSetup.hasProvider ||
      existingSetup.existingComponents.length > 0
    ) {
      plan = filterPlanForRerun(plan, existingSetup);
    }

    // 5. Phase 4 — Confirmation
    const confirmation: ConfirmationResult = await confirmPlan(plan, {
      yes: options.yes,
      analysis,
    });

    if (!confirmation.approved) {
      console.log(chalk.gray("\nSetup cancelled"));
      return;
    }

    // 6. Phase 5 — Execution
    spinner = ora("Executing changes...").start();

    try {
      const result = await executeCodeChanges(confirmation, {
        yes: options.yes,
        apiKey,
      });

      spinner.succeed("Setup complete");

      // Display recap
      console.log(chalk.green("\n✨ Magic init completed successfully!"));
      console.log("\n" + chalk.bold("Summary:"));
      console.log(chalk.gray(`  Files created: ${result.filesCreated.length}`));
      if (result.filesCreated.length > 0) {
        for (const file of result.filesCreated) {
          console.log(chalk.gray(`    • ${file}`));
        }
      }

      console.log(
        chalk.gray(`  Files modified: ${result.filesModified.length}`),
      );
      if (result.filesModified.length > 0) {
        for (const file of result.filesModified) {
          console.log(chalk.gray(`    • ${file}`));
        }
      }

      console.log(
        chalk.gray(
          `  Dependencies installed: ${result.dependenciesInstalled.length}`,
        ),
      );
      if (result.dependenciesInstalled.length > 0) {
        for (const dep of result.dependenciesInstalled) {
          console.log(chalk.gray(`    • ${dep}`));
        }
      }

      // Show warnings if any
      if (result.errors.length > 0) {
        console.log(chalk.yellow("\n⚠ Warnings:"));
        for (const error of result.errors) {
          console.log(chalk.yellow(`  ${error.filePath}: ${error.issue}`));
          console.log(chalk.gray(`    → ${error.suggestion}`));
        }
      }

      // Show next steps
      console.log("\n" + chalk.bold("Next steps:"));
      console.log(
        chalk.gray("  1. Run ") +
          chalk.cyan("npm run dev") +
          chalk.gray(" to start your app"),
      );
      console.log(
        chalk.gray("  2. Visit ") +
          chalk.cyan("https://docs.tambo.co") +
          chalk.gray(" for detailed documentation"),
      );
    } catch (error) {
      spinner.fail("Execution failed");

      // Format and display error with fix commands
      const executionError = categorizeExecutionError(
        error instanceof Error ? error : new Error(String(error)),
      );
      console.error("\n" + formatExecutionError(executionError));

      // Show additional fix commands based on error phase
      if (executionError.phase === "dependency-install") {
        console.log("\n" + chalk.bold("Additional fixes to try:"));
        console.log(
          chalk.cyan("  npm install --legacy-peer-deps") +
            chalk.gray(" # Try with legacy peer deps"),
        );
        console.log(
          chalk.cyan("  npm install --force") +
            chalk.gray(" # Force install if needed"),
        );
      } else if (executionError.phase === "file-write") {
        const errno = (error as NodeJS.ErrnoException).code;
        if (errno === "EACCES") {
          console.log("\n" + chalk.bold("Permission issue detected:"));
          console.log(
            chalk.cyan("  sudo chown -R $(whoami) .") +
              chalk.gray(" # Fix file permissions"),
          );
        }
      }

      throw error;
    }
  } catch (error) {
    // Handle top-level errors
    if (error instanceof GuidanceError) {
      console.error("\n" + chalk.red(error.message));
      console.log("\n" + chalk.bold("Example usage:"));
      for (const guidance of error.guidance) {
        console.log(chalk.cyan(`  ${guidance}`));
      }
    }
    throw error;
  }
}
