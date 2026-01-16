import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Supported package managers
 * TODO: Add Bun support (uses bun.lockb) - currently falls back to npm
 */
export type PackageManager = "npm" | "pnpm" | "yarn" | "rush";

/**
 * Searches for a file in the current directory and all ancestor directories
 *
 * @param startDir The directory to start searching from
 * @param filename The filename to search for
 * @returns True if the file is found in any ancestor directory
 */
function findFileInAncestors(startDir: string, filename: string): boolean {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(currentDir, filename))) {
      return true;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached the root directory
      break;
    }
    currentDir = parentDir;
  }

  return false;
}

/**
 * Detects the package manager used in a project by checking for lockfiles and config files
 * Priority order: rush.json (in ancestors) > pnpm-lock.yaml > yarn.lock > package-lock.json > npm (default)
 *
 * @param projectRoot The root directory of the project (defaults to cwd)
 * @returns The detected package manager
 */
export function detectPackageManager(
  projectRoot: string = process.cwd(),
): PackageManager {
  if (findFileInAncestors(projectRoot, "rush.json")) {
    return "rush";
  }

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
 * @returns The install command (e.g., "install" for npm, "add" for pnpm/yarn/rush)
 */
export function getInstallCommand(pm: PackageManager): string {
  return pm === "npm" ? "install" : "add";
}

/**
 * Gets the dev dependency flag for a package manager
 *
 * @param pm The package manager
 * @returns The dev flag (e.g., "-D" for npm/pnpm, "--dev" for yarn/rush)
 */
export function getDevFlag(pm: PackageManager): string {
  return pm === "yarn" || pm === "rush" ? "--dev" : "-D";
}

/**
 * Builds the install command arguments for a package manager
 * Rush uses a different format with -p flags for each package
 *
 * @param pm The package manager
 * @param packages Array of package names to install
 * @param isDev Whether these are dev dependencies
 * @param legacyPeerDepsFlag Additional flags (like --legacy-peer-deps for npm)
 * @returns Complete argument array for execFileSync
 */
export function buildInstallArgs(
  pm: PackageManager,
  packages: string[],
  isDev = false,
  legacyPeerDepsFlag: string[] = [],
): string[] {
  const installCmd = getInstallCommand(pm);

  if (pm === "rush") {
    const args = [installCmd];

    // Add each package with -p flag
    packages.forEach((pkg) => {
      args.push("-p", pkg);
    });

    // Add dev flag if needed
    if (isDev) {
      args.push(getDevFlag(pm));
    }

    return args;
  }

  // Standard format for other package managers
  const devFlag = isDev ? getDevFlag(pm) : null;
  const args = [installCmd];

  if (devFlag) {
    args.push(devFlag);
  }

  args.push(...legacyPeerDepsFlag, ...packages);

  return args;
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
    case "rush":
      return ["npx", []]; // Rush doesn't have a direct equivalent to dlx, use npx
    default:
      return ["npx", []];
  }
}
