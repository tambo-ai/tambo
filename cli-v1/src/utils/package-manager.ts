import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Supported package managers
 */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Detects the package manager used in a project by checking for lockfiles
 * Priority order: pnpm-lock.yaml > yarn.lock > bun.lockb > package-lock.json > npm (default)
 *
 * @param projectRoot The root directory of the project (defaults to cwd)
 * @returns The detected package manager
 */
export function detectPackageManager(
  projectRoot: string = process.cwd(),
): PackageManager {
  if (fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (fs.existsSync(path.join(projectRoot, "yarn.lock"))) {
    return "yarn";
  }

  if (fs.existsSync(path.join(projectRoot, "bun.lockb"))) {
    return "bun";
  }

  // package-lock.json or no lockfile defaults to npm
  return "npm";
}

/**
 * Validates that the detected package manager is actually installed on the system.
 * Throws an error with a helpful message if not installed.
 *
 * @param pm The package manager to validate
 * @throws Error if the package manager is not installed
 */
export function validatePackageManager(pm: PackageManager): void {
  try {
    execFileSync(pm, ["--version"], { stdio: "ignore" });
  } catch {
    throw new Error(
      `Detected ${pm} from lockfile but ${pm} is not installed. Please install ${pm} first.`,
    );
  }
}

/**
 * Gets the install command for a package manager when installing specific packages
 *
 * @param pm The package manager
 * @returns The install command (e.g., "install" for npm, "add" for pnpm/yarn/bun)
 */
export function getInstallCommand(pm: PackageManager): string {
  return pm === "npm" ? "install" : "add";
}

/**
 * Gets the dev dependency flag for a package manager
 *
 * @param pm The package manager
 * @returns The dev flag (e.g., "-D" for npm/pnpm/bun, "--dev" for yarn)
 */
export function getDevFlag(pm: PackageManager): string {
  return pm === "yarn" ? "--dev" : "-D";
}

/**
 * Gets the package runner as command and args for execFileSync
 *
 * @param pm The package manager
 * @returns Tuple of [command, additionalArgs] for the runner
 */
export function getPackageRunnerArgs(pm: PackageManager): [string, string[]] {
  switch (pm) {
    case "pnpm":
      return ["pnpm", ["dlx"]];
    case "yarn":
      return ["yarn", ["dlx"]];
    case "bun":
      return ["bunx", []];
    default:
      return ["npx", []];
  }
}
