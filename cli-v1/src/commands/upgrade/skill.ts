import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { installSkill, type SkillInstallResult } from "../shared/skill-install.js";
import { handlePromptError } from "../../utils/interactive.js";
import type { UpgradeOptions } from "./index.js";

export interface SkillUpgradeResult {
  success: boolean;
  result?: SkillInstallResult;
}

/**
 * Install/upgrade the tambo skill for AI agents.
 */
export async function upgradeSkill(options: UpgradeOptions): Promise<SkillUpgradeResult> {
  if (options.skipAgentDocs) return { success: true };

  if (!options.yes) {
    try {
      const { proceed } = await inquirer.prompt({
        type: "confirm",
        name: "proceed",
        message: "Install/update tambo skill for AI agents?",
        default: true,
      });

      if (!proceed) {
        console.log(chalk.gray("Skipped skill installation."));
        return { success: true };
      }
    } catch (error) {
      handlePromptError(error);
      return { success: false };
    }
  }

  const spinner = ora("Installing tambo skill...").start();

  try {
    const result = await installSkill({ prefix: options.prefix });
    spinner.succeed("Skill installed.");
    return { success: true, result };
  } catch (error) {
    spinner.fail(
      `Failed to install skill: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return { success: false };
  }
}
