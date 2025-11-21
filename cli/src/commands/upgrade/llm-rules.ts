import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { handleAgentDocsUpdate } from "../shared/agent-docs.js";
import type { UpgradeOptions } from "./index.js";

function findLegacyCursorRules(): string[] {
  const projectRoot = process.cwd();
  const legacyFiles: string[] = [];

  const rulesDir = path.join(projectRoot, ".cursor", "rules");
  if (fs.existsSync(rulesDir)) {
    for (const entry of fs.readdirSync(rulesDir)) {
      const filePath = path.join(rulesDir, entry);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const lowerName = entry.toLowerCase();
      if (lowerName.includes("tambo")) {
        legacyFiles.push(filePath);
      }
    }
  }

  const rootCursorRules = path.join(projectRoot, ".cursorrules");
  if (fs.existsSync(rootCursorRules)) {
    legacyFiles.push(rootCursorRules);
  }

  return legacyFiles;
}

async function confirmRulesUpgrade(hasLegacyRules: boolean): Promise<boolean> {
  const message = hasLegacyRules
    ? "Legacy cursor rules detected. Replace them with AGENTS.md/CLAUDE.md docs?"
    : "Add AGENTS.md/CLAUDE.md guidance for LLMs?";

  const { proceed } = await inquirer.prompt({
    type: "confirm",
    name: "proceed",
    message,
    default: true,
  });

  return proceed;
}

export async function upgradeAgentDocsAndRemoveCursorRules(
  options: UpgradeOptions,
): Promise<boolean> {
  if (options.skipAgentDocs) return true;

  const legacyRules = findLegacyCursorRules();
  const hasLegacyRules = legacyRules.length > 0;

  if (!options.acceptAll) {
    const proceed = await confirmRulesUpgrade(hasLegacyRules);
    if (!proceed) {
      console.log(chalk.gray("Skipped agent docs and cursor rule updates."));
      return true;
    }
  }

  const spinner = ora(
    "Updating agent docs and cleaning legacy cursor rules...",
  ).start();

  try {
    for (const filePath of legacyRules) {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
      }
    }

    // Clean empty rules dir if we removed everything
    const rulesDir = path.join(process.cwd(), ".cursor", "rules");
    if (fs.existsSync(rulesDir)) {
      const remaining = fs
        .readdirSync(rulesDir)
        .filter((item) => fs.statSync(path.join(rulesDir, item)).isFile());
      if (remaining.length === 0) {
        fs.rmSync(rulesDir, { recursive: true });
      }
    }

    // Wrap agent docs update in try-catch
    try {
      await handleAgentDocsUpdate({
        acceptAll: options.acceptAll,
        prefix: options.prefix,
        skipPrompt: true,
        yes: options.acceptAll,
      });
    } catch (docError) {
      console.log(
        chalk.yellow(
          `⚠  Warning: Agent docs update failed: ${
            docError instanceof Error ? docError.message : String(docError)
          }`,
        ),
      );
    }

    spinner.succeed(
      hasLegacyRules
        ? "Removed legacy cursor rules and updated agent docs."
        : "Agent docs updated.",
    );
    return true;
  } catch (error) {
    spinner.fail(
      `Failed to remove cursor rules: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}
