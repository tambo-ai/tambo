import chalk from "chalk";
import fs from "fs";
import ora from "ora";
import path from "path";
import {
  execFileSync,
  execSync,
  interactivePrompt,
} from "../utils/interactive.js";
import {
  detectPackageManager,
  getInstallCommand,
  validatePackageManager,
} from "../utils/package-manager.js";

// Define available templates
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

interface CreateAppOptions {
  legacyPeerDeps?: boolean;
  initGit?: boolean;
  template?: string;
  name?: string;
}

function safeRemoveGitFolder(gitFolder: string): void {
  // Validate that the folder ends with '.git' and does not contain shell metacharacters
  if (!gitFolder.endsWith(".git") || /[;&|<>$\r\n\t\v\f]/.test(gitFolder)) {
    console.error(chalk.red("Invalid git folder path"));
    return;
  }
  try {
    if (process.platform === "win32") {
      // Windows: First remove read-only attributes, then remove directory
      try {
        execSync(`attrib -r "${gitFolder}\\*.*" /s`, { stdio: "ignore" });
      } catch (_e) {
        console.error(chalk.red("Failed to remove read-only attributes"));
      }
      try {
        execSync(`rmdir /s /q "${gitFolder}"`, { stdio: "ignore" });
      } catch (_e) {
        fs.rmSync(gitFolder, { recursive: true, force: true });
      }
    } else {
      // Unix-like systems (Mac, Linux)
      try {
        execSync(`rm -rf "${gitFolder}"`, { stdio: "ignore" });
      } catch (_e) {
        fs.rmSync(gitFolder, { recursive: true, force: true });
      }
    }
  } catch (_error) {
    // If all removal attempts fail, warn but continue
    console.warn(
      chalk.yellow(
        "\nWarning: Could not completely remove .git folder. You may want to remove it manually.",
      ),
    );
  }
}

function updatePackageJson(targetDir: string, appName: string): void {
  const packageJsonPath = path.join(targetDir, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      packageJson.name = appName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (_error) {
      console.warn(
        chalk.yellow(
          "\nWarning: Could not update package.json name. You may want to update it manually.",
        ),
      );
    }
  }
}

export async function handleCreateApp(
  options: CreateAppOptions = {},
): Promise<void> {
  console.log("");

  let appName: string;

  // If name is provided in options, use it directly after validation
  if (options.name) {
    if (options.name === "." || /^[a-zA-Z0-9-_]+$/.test(options.name)) {
      appName = options.name;
    } else {
      throw new Error(
        'App name can only contain letters, numbers, dashes, and underscores, or "." for current directory',
      );
    }
  } else {
    // Only prompt if name wasn't provided
    const response = await interactivePrompt<{ appName: string }>(
      {
        type: "input",
        name: "appName",
        message:
          'What is the name of your app? (use "." to create in current directory)',
        default: "my-tambo-app",
        validate: (input: string) => {
          if (input === "." || /^[a-zA-Z0-9-_]+$/.test(input)) {
            return true;
          }
          return 'App name can only contain letters, numbers, dashes, and underscores, or "." for current directory';
        },
      },
      chalk.yellow(
        "Cannot prompt for app name in non-interactive mode. Provide app name as argument: tambo create-app <name>",
      ),
    );
    appName = response.appName;
  }

  const targetDir =
    appName === "." ? process.cwd() : path.join(process.cwd(), appName);

  console.log(
    chalk.blue(`\nCreating a new Tambo app in ${chalk.cyan(targetDir)}`),
  );

  try {
    // Template selection logic
    let selectedTemplate: Template;
    if (options.template) {
      // Check if specified template exists
      if (!templates[options.template]) {
        console.error(chalk.red(`\nTemplate "${options.template}" not found.`));
        console.log(chalk.yellow("Available templates:"));
        Object.entries(templates).forEach(([key, template]) => {
          console.log(`  ${chalk.cyan(key)}: ${template.description}`);
        });
        throw new Error("Invalid template specified.");
      }
      selectedTemplate = templates[options.template];
      console.log(
        chalk.blue(`Using template: ${chalk.cyan(selectedTemplate.name)}`),
      );
    } else {
      // Interactive template selection
      const { templateKey } = await interactivePrompt<{ templateKey: string }>(
        {
          type: "select",
          name: "templateKey",
          message: "Select a template for your new app:",
          choices: Object.entries(templates).map(([key, template]) => ({
            name: `${template.name} - ${template.description}`,
            value: key,
          })),
          default: "standard",
        },
        chalk.yellow(
          "Cannot prompt for template in non-interactive mode. Use --template flag to specify template (e.g., --template=standard).",
        ),
      );
      selectedTemplate = templates[templateKey];
      console.log(
        chalk.blue(`Selected template: ${chalk.cyan(selectedTemplate.name)}`),
      );
    }

    // Check if directory is empty when using "."
    if (
      appName === "." &&
      fs.existsSync(targetDir) &&
      fs.readdirSync(targetDir).length > 0
    ) {
      throw new Error(
        "Current directory is not empty. Please use an empty directory or specify a new app name.",
      );
    }

    // Create directory if it doesn't exist and appName is not "."
    if (appName !== ".") {
      if (fs.existsSync(targetDir)) {
        throw new Error(
          `Directory "${appName}" already exists. Please choose a different name or use an empty directory.`,
        );
      }
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Clone the template repository
    const cloneSpinner = ora({
      text: `Downloading ${selectedTemplate.name} template...`,
      spinner: "dots",
    }).start();

    try {
      execSync(
        `git clone --depth 1 ${selectedTemplate.repository} ${
          appName === "." ? "." : appName
        }`,
        { stdio: "ignore", allowNonInteractive: true },
      );
      cloneSpinner.succeed(
        `${selectedTemplate.name} template downloaded successfully`,
      );
    } catch (_error) {
      cloneSpinner.fail(`Failed to download ${selectedTemplate.name} template`);
      throw new Error(
        "Failed to clone template repository. Please check your internet connection and try again.",
      );
    }

    // Remove .git folder to start fresh
    const gitFolder = path.join(targetDir, ".git");
    if (fs.existsSync(gitFolder)) {
      // Ensure this is actually a .git folder and not some other path
      const isGitFolder =
        fs.statSync(gitFolder).isDirectory() &&
        fs.existsSync(path.join(gitFolder, "HEAD"));
      if (isGitFolder) {
        safeRemoveGitFolder(gitFolder);
      } else {
        console.warn(chalk.yellow("Expected .git folder not found or invalid"));
      }
    }

    // Update package.json name
    if (appName !== ".") {
      updatePackageJson(targetDir, appName);
    } else {
      // use the current directory name as the app name
      updatePackageJson(targetDir, path.basename(process.cwd()));
    }

    // Change to target directory before git init and npm install
    process.chdir(targetDir);

    // Initialize new git repository if requested
    if (options.initGit) {
      const gitInitSpinner = ora({
        text: "Initializing git repository...",
        spinner: "dots",
      }).start();

      try {
        execSync("git init", { stdio: "ignore" });
        execSync("git add .", { stdio: "ignore" });
        execSync(
          `git commit -m "Initial commit from Tambo ${selectedTemplate.name} template"`,
          {
            stdio: "ignore",
          },
        );
        gitInitSpinner.succeed("Git repository initialized successfully");
      } catch (_error) {
        gitInitSpinner.fail("Failed to initialize git repository");
        console.warn(
          chalk.yellow(
            "\nWarning: Git initialization failed. You can initialize it manually later with 'git init'.",
          ),
        );
      }
    }

    // Install dependencies with spinner
    // Detect package manager from the target directory (which is now cwd after chdir above)
    const pm = detectPackageManager(targetDir);
    validatePackageManager(pm);
    const installCmd = getInstallCommand(pm);
    // --legacy-peer-deps is npm-specific
    const legacyPeerDepsFlag =
      options.legacyPeerDeps && pm === "npm" ? ["--legacy-peer-deps"] : [];

    const installSpinner = ora({
      text: `Installing dependencies using ${pm}...`,
      spinner: "dots",
    }).start();

    try {
      const args = [...installCmd, ...legacyPeerDepsFlag];
      execFileSync(pm, args, { stdio: "ignore", allowNonInteractive: true });
      installSpinner.succeed("Dependencies installed successfully");
    } catch (_error) {
      installSpinner.fail("Failed to install dependencies");
      throw new Error(
        `Failed to install dependencies. Please try running '${pm} ${installCmd.join(" ")}' manually.`,
      );
    }

    console.log(chalk.green("\nSuccessfully created a new Tambo app"));
    console.log(
      chalk.cyan(
        `Template: ${selectedTemplate.name} - ${selectedTemplate.description}`,
      ),
    );
    console.log("\nNext steps:");
    let step = 1;
    if (appName !== ".") {
      console.log(
        `  ${step}. ${chalk.cyan(`cd ${appName === "." ? "." : appName}`)}`,
      );
      step++;
    }
    if (!options.initGit) {
      console.log(`  ${step}. ${chalk.cyan("git init")}`);
      step++;
    }
    console.log(`  ${step}. ${chalk.cyan("npx tambo init")} to complete setup`);
    step++;
    console.log(`  ${step}. ${chalk.cyan("npm run dev")}`);
    console.log("\nLearn More:");
    console.log(
      `  • Each component in your template comes with built-in documentation and examples`,
    );
    console.log(
      `  • Visit our UI showcase at ${chalk.cyan("https://ui.tambo.co")} to explore and learn about the components included in your template\n`,
    );
    step++;
  } catch (error) {
    console.error(
      chalk.red("\nError creating app:"),
      error instanceof Error ? error.message : String(error),
    );
    // Clean up on failure if we created a new directory
    if (appName !== "." && fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (_e) {
        console.error(
          chalk.yellow(
            `\nFailed to clean up directory "${targetDir}". You may want to remove it manually.`,
          ),
        );
      }
    }
    process.exit(1);
  }
}
