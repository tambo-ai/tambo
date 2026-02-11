import chalk from "chalk";
import fs from "fs";
import ora from "ora";
import path from "path";
import {
  execFileSync,
  execSync,
  GuidanceError,
  interactivePrompt,
  isInteractive,
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
  vite: {
    name: "vite",
    description: "Tambo + TanStack Router + Vite",
    repository: "https://github.com/tambo-ai/tambo-template-vite.git",
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
  skipGitInit?: boolean;
  skipTamboInit?: boolean;
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
  // In non-interactive mode, check if we have what we need
  if (!isInteractive() && !options.name) {
    throw new GuidanceError(
      "App name and template required in non-interactive mode",
      [
        "npx tambo create-app my-app --template=standard  # Recommended",
        "npx tambo create-app my-app --template=vite      # Vite + TanStack Router",
        "npx tambo create-app my-app --template=analytics # Analytics template",
        "npx tambo create-app . --template=standard       # Current directory",
      ],
    );
  }

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

    // Initialize new git repository by default (unless skipGitInit is true)
    // Support legacy initGit flag for backwards compatibility
    const shouldInitGit = options.skipGitInit ? false : true;
    let gitInitSucceeded = false;

    if (shouldInitGit) {
      const gitInitSpinner = ora({
        text: "Initializing git repository...",
        spinner: "dots",
      }).start();

      try {
        execSync("git init", { stdio: "ignore", allowNonInteractive: true });
        execSync("git add .", { stdio: "ignore", allowNonInteractive: true });
        execSync(
          `git commit -m "Initial commit from Tambo ${selectedTemplate.name} template"`,
          {
            stdio: "ignore",
            allowNonInteractive: true,
          },
        );
        gitInitSpinner.succeed("Git repository initialized successfully");
        gitInitSucceeded = true;
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

    // Run tambo init by default in interactive mode (unless skipTamboInit is true)
    // In non-interactive mode, skip it since tambo init requires user interaction
    let tamboInitSucceeded = false;
    const shouldRunTamboInit = !options.skipTamboInit && isInteractive();

    if (shouldRunTamboInit) {
      console.log(chalk.cyan("\nRunning tambo init to complete setup...\n"));

      try {
        // Run tambo init with --yes flag to auto-accept defaults and --skip-agent-docs to skip that step initially
        // This will still prompt for hosting choice, auth, and project selection
        execSync("npx tambo init --yes --skip-agent-docs", {
          stdio: "inherit", // Allow user interaction for auth prompts
          allowNonInteractive: true,
        });
        console.log(
          chalk.green("✓ Tambo initialization completed successfully\n"),
        );
        tamboInitSucceeded = true;
      } catch (_error) {
        console.error(chalk.red("✗ Failed to run tambo init\n"));
        console.warn(
          chalk.yellow(
            "Warning: Tambo initialization failed. You can run 'npx tambo init' manually to complete setup.\n",
          ),
        );
      }
    }

    console.log(chalk.green("\nSuccessfully created a new Tambo app"));
    console.log(
      chalk.cyan(
        `Template: ${selectedTemplate.name} - ${selectedTemplate.description}`,
      ),
    );

    // Show what was done automatically
    if (gitInitSucceeded || tamboInitSucceeded) {
      console.log(chalk.green("\n✓ Automatically completed:"));
      if (gitInitSucceeded) {
        console.log(chalk.gray("  • Git repository initialized"));
      }
      if (tamboInitSucceeded) {
        console.log(chalk.gray("  • Tambo initialization completed"));
      }
    }

    // Check if everything succeeded
    const allSetupComplete = gitInitSucceeded && tamboInitSucceeded;

    // Build remaining setup steps (excluding cd and npm run dev which are always needed)
    const setupSteps: string[] = [];

    if (!gitInitSucceeded && !options.skipGitInit) {
      setupSteps.push(
        `${chalk.cyan("git init")} ${chalk.gray("(failed, run manually)")}`,
      );
    }

    // Show tambo init as needed if:
    // - It didn't succeed AND
    // - Either user explicitly skipped it, OR it was auto-skipped due to non-interactive mode
    if (
      !tamboInitSucceeded &&
      (!shouldRunTamboInit || !options.skipTamboInit)
    ) {
      let reason: string;
      if (!isInteractive()) {
        reason = chalk.gray("(required for setup)");
      } else if (options.skipTamboInit) {
        reason = chalk.gray("(skipped, run to complete setup)");
      } else {
        reason = chalk.gray("(failed, run manually to complete setup)");
      }
      setupSteps.push(`${chalk.cyan("npx tambo init")} ${reason}`);
    }

    // Show appropriate message based on setup status
    if (allSetupComplete) {
      console.log(
        chalk.green("\n🎉 All setup complete! You're ready to go!\n"),
      );
      console.log("Next steps:");
      let stepNum = 1;
      if (appName !== ".") {
        console.log(`  ${stepNum}. ${chalk.cyan(`cd ${appName}`)}`);
        stepNum++;
      }
      console.log(`  ${stepNum}. ${chalk.cyan("npm run dev")}`);
    } else {
      // Some setup steps remain
      console.log("\nNext steps:");
      let stepNum = 1;
      if (appName !== ".") {
        console.log(`  ${stepNum}. ${chalk.cyan(`cd ${appName}`)}`);
        stepNum++;
      }
      setupSteps.forEach((step) => {
        console.log(`  ${stepNum}. ${step}`);
        stepNum++;
      });
      console.log(`  ${stepNum}. ${chalk.cyan("npm run dev")}`);
    }

    console.log("\nLearn More:");
    console.log(
      `  • Each component in your template comes with built-in documentation and examples`,
    );
    console.log(
      `  • Visit our UI showcase at ${chalk.cyan("https://ui.tambo.co")} to explore and learn about the components included in your template\n`,
    );
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
