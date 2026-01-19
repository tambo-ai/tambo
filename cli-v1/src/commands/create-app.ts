/**
 * Create-app command - Create a new Tambo app from template
 *
 * Interactive flow for humans, guidance JSON for agents when args are missing.
 */

import { execFileSync } from "child_process";
import { defineCommand } from "citty";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";

import { buildCreateAppGuidance } from "../utils/guidance.js";
import { getSafeErrorMessage } from "../utils/error-helpers.js";
import { out, type CommandSuggestion } from "../utils/output.js";
import {
  detectPackageManager,
  getInstallCommand,
  validatePackageManager,
} from "../utils/package-manager.js";
import { isTTY } from "../utils/tty.js";
import {
  handlePromptError,
  NonInteractiveError,
} from "../utils/interactive.js";

interface Template {
  name: string;
  description: string;
  repository: string;
}

const templates: Record<string, Template> = {
  standard: {
    name: "standard",
    description: "Tambo + Tools + MCP (recommended)",
    repository: "https://github.com/tambo-ai/tambo-template.git",
  },
  analytics: {
    name: "analytics",
    description: "Generative UI Analytics Template",
    repository: "https://github.com/tambo-ai/analytics-template.git",
  },
};

interface CreateAppResult {
  success: boolean;
  appName: string;
  targetDir: string;
  template: string;
  depsInstalled: boolean;
  gitInitialized: boolean;
  errors: string[];
  warnings: string[];
  filesCreated: string[];
  suggestedCommands: CommandSuggestion[];
}

function isValidAppName(name: string): boolean {
  // Reject leading dash to prevent flag injection in shell commands
  if (name.startsWith("-")) return false;
  return name === "." || /^[a-zA-Z0-9-_]+$/.test(name);
}

function updatePackageJson(targetDir: string, appName: string): void {
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!fs.existsSync(packageJsonPath)) return;

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8"),
    ) as Record<string, unknown>;
    packageJson.name = appName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch {
    throw new Error("Failed to update package.json name");
  }
}

function safeRemoveGitFolder(gitFolder: string): void {
  if (!gitFolder.endsWith(".git") || /[;&|<>$\r\n\t\v\f]/.test(gitFolder)) {
    throw new Error("Invalid git folder path");
  }

  if (!fs.existsSync(gitFolder)) return;

  try {
    fs.rmSync(gitFolder, { recursive: true, force: true });
  } catch (error) {
    throw new Error(
      `Failed to remove .git folder: ${getSafeErrorMessage(error)}`,
    );
  }
}

// ============================================================================
// CREATE-APP RUN HELPERS - Break up the main run function for readability
// ============================================================================

function createAppResult(): CreateAppResult {
  return {
    success: false,
    appName: "",
    targetDir: "",
    template: "",
    depsInstalled: false,
    gitInitialized: false,
    errors: [],
    warnings: [],
    filesCreated: [],
    suggestedCommands: [],
  };
}

async function promptForAppName(
  providedName: string | undefined,
  isInteractive: boolean,
): Promise<string> {
  if (providedName) {
    return providedName;
  }

  if (!isInteractive) {
    throw new NonInteractiveError(
      "App name required. Use --name <app-name> to specify the app name.",
    );
  }

  try {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "appName",
        message: "App name:",
        default: "my-tambo-app",
        validate: (input: string) =>
          isValidAppName(input)
            ? true
            : "App name can only contain letters, numbers, dashes, underscores, or '.'",
      },
    ]);
    return response.appName;
  } catch (error) {
    handlePromptError(error);
  }
}

async function promptForTemplate(
  providedTemplate: string | undefined,
  isInteractive: boolean,
): Promise<string> {
  if (providedTemplate) {
    return providedTemplate;
  }

  if (!isInteractive) {
    throw new NonInteractiveError(
      "Template required. Use --template <name> to specify. Available: " +
        Object.keys(templates).join(", "),
    );
  }

  try {
    const response = await inquirer.prompt([
      {
        type: "select",
        name: "templateKey",
        message: "Select a template:",
        choices: Object.values(templates).map((template) => ({
          name: `${template.name} - ${template.description}`,
          value: template.name,
        })),
        default: "standard",
      },
    ]);
    return response.templateKey;
  } catch (error) {
    handlePromptError(error);
  }
}

function resolveInstallDepsFlag(
  args: { "install-deps"?: boolean; "no-install-deps"?: boolean },
  isInteractive: boolean,
): boolean | undefined {
  if (args["no-install-deps"]) {
    return false;
  }
  if (args["install-deps"] !== undefined) {
    return args["install-deps"];
  }
  return isInteractive ? undefined : true;
}

function resolveInitGitFlag(
  args: { "init-git"?: boolean },
  isInteractive: boolean,
): boolean | undefined {
  if (args["init-git"] !== undefined) {
    return args["init-git"];
  }
  return isInteractive ? undefined : false;
}

function validateTargetDirectory(
  appName: string,
  targetDir: string,
  result: CreateAppResult,
): boolean {
  if (
    appName === "." &&
    fs.existsSync(targetDir) &&
    fs.readdirSync(targetDir).length > 0
  ) {
    result.errors.push("Current directory is not empty");
    return false;
  }

  if (appName !== "." && fs.existsSync(targetDir)) {
    result.errors.push(`Directory "${appName}" already exists`);
    return false;
  }

  return true;
}

function cloneTemplate(
  template: Template,
  appName: string,
  targetDir: string,
  jsonMode: boolean,
  isInteractive: boolean,
): void {
  if (appName !== ".") {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cloneSpinner =
    jsonMode || !isInteractive
      ? null
      : ora(`Downloading ${template.name} template...`).start();

  try {
    // Use execFileSync with argument array to prevent shell injection
    const cloneTarget = appName === "." ? "." : appName;
    execFileSync(
      "git",
      ["clone", "--depth", "1", template.repository, cloneTarget],
      {
        stdio: "ignore",
      },
    );
    cloneSpinner?.succeed(`Downloaded ${template.name} template`);
  } catch (error) {
    cloneSpinner?.fail("Failed to download template");
    throw new Error(`Failed to clone template: ${getSafeErrorMessage(error)}`);
  }

  const gitFolder = path.join(targetDir, ".git");
  safeRemoveGitFolder(gitFolder);

  const packageJsonName =
    appName !== "." ? appName : path.basename(process.cwd());
  updatePackageJson(targetDir, packageJsonName);
}

function initializeGitRepo(
  template: Template,
  result: CreateAppResult,
  jsonMode: boolean,
  isInteractive: boolean,
): void {
  const gitSpinner =
    jsonMode || !isInteractive
      ? null
      : ora("Initializing git repository...").start();

  try {
    // Use execFileSync with argument arrays to prevent shell injection
    execFileSync("git", ["init"], { stdio: "ignore" });
    execFileSync("git", ["add", "."], { stdio: "ignore" });
    const commitMessage = `Initial commit from Tambo ${template.name} template`;
    execFileSync("git", ["commit", "-m", commitMessage], { stdio: "ignore" });
    gitSpinner?.succeed("Git repository initialized");
    result.gitInitialized = true;
  } catch (error) {
    gitSpinner?.fail("Failed to initialize git repository");
    result.warnings.push(
      `Git initialization failed: ${getSafeErrorMessage(error)}`,
    );
  }
}

function installDependencies(
  targetDir: string,
  result: CreateAppResult,
  jsonMode: boolean,
  isInteractive: boolean,
): void {
  const pm = detectPackageManager(targetDir);
  validatePackageManager(pm);
  const installCmd = getInstallCommand(pm);

  const installSpinner =
    jsonMode || !isInteractive
      ? null
      : ora(`Installing dependencies using ${pm}...`).start();

  try {
    execFileSync(pm, [installCmd], { stdio: "ignore" });
    installSpinner?.succeed("Dependencies installed");
    result.depsInstalled = true;
  } catch (error) {
    installSpinner?.fail("Failed to install dependencies");
    throw new Error(
      `Failed to install dependencies: ${getSafeErrorMessage(error)}`,
    );
  }
}

function buildSuggestedCommands(
  appName: string,
  depsInstalled: boolean,
): CommandSuggestion[] {
  const commands: CommandSuggestion[] = [];

  if (appName !== ".") {
    commands.push({
      command: `cd ${appName}`,
      description: "Navigate to your new app",
    });
  }
  if (!depsInstalled) {
    commands.push({
      command: "npm install",
      description: "Install dependencies",
    });
  }
  commands.push({
    command: "tambov1 init",
    description: "Complete Tambo setup",
  });
  commands.push({
    command: "npm run dev",
    description: "Start development server",
  });

  return commands;
}

function outputCreateAppResults(
  result: CreateAppResult,
  jsonMode: boolean,
): void {
  if (jsonMode) {
    out.json(result);
    return;
  }

  out.success(`Created ${result.appName} successfully!`);
  out.fileChanges({
    created: result.filesCreated,
    modified: [],
    deleted: [],
  });
  out.nextCommands(result.suggestedCommands);
}

// ============================================================================
// TEMPLATES SUBCOMMAND
// ============================================================================

const templatesCommand = defineCommand({
  meta: {
    name: "templates",
    description: "List available templates",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const templateList = Object.values(templates).map((template) => ({
      name: template.name,
      description: template.description,
    }));

    if (args.json) {
      out.json({ success: true, templates: templateList });
      return;
    }

    out.header("AVAILABLE TEMPLATES");
    templateList.forEach((template) => {
      out.keyValue(template.name, template.description);
    });
  },
});

export const createApp = defineCommand({
  meta: {
    name: "create-app",
    description: "Create a new Tambo app from a template",
  },
  args: {
    name: {
      type: "string",
      description: "App name (default: my-tambo-app)",
      required: false,
    },
    template: {
      type: "string",
      description: "Template to use (standard, analytics)",
      required: false,
    },
    "install-deps": {
      type: "boolean",
      description: "Install dependencies (default: true)",
      required: false,
    },
    "no-install-deps": {
      type: "boolean",
      description: "Skip dependency installation",
      required: false,
    },
    "init-git": {
      type: "boolean",
      description: "Initialize git repository",
      required: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Show what would happen without making changes",
      default: false,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    // Skip parent run when a subcommand is being executed
    // citty calls parent run even when subcommand matches
    const rawArgs = process.argv.slice(2);
    const createAppIndex = rawArgs.indexOf("create-app");
    if (createAppIndex !== -1 && rawArgs[createAppIndex + 1] === "templates") {
      return;
    }

    const result = createAppResult();
    const jsonMode = args.json;
    const isInteractive = isTTY();

    // Step 1: Get app name (prompt if interactive, fail fast if not)
    let appName: string;
    let templateKey: string;

    try {
      appName = await promptForAppName(args.name, isInteractive);
      templateKey = await promptForTemplate(args.template, isInteractive);
    } catch (error) {
      if (error instanceof NonInteractiveError) {
        const guidance = buildCreateAppGuidance();
        if (jsonMode) {
          out.json({
            success: false,
            reason: "interactive_required",
            message: error.message,
            guidance,
          });
        } else {
          out.error(error.message);
          out.info(
            "Run with --name and --template flags, or in an interactive terminal.",
          );
        }
        process.exit(1);
      }
      throw error;
    }

    if (!isValidAppName(appName)) {
      result.errors.push("Invalid app name");
      out.json(result);
      process.exit(1);
    }

    const template = templates[templateKey];
    if (!template) {
      result.errors.push(
        `Template "${templateKey}" not found. Available: ${Object.keys(templates).join(", ")}`,
      );
      out.json(result);
      process.exit(1);
    }

    const targetDir =
      appName === "." ? process.cwd() : path.join(process.cwd(), appName);

    // Display header
    if (!jsonMode) {
      out.header("CREATE NEW TAMBO APP");
      out.keyValue("App name", appName);
      out.keyValue("Template", template.name);
    }

    // Validate target directory
    if (!validateTargetDirectory(appName, targetDir, result)) {
      out.json(result);
      process.exit(1);
    }

    // Set result properties
    result.appName = appName;
    result.targetDir = targetDir;
    result.template = template.name;

    // Resolve flags from args or interactive prompts
    let installDeps = resolveInstallDepsFlag(args, isInteractive);
    let initGit = resolveInitGitFlag(args, isInteractive);

    // Prompt for remaining options if interactive
    if (isInteractive && installDeps === undefined) {
      try {
        const response = await inquirer.prompt([
          {
            type: "confirm",
            name: "installDeps",
            message: "Install dependencies?",
            default: true,
          },
        ]);
        installDeps = response.installDeps;
      } catch (error) {
        handlePromptError(error);
      }
    }

    if (isInteractive && initGit === undefined) {
      try {
        const response = await inquirer.prompt([
          {
            type: "confirm",
            name: "initGit",
            message: "Initialize git repository?",
            default: false,
          },
        ]);
        initGit = response.initGit;
      } catch (error) {
        handlePromptError(error);
      }
    }

    const shouldInstallDeps = installDeps ?? true;
    const shouldInitGit = initGit ?? false;

    // Handle dry run
    if (args["dry-run"]) {
      result.warnings.push("Dry run: no files were created");
      result.success = true;
      out.json(result);
      return;
    }

    // Execute the actual creation
    try {
      cloneTemplate(template, appName, targetDir, jsonMode, isInteractive);
      process.chdir(targetDir);

      if (shouldInitGit) {
        initializeGitRepo(template, result, jsonMode, isInteractive);
      }

      if (shouldInstallDeps) {
        installDependencies(targetDir, result, jsonMode, isInteractive);
      }

      // Set success state
      result.success = true;
      result.suggestedCommands = buildSuggestedCommands(
        appName,
        result.depsInstalled,
      );
      result.filesCreated = [
        targetDir,
        path.join(targetDir, "package.json"),
        path.join(targetDir, "src"),
      ];

      outputCreateAppResults(result, jsonMode);
    } catch (error) {
      result.errors.push(getSafeErrorMessage(error));
      out.json(result);
      process.exit(1);
    }
  },
  subCommands: {
    templates: templatesCommand,
  },
});
