/**
 * Dependency installation for code execution
 *
 * Handles collecting dependencies from installation plans and installing
 * them using the detected package manager.
 */

import ora from "ora";
import { execFileSync } from "../interactive.js";
import {
  detectPackageManager,
  validatePackageManager,
  getInstallCommand,
  getDevFlag,
  formatPackageArgs,
} from "../package-manager.js";
import type { DependencySet, InstallationPlan } from "./types.js";

/**
 * Installs dependencies using the detected package manager.
 * Installs production dependencies first, then dev dependencies.
 * Shows spinner progress and handles errors.
 *
 * @param deps - Dependencies to install
 * @param options - Installation options
 * @returns Promise that resolves when installation is complete
 * @throws Error if installation fails
 */
export async function installDependencies(
  deps: DependencySet,
  options?: { yes?: boolean },
): Promise<void> {
  const { dependencies, devDependencies } = deps;

  // Early return if nothing to install
  if (dependencies.length === 0 && devDependencies.length === 0) {
    return;
  }

  // Detect and validate package manager
  const pm = detectPackageManager();
  validatePackageManager(pm);

  const installCmd = getInstallCommand(pm);
  const devFlag = getDevFlag(pm);

  // Install production dependencies
  if (dependencies.length > 0) {
    const spinner = ora("Installing dependencies...").start();
    try {
      const formattedPackages = formatPackageArgs(pm, dependencies);
      execFileSync(pm, [...installCmd, ...formattedPackages], {
        stdio: "pipe",
        encoding: "utf-8",
        allowNonInteractive: Boolean(options?.yes),
      });
      spinner.succeed(
        `Installed ${dependencies.length} ${dependencies.length === 1 ? "dependency" : "dependencies"}`,
      );
    } catch (err) {
      spinner.fail("Failed to install dependencies");
      throw new Error(
        `Failed to install dependencies: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Install dev dependencies
  if (devDependencies.length > 0) {
    const spinner = ora("Installing dev dependencies...").start();
    try {
      const formattedPackages = formatPackageArgs(pm, devDependencies);
      execFileSync(pm, [...installCmd, devFlag, ...formattedPackages], {
        stdio: "pipe",
        encoding: "utf-8",
        allowNonInteractive: Boolean(options?.yes),
      });
      spinner.succeed(
        `Installed ${devDependencies.length} dev ${devDependencies.length === 1 ? "dependency" : "dependencies"}`,
      );
    } catch (err) {
      spinner.fail("Failed to install dev dependencies");
      throw new Error(
        `Failed to install dev dependencies: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

/**
 * Collects dependencies from an installation plan and selected items.
 * Always includes @tambo-ai/react as a base dependency.
 * Adds zod if any tools are selected (tools use zod for validation).
 *
 * @param plan - Installation plan (currently unused, for future expansion)
 * @param selectedItems - Array of selected item IDs
 * @returns DependencySet with dependencies to install
 */
export function collectDependencies(
  plan: InstallationPlan,
  selectedItems: string[],
): DependencySet {
  const dependencies: string[] = ["@tambo-ai/react"];

  // Check if any tools are selected
  const hasTools = selectedItems.some((item) => item.startsWith("tool-"));
  if (hasTools) {
    dependencies.push("zod");
  }

  return {
    dependencies,
    devDependencies: [],
  };
}
