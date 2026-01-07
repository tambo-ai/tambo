import fs from "fs";
import path from "path";

/**
 * Supported package managers
 */
export type PackageManager = "npm" | "pnpm" | "yarn";

/**
 * Detects the package manager used in a project by checking for lockfiles
 * Priority order: pnpm-lock.yaml > yarn.lock > package-lock.json > npm (default)
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

  // package-lock.json or no lockfile defaults to npm
  return "npm";
}

/**
 * Gets the install command for a package manager
 *
 * @param pm The package manager
 * @returns The install command (e.g., "install" for npm/yarn, "add" for pnpm)
 */
export function getInstallCommand(pm: PackageManager): string {
  return pm === "pnpm" ? "add" : "install";
}

/**
 * Gets the dev dependency flag for a package manager
 *
 * @param pm The package manager
 * @returns The dev flag (e.g., "-D" for npm/pnpm, "--dev" for yarn)
 */
export function getDevFlag(pm: PackageManager): string {
  return pm === "yarn" ? "--dev" : "-D";
}

/**
 * Gets the package runner command (npx equivalent) for a package manager
 *
 * @param pm The package manager
 * @returns The runner command (e.g., "npx", "pnpm dlx", "yarn dlx")
 */
export function getPackageRunner(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm dlx";
    case "yarn":
      return "yarn dlx";
    default:
      return "npx";
  }
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
    default:
      return ["npx", []];
  }
}
