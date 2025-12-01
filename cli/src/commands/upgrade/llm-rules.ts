import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { handleAgentDocsUpdate } from "../shared/agent-docs.js";
import type { UpgradeOptions } from "./index.js";

// Exact file that Tambo CLI previously created via templates
const LEGACY_CURSOR_RULE_FILE = ".cursor/rules/tambo-ai.mdc";

function findLegacyCursorRules(): string[] {
  const projectRoot = process.cwd();
  const legacyFile = path.join(projectRoot, LEGACY_CURSOR_RULE_FILE);

  if (fs.existsSync(legacyFile)) {
    return [legacyFile];
  }
  return [];
}

/**
 * Upgrade agent documentation (AGENTS.md/CLAUDE.md) and remove legacy cursor rules.
 */
export async function upgradeAgentDocsAndRemoveCursorRules(
  options: UpgradeOptions,
): Promise<boolean> {
  if (options.skipAgentDocs) return true;

  const legacyRules = findLegacyCursorRules();
  const hasLegacyRules = legacyRules.length > 0;

  if (!options.yes) {
    const message = hasLegacyRules
      ? "Found legacy tambo-ai.mdc cursor rules. Replace with AGENTS.md/CLAUDE.md?"
      : "Add/update AGENTS.md and CLAUDE.md guidance for LLMs?";

    const { proceed } = await inquirer.prompt({
      type: "confirm",
      name: "proceed",
      message,
      default: true,
    });

    if (!proceed) {
      console.log(chalk.gray("Skipped agent docs update."));
      return true;
    }
  }

  const spinner = ora("Updating agent documentation...").start();

  try {
    // Remove legacy cursor rules file if it exists
    for (const filePath of legacyRules) {
      try {
        fs.rmSync(filePath);
      } catch (error) {
        // Ignore ENOENT (file already deleted)
        if (
          !(
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          )
        ) {
          throw error;
        }
      }
    }

    // Clean up empty .cursor/rules directory
    const rulesDir = path.join(process.cwd(), ".cursor", "rules");
    if (fs.existsSync(rulesDir)) {
      const remaining = fs.readdirSync(rulesDir);
      if (remaining.length === 0) {
        fs.rmdirSync(rulesDir);
      }
    }

    await handleAgentDocsUpdate({
      prefix: options.prefix,
      skipPrompt: true,
      yes: options.yes,
    });

    spinner.succeed(
      hasLegacyRules
        ? "Removed legacy cursor rules and updated agent docs."
        : "Agent docs updated.",
    );
    return true;
  } catch (error) {
    spinner.fail(
      `Failed to update agent docs: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}
