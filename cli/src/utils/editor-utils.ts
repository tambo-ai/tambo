import { execSync } from "./interactive.js";
import { spawn } from "child_process";
import { interactivePrompt } from "./interactive.js";
import chalk from "chalk";

export interface EditorInfo {
  command: string;
  name: string;
}

const KNOWN_EDITORS: EditorInfo[] = [
  { command: "code", name: "VS Code" },
  { command: "cursor", name: "Cursor" },
  { command: "idea", name: "IntelliJ IDEA" },
  { command: "webstorm", name: "WebStorm" },
  { command: "subl", name: "Sublime Text" },
  { command: "vim", name: "Vim" },
  { command: "nvim", name: "Neovim" },
];

/**
 * Checks if a command is available on the system.
 *
 * Uses `command -v` on Unix-like systems and `where` on Windows.
 *
 * @param command - The command to check
 * @returns true if command is available, false otherwise
 */
function isCommandAvailable(command: string): boolean {
  try {
    const checkCommand =
      process.platform === "win32"
        ? `where ${command}`
        : `command -v ${command}`;

    execSync(checkCommand, {
      stdio: "ignore",
      allowNonInteractive: true,
    });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Detects the user's preferred editor.
 *
 * Detection strategy:
 * 1. Check VISUAL environment variable
 * 2. Check EDITOR environment variable
 * 3. Check for common editors (code, cursor, idea, webstorm, subl, vim, nvim)
 *
 * @returns EditorInfo if an editor is found, null otherwise
 *
 * @example
 * const editor = detectEditor();
 * if (editor) {
 *   console.log(`Found ${editor.name} at ${editor.command}`);
 * }
 */
export function detectEditor(): EditorInfo | null {
  // Check environment variables first
  const visualEditor = process.env.VISUAL;
  if (visualEditor && isCommandAvailable(visualEditor)) {
    return { command: visualEditor, name: "default editor" };
  }

  const envEditor = process.env.EDITOR;
  if (envEditor && isCommandAvailable(envEditor)) {
    return { command: envEditor, name: "default editor" };
  }

  // Check for known editors
  for (const editor of KNOWN_EDITORS) {
    if (isCommandAvailable(editor.command)) {
      return editor;
    }
  }

  return null;
}

/**
 * Opens a project directory in the user's preferred editor.
 *
 * Workflow:
 * 1. Detect available editor
 * 2. Prompt user for confirmation
 * 3. Launch editor with project path
 *
 * @param projectPath - The absolute path to the project directory
 * @returns true if editor was launched successfully, false otherwise
 *
 * @example
 * const opened = await openInEditor("/path/to/project");
 */
export async function openInEditor(projectPath: string): Promise<boolean> {
  const editor = detectEditor();

  if (!editor) {
    console.log(chalk.gray("No editor detected. Skipping."));
    return false;
  }

  const { shouldOpen } = await interactivePrompt<{ shouldOpen: boolean }>(
    {
      type: "confirm",
      name: "shouldOpen",
      message: `Open project in ${editor.name}?`,
      default: true,
    },
    chalk.yellow(
      "Cannot prompt to open editor in non-interactive mode. Skipping.",
    ),
  );

  if (!shouldOpen) {
    console.log(chalk.gray("Skipping editor launch"));
    return false;
  }

  try {
    // Use spawn instead of execSync for better compatibility
    // This allows the CLI to exit while the editor stays open
    spawn(editor.command, [projectPath], {
      detached: true,
      stdio: "ignore",
    }).unref();

    console.log(chalk.green(`Opened in ${editor.name}`));
    return true;
  } catch (error) {
    console.error(
      chalk.red(
        `Failed to open editor: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return false;
  }
}
