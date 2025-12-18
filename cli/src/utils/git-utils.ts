import fs from "fs";
import path from "path";
import { execSync, interactivePrompt } from "./interactive.js";
import chalk from "chalk";

/**
 * Checks if git is available on the system by attempting to run git --version.
 *
 * @returns true if git is available, false otherwise
 */
export function isGitAvailable(): boolean {
  try {
    execSync("git --version", {
      stdio: "ignore",
      allowNonInteractive: true,
    });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Checks if a git repository exists in the project root.
 *
 * @param projectRoot - The root directory of the project
 * @returns true if .git directory exists, false otherwise
 */
export function hasGitRepo(projectRoot: string): boolean {
  const gitPath = path.join(projectRoot, ".git");
  try {
    return fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory();
  } catch (_error) {
    return false;
  }
}

/**
 * Initializes a new git repository with an initial commit.
 *
 * Workflow:
 * 1. Check if git is available
 * 2. Check if .git directory already exists
 * 3. Prompt user for confirmation
 * 4. Run git init, add all files, and create initial commit
 *
 * @param projectRoot - The root directory of the project
 * @param templateName - Name of the template (used in commit message)
 * @returns true if git initialization was successful, false otherwise
 *
 * @example
 * const success = await initializeGit(process.cwd(), "standard");
 * // Creates: "Initial commit from Tambo standard template"
 */
export async function initializeGit(
  projectRoot: string,
  templateName: string,
): Promise<boolean> {
  if (!isGitAvailable()) {
    console.log(
      chalk.gray("Git not found, skipping repository initialization"),
    );
    return false;
  }

  if (hasGitRepo(projectRoot)) {
    console.log(chalk.gray("Git repository already initialized"));
    return false;
  }

  const { shouldInit } = await interactivePrompt<{ shouldInit: boolean }>(
    {
      type: "confirm",
      name: "shouldInit",
      message: "Initialize git repository?",
      default: true,
    },
    chalk.yellow(
      "Cannot prompt for git initialization in non-interactive mode. Skipping git setup.",
    ),
  );

  if (!shouldInit) {
    console.log(chalk.gray("Skipping git initialization"));
    return false;
  }

  try {
    execSync("git init", {
      cwd: projectRoot,
      stdio: "ignore",
      allowNonInteractive: true,
    });

    execSync("git add .", {
      cwd: projectRoot,
      stdio: "ignore",
      allowNonInteractive: true,
    });

    const commitMessage = `Initial commit from Tambo ${templateName} template`;
    execSync(`git commit -m "${commitMessage}"`, {
      cwd: projectRoot,
      stdio: "ignore",
      allowNonInteractive: true,
    });

    return true;
  } catch (error) {
    console.error(
      chalk.red(
        `Failed to initialize git: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return false;
  }
}
