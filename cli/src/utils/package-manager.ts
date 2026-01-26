import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Supported package managers
 * TODO: Add Bun support (uses bun.lockb) - currently falls back to npm
 */
export type PackageManager = "npm" | "pnpm" | "yarn" | "rush";

/**
 * Searches for a file in the given directory and all ancestor directories
 *
 * @param filename The filename to search for
 * @param startDir The directory to start searching from (defaults to cwd)
 * @returns The path to the file if found, null otherwise
 */
export function findFileInAncestors(
  filename: string,
  startDir: string = process.cwd(),
): string | null {
  let currentDir = path.resolve(startDir);

  while (true) {
    const filePath = path.join(currentDir, filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      return null;
    }
    currentDir = parentDir;
  }
}

/**
 * Detects the package manager used in a project by checking for lockfiles
 * Priority order: rush.json > pnpm-lock.yaml > yarn.lock > package-lock.json > npm (default)
 *
 * Rush is checked first because Rush monorepos may also contain other lockfiles
 * (pnpm-lock.yaml, yarn.lock) since Rush can use different package managers internally.
 *
 * For Rush, we search ancestor directories since rush.json exists at the monorepo root
 * but commands are typically run from project subdirectories.
 *
 * @param projectRoot The root directory of the project (defaults to cwd)
 * @returns The detected package manager
 */
export function detectPackageManager(
  projectRoot: string = process.cwd(),
): PackageManager {
  // Rush.json may be in an ancestor directory (monorepo root)
  if (findFileInAncestors("rush.json", projectRoot) !== null) {
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
 * Gets the install command arguments for a package manager when installing specific packages
 *
 * @param pm The package manager
 * @returns The install command as an array (e.g., ["install"] for npm, ["add"] for pnpm/yarn/rush)
 */
export function getInstallCommand(pm: PackageManager): string[] {
  if (pm === "rush") return ["update"];
  if (pm === "npm") return ["install"];
  return ["add"];
}

/**
 * Formats package names for installation with the appropriate flags for each package manager.
 * Rush requires `-p` before each package: `rush add -p pkg1 -p pkg2`
 * Other package managers accept packages as a simple list: `npm install pkg1 pkg2`
 *
 * @param pm The package manager
 * @param packages Array of package names to install
 * @returns Array of arguments ready to be spread into the command
 */
export function formatPackageArgs(
  pm: PackageManager,
  packages: string[],
): string[] {
  if (pm === "rush") {
    // Rush requires -p before each package
    return packages.flatMap((pkg) => ["-p", pkg]);
  }
  return packages;
}

/**
 * Gets the dev dependency flag for a package manager
 *
 * @param pm The package manager
 * @returns The dev flag (e.g., "-D" for npm/pnpm, "--dev" for yarn/rush)
 */
export function getDevFlag(pm: PackageManager): string {
  if (pm === "yarn" || pm === "rush") return "--dev";
  return "-D";
}

/**
 * Gets the package runner as command and args for execFileSync
 *
 * @param pm The package manager
 * @returns Tuple of [command, additionalArgs] for the runner
 */
export function getPackageRunnerArgs(pm: PackageManager): [string, string[]] {
  switch (pm) {
    case "rush":
      return ["rushx", []];
    case "pnpm":
      return ["pnpm", ["dlx"]];
    case "yarn":
      return ["yarn", ["dlx"]];
    default:
      return ["npx", []];
  }
}
