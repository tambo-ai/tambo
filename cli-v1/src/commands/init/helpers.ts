/**
 * Helper functions for init command
 */

import { execFileSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";

import { api } from "../../lib/api-client.js";
import { DeviceAuthError, runDeviceAuthFlow } from "../../lib/device-auth.js";
import { findTamboApiKey } from "../../utils/dotenv-utils.js";
import { writeApiKeyToEnv } from "../../utils/env-helpers.js";
import { getSafeErrorMessage } from "../../utils/error-helpers.js";
import {
  handlePromptError,
  NonInteractiveError,
} from "../../utils/interactive.js";
import { out } from "../../utils/output.js";
import { getLibDirectory } from "../../utils/path-utils.js";
import {
  detectPackageManager,
  getInstallCommand,
} from "../../utils/package-manager.js";
import { detectProjectStatus } from "../../utils/project-detection.js";
import { isTTY } from "../../utils/tty.js";
import { tamboTsTemplate } from "../../templates/tambo-ts.js";
import { installSkill } from "../shared/skill-install.js";
import type { InitResult } from "./types.js";

export function checkApiKey(jsonMode: boolean): {
  found: boolean;
  file?: string;
  keyName?: string;
} {
  const envFiles = [".env.local", ".env"];

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      const existingKey = findTamboApiKey(content);
      if (existingKey) {
        if (!jsonMode) {
          out.success(`Found API key (${existingKey.keyName}) in ${file}`);
        }
        return { found: true, file, keyName: existingKey.keyName };
      }
    }
  }

  if (!jsonMode) {
    out.warning("No API key found in .env.local or .env");
    out.explanation([
      "Tambo requires an API key to function.",
      "You can:",
      "  1. Run 'tambov1 init' to set one up",
      "  2. Run 'tambov1 project api-key <project-id>' to generate one",
      "  3. Manually add TAMBO_API_KEY to your .env file",
    ]);
  }

  return { found: false };
}

export function renderStatusLine(label: string, ok: boolean): void {
  const message = ok ? `✓ ${label}` : `✗ ${label}`;
  if (ok) {
    out.success(message);
  } else {
    out.warning(message);
  }
}

export function getInstallArgs(): { command: string; args: string[] } {
  const packageManager = detectPackageManager();
  return {
    command: packageManager,
    args: [getInstallCommand(packageManager), "@tambo-ai/react"],
  };
}

export async function ensureAuthenticated(jsonMode: boolean): Promise<boolean> {
  if (!jsonMode) {
    out.subheader("AUTHENTICATION");
    out.info("Starting device authentication flow...");
    out.explanation([
      "A browser window will open for authentication.",
      "If running headless, use the verification URL printed below.",
    ]);
  }

  try {
    const authResult = await runDeviceAuthFlow();
    if (!jsonMode) {
      out.success(
        `Authenticated as ${authResult.user.email ?? authResult.user.name ?? "user"}`,
      );
    }
    return true;
  } catch (error) {
    const safeMessage = getSafeErrorMessage(error);
    if (error instanceof DeviceAuthError) {
      if (!jsonMode) {
        out.error("Authentication failed");
      }
      throw new Error(`Authentication failed: ${safeMessage}`);
    }

    if (!jsonMode) {
      out.error(`Authentication error: ${safeMessage}`);
    }
    throw new Error(`Authentication error: ${safeMessage}`);
  }
}

export async function createProjectAndApiKey(
  projectName: string,
  result: InitResult,
  jsonMode: boolean,
  dryRun: boolean,
): Promise<void> {
  if (!jsonMode) {
    out.subheader("PROJECT SETUP");
  }

  if (dryRun) {
    result.warnings.push(
      "Dry run: skipped project creation and API key generation",
    );
    return;
  }

  const createSpinner =
    jsonMode || !isTTY() ? null : ora("Creating project...").start();

  try {
    const project = await api.project.createProject2.mutate({
      name: projectName,
    });
    createSpinner?.succeed(`Created project: ${project.name}`);
    result.projectName = project.name;
    result.projectCreated = true;

    if (!jsonMode) {
      out.subheader("API KEY");
    }

    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const keySpinner =
      jsonMode || !isTTY() ? null : ora("Generating API key...").start();
    const keyResult = await api.project.generateApiKey.mutate({
      projectId: project.id,
      name: `CLI Key (${timestamp})`,
    });
    keySpinner?.succeed("API key generated");

    const envResult = writeApiKeyToEnv(keyResult.apiKey, {
      jsonMode,
      onFileCreated: (file) => result.filesCreated.push(file),
      onFileModified: (file) => result.filesModified.push(file),
    });

    result.apiKeyCreated = true;
    result.envFile = envResult.envFile;

    if (!jsonMode) {
      out.success(`Saved API key to ${envResult.envFile}`);
    }
  } catch (error) {
    createSpinner?.fail("Failed to create project");
    throw new Error(`Failed to create project: ${getSafeErrorMessage(error)}`);
  }
}

export function exitOnError(result: InitResult, jsonMode: boolean): void {
  if (result.errors.length === 0) return;
  if (jsonMode) {
    out.json(result);
  } else {
    out.error(result.errors.join("; "));
  }
  process.exit(1);
}

export function createInitResult(): InitResult {
  return {
    success: false,
    tamboReactInstalled: false,
    authenticated: false,
    projectCreated: false,
    apiKeyCreated: false,
    tamboTsCreated: false,
    skillInstalled: false,
    errors: [],
    warnings: [],
    filesCreated: [],
    filesModified: [],
    packagesInstalled: [],
    suggestedCommands: [],
  };
}

export function displayProjectStatus(
  status: Awaited<ReturnType<typeof detectProjectStatus>>,
): void {
  out.header("INITIALIZE TAMBO");
  out.subheader("CHECKING PROJECT STATUS");
  renderStatusLine("Found package.json", status.hasPackageJson);
  renderStatusLine("@tambo-ai/react installed", status.hasTamboReact);
  renderStatusLine("Authenticated", status.authenticated);
  renderStatusLine("API key configured", status.hasApiKey);
  renderStatusLine("tambo.ts exists", status.hasTamboTs);
  renderStatusLine("Skill installed", status.hasAgentDocs);
}

export async function installTamboReact(
  result: InitResult,
  jsonMode: boolean,
  isInteractive: boolean,
  isDryRun: boolean,
): Promise<void> {
  if (!jsonMode) {
    out.subheader("DEPENDENCIES");
  }

  if (isDryRun) {
    result.warnings.push("Dry run: skipped installing @tambo-ai/react");
    return;
  }

  const spinner =
    jsonMode || !isInteractive
      ? null
      : ora("Installing @tambo-ai/react...").start();

  try {
    const installArgs = getInstallArgs();
    execFileSync(installArgs.command, installArgs.args, { stdio: "ignore" });
    result.tamboReactInstalled = true;
    result.packagesInstalled.push("@tambo-ai/react");
    spinner?.succeed("Installed @tambo-ai/react");
  } catch (error) {
    spinner?.fail("Failed to install @tambo-ai/react");
    result.errors.push(
      `Failed to install @tambo-ai/react: ${getSafeErrorMessage(error)}`,
    );
  }
}

export async function handleAuthentication(
  result: InitResult,
  jsonMode: boolean,
  isDryRun: boolean,
): Promise<void> {
  if (isDryRun) {
    result.warnings.push("Dry run: skipped authentication");
    return;
  }

  try {
    const authSuccess = await ensureAuthenticated(jsonMode);
    result.authenticated = authSuccess;
  } catch (error) {
    result.errors.push(String(error));
  }
}

export async function promptForProjectName(
  providedName: string | undefined,
  isInteractive: boolean,
): Promise<string> {
  if (providedName) {
    return providedName;
  }

  if (!isInteractive) {
    throw new NonInteractiveError(
      "Project name required. Use --project-name <name> to specify.",
    );
  }

  try {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Project name:",
        default: path.basename(process.cwd()),
      },
    ]);

    return response.projectName;
  } catch (error) {
    handlePromptError(error);
  }
}

export function createTamboConfigFile(
  result: InitResult,
  projectRoot: string,
  prefix: string,
  jsonMode: boolean,
  isDryRun: boolean,
): void {
  if (!jsonMode) {
    out.subheader("LOCAL FILES");
  }

  const isExplicitPrefix = prefix !== "src/components";

  try {
    const libDir = getLibDirectory(projectRoot, prefix, isExplicitPrefix);
    fs.mkdirSync(libDir, { recursive: true });
    const tamboTsPath = path.join(libDir, "tambo.ts");
    result.tamboTsPath = tamboTsPath;

    if (fs.existsSync(tamboTsPath)) {
      if (!jsonMode) {
        out.info("tambo.ts already exists, skipping");
      }
      return;
    }

    if (isDryRun) {
      result.warnings.push("Dry run: skipped creating tambo.ts");
      return;
    }

    fs.writeFileSync(tamboTsPath, tamboTsTemplate);
    result.tamboTsCreated = true;
    result.filesCreated.push(tamboTsPath);
    if (!jsonMode) {
      out.success(`Created tambo.ts at ${tamboTsPath}`);
    }
  } catch (error) {
    result.errors.push(
      `Failed to create tambo.ts: ${getSafeErrorMessage(error)}`,
    );
  }
}

export async function createAgentDocs(
  result: InitResult,
  prefix: string,
  jsonMode: boolean,
  isDryRun: boolean,
  skipAgentDocs: boolean,
): Promise<void> {
  if (skipAgentDocs) {
    return;
  }

  if (isDryRun) {
    result.warnings.push("Dry run: skipped installing skill");
    return;
  }

  try {
    await installSkill({ prefix });
    result.skillInstalled = true;
    if (!jsonMode) {
      out.success("Tambo skill installed");
    }
  } catch (error) {
    result.warnings.push(
      `Skill installation failed: ${getSafeErrorMessage(error)}`,
    );
  }
}

export function outputInitResults(result: InitResult, jsonMode: boolean): void {
  result.success = result.errors.length === 0;
  result.suggestedCommands = [
    {
      command: "tambov1 install message-thread-full",
      description: "Install a UI component",
    },
    {
      command: "npm run dev",
      description: "Start your development server",
    },
  ];

  if (jsonMode) {
    out.json(result);
    return;
  }

  out.fileChanges({
    created: result.filesCreated,
    modified: result.filesModified,
    deleted: [],
  });

  out.summary({
    operation: "tambov1 init",
    success: result.success,
    details: {
      projectName: result.projectName,
      tamboReactInstalled: result.tamboReactInstalled,
      authenticated: result.authenticated,
      apiKeyCreated: result.apiKeyCreated,
      envFile: result.envFile,
      tamboTsCreated: result.tamboTsCreated,
      skillInstalled: result.skillInstalled,
      warnings:
        result.warnings.length > 0 ? result.warnings.join("; ") : "none",
    },
    nextCommands: result.suggestedCommands,
  });
}

/**
 * Gets the installation path for components, prompting user if necessary
 * @param yes Whether to automatically answer yes to prompts
 * @returns The chosen installation path
 */
export async function getInstallationPath(yes = false): Promise<string> {
  const hasSrcDir = fs.existsSync("src");

  if (yes) {
    // Auto-answer yes - use src if available
    return "src/components";
  }

  // In non-interactive mode without --yes, fail fast with guidance
  if (!isTTY()) {
    throw new NonInteractiveError(
      "Component path required. Use --prefix <path> or --yes to use defaults.",
    );
  }

  try {
    const response = await inquirer.prompt<{ useSrcDir: boolean }>({
      type: "confirm",
      name: "useSrcDir",
      message: hasSrcDir
        ? "Would you like to use the existing src/ directory for components?"
        : "Would you like to create and use a src/ directory for components?",
      default: hasSrcDir,
    });

    return response.useSrcDir ? "src/components" : "components";
  } catch (error) {
    handlePromptError(error);
  }
}
