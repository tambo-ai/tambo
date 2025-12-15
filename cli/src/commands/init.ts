import chalk from "chalk";
import clipboard from "clipboardy";
import fs from "fs";
import open from "open";
import ora from "ora";
import path from "path";
import { COMPONENT_SUBDIR } from "../constants/paths.js";
import { tamboTsTemplate } from "../templates/tambo-template.js";
import {
  interactivePrompt,
  NonInteractiveError,
} from "../utils/interactive.js";
import { handleAddComponent } from "./add/index.js";
import { handleAgentDocsUpdate } from "./shared/agent-docs.js";
import { getLibDirectory } from "./shared/path-utils.js";

/**
 * Creates a tambo.ts file with empty registry of tools and components
 * @param installPath The base installation path
 */
async function createTamboTsFile(installPath: string): Promise<void> {
  const projectRoot = process.cwd();
  // Derive lib directory consistently with other commands
  const libDir = getLibDirectory(projectRoot, installPath, false);
  fs.mkdirSync(libDir, { recursive: true });

  const tamboTsPath = path.join(libDir, "tambo.ts");

  if (!fs.existsSync(tamboTsPath)) {
    fs.writeFileSync(tamboTsPath, tamboTsTemplate);
    console.log(
      chalk.green(
        "\n✅ Created tambo.ts file with empty tool registry and components array",
      ),
    );
  } else {
    console.log(chalk.gray("\n📝 tambo.ts file already exists"));
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

interface InitOptions {
  fullSend?: boolean;
  legacyPeerDeps?: boolean;
  yes?: boolean;
  skipAgentDocs?: boolean;
}

/**
 * Writes the provided API key to .env.local, creating the file if necessary
 * Handles overwrite confirmation when a key already exists
 */
async function writeApiKeyToEnv(apiKey: string): Promise<boolean> {
  try {
    // use `.env.local` by default or fall back to .env if it exists and .env.local does not
    let targetEnvFile = ".env.local";
    if (fs.existsSync(".env") && !fs.existsSync(".env.local")) {
      targetEnvFile = ".env";
    }

    const envContent = `\nNEXT_PUBLIC_TAMBO_API_KEY=${apiKey.trim()}\n`;

    if (!fs.existsSync(targetEnvFile)) {
      fs.writeFileSync(targetEnvFile, "# Environment Variables\n");
      console.log(chalk.green(`\n✔ Created new ${targetEnvFile} file`));
      fs.appendFileSync(targetEnvFile, envContent);
      console.log(chalk.green(`\n✔ API key saved to ${targetEnvFile}`));
      console.log(
        chalk.gray(
          "\nNote: If you're not using Next.js, remove 'NEXT_PUBLIC_' from the variable name in your env file",
        ),
      );
      return true;
    }

    const existingContent = fs.readFileSync(targetEnvFile, "utf8");
    const keyRegex = /^NEXT_PUBLIC_TAMBO_API_KEY=.*/gm;

    if (keyRegex.test(existingContent)) {
      const { confirmReplace } = await interactivePrompt<{
        confirmReplace: boolean;
      }>(
        {
          type: "confirm",
          name: "confirmReplace",
          message: chalk.yellow(
            `⚠️  This will overwrite the existing value of NEXT_PUBLIC_TAMBO_API_KEY in ${targetEnvFile}, are you sure?`,
          ),
          default: false,
        },
        chalk.yellow(
          "Cannot prompt for API key confirmation in non-interactive mode. Please set NEXT_PUBLIC_TAMBO_API_KEY manually.",
        ),
      );

      if (!confirmReplace) {
        console.log(chalk.gray("\nKeeping existing API key."));
        return true;
      }

      const updatedContent = existingContent.replace(
        keyRegex,
        `NEXT_PUBLIC_TAMBO_API_KEY=${apiKey.trim()}`,
      );
      fs.writeFileSync(targetEnvFile, updatedContent);
      console.log(
        chalk.green(`\n✔ Updated existing API key in ${targetEnvFile}`),
      );
      console.log(
        chalk.gray(
          "\nNote: If you're not using Next.js, remove 'NEXT_PUBLIC_' from the variable name in your env file",
        ),
      );
      return true;
    }

    fs.appendFileSync(targetEnvFile, envContent);
    console.log(chalk.green(`\n✔ API key saved to ${targetEnvFile}`));
    console.log(
      chalk.gray(
        "\nNote: If you're not using Next.js, remove 'NEXT_PUBLIC_' from the variable name in your env file",
      ),
    );
    return true;
  } catch (error) {
    console.error(chalk.red(`\nFailed to save API key: ${error}`));
    return false;
  }
}

/**
 * Displays instructions for self-hosting the Tambo API and dashboard
 */
function displaySelfHostInstructions(): void {
  console.log(chalk.cyan("\nStep 1: Self-host setup (time: 5-10 minutes)\n"));
  console.log(
    chalk.gray(
      "You can run the open-source Tambo Cloud API locally or self-host it.",
    ),
  );
  console.log(
    chalk.gray("Repo:"),
    chalk.cyan("https://github.com/tambo-ai/tambo"),
  );

  console.log(chalk.bold("\nQuick start with Docker:"));
  console.log(chalk.gray("  1. Clone the repo"));
  console.log(chalk.gray("  2. Run:"));
  console.log(chalk.gray("     ./scripts/cloud/tambo-setup.sh"));
  console.log(chalk.gray("     ./scripts/cloud/tambo-start.sh"));
  console.log(chalk.gray("     ./scripts/cloud/init-database.sh"));
  console.log(
    chalk.gray(
      "  3. Open http://localhost:3000, create a project, then generate an API key",
    ),
  );

  console.log(chalk.bold("\nManual dev setup:"));
  console.log(
    chalk.gray("  1. Create .env files (see repo .env.example files)"),
  );
  console.log(
    chalk.gray("  2. Start Postgres via ./scripts/cloud/tambo-start.sh"),
  );
  console.log(
    chalk.gray("  3. Initialize DB via ./scripts/cloud/init-database.sh"),
  );
  console.log(chalk.gray("  4. npm run dev (web + api)\n"));
}

/**
 * Checks for existing API key in .env files
 * @returns string | null Returns existing API key if found, null otherwise
 */
async function checkExistingApiKey(): Promise<string | null> {
  const envFiles = [".env.local", ".env"];

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      const match = /^NEXT_PUBLIC_TAMBO_API_KEY=(.+)$/m.exec(content);
      if (match?.[1]) {
        const { overwriteExisting } = await interactivePrompt<{
          overwriteExisting: boolean;
        }>(
          {
            type: "confirm",
            name: "overwriteExisting",
            message: chalk.yellow(
              `⚠️  Would you like to overwrite the value of NEXT_PUBLIC_TAMBO_API_KEY in your .env file?`,
            ),
            default: true,
          },
          chalk.yellow(
            "Cannot prompt for API key overwrite in non-interactive mode. Keeping existing key.",
          ),
        );

        if (!overwriteExisting) {
          return match[1].trim();
        }
      }
    }
  }
  return null;
}

/**
 * Gets user preference for component installation directory
 * @param yes Whether to automatically answer yes to prompts
 * @returns string The chosen installation path
 */
export async function getInstallationPath(yes = false): Promise<string> {
  const hasSrcDir = fs.existsSync("src");

  if (hasSrcDir) {
    console.log(
      chalk.gray(`\nFound existing ${chalk.cyan("src/")} directory\n`),
    );
  } else {
    console.log(chalk.gray(`\nNo ${chalk.cyan("src/")} directory found\n`));
  }

  if (yes) {
    // Auto-answer yes - use src if available, otherwise create it
    const useSrcDir = hasSrcDir;
    if (!hasSrcDir) {
      console.log(
        chalk.blue(
          `\nℹ Auto-creating ${chalk.cyan("src/")} directory for components`,
        ),
      );
    } else {
      console.log(
        chalk.blue(
          `\nℹ Using existing ${chalk.cyan("src/")} directory for components`,
        ),
      );
    }
    return useSrcDir ? "src/components" : "src/components";
  }

  const { useSrcDir } = await interactivePrompt<{ useSrcDir: boolean }>(
    {
      type: "confirm",
      name: "useSrcDir",
      message: hasSrcDir
        ? `Would you like to use the existing ${chalk.cyan(
            "src/",
          )} directory for components?`
        : `Would you like to create and use a ${chalk.cyan(
            "src/",
          )} directory for components?`,
      default: hasSrcDir,
    },
    chalk.yellow("Use --yes flag to auto-select default component directory."),
  );

  return useSrcDir ? "src/components" : "components";
}

/**
 * Handles the authentication flow with Tambo
 * @returns Promise<boolean> Returns true if authentication was successful
 * @throws AuthenticationError
 */
async function handleAuthentication(): Promise<boolean> {
  try {
    // 1. Browser-based auth flow
    console.log(chalk.cyan("\nStep 1: Authentication"));

    // Check for existing API key first
    const existingKey = await checkExistingApiKey();
    if (existingKey) {
      console.log(chalk.green("\n✔ Using existing API key"));
      return true;
    }

    // Continue with browser-based auth flow
    const authUrl = `https://tambo.co/login?returnUrl=%2Fcli-auth`;
    console.log(chalk.gray("\nOpening browser for authentication..."));

    try {
      await open(authUrl);
    } catch (error) {
      throw new AuthenticationError(
        "Failed to open browser for authentication. Please visit https://tambo.co/cli-auth manually. Error: " +
          error,
      );
    }

    // 2. Get API key from user
    const { apiKey } = await interactivePrompt<{ apiKey: string }>(
      {
        type: "password",
        name: "apiKey",
        mask: "*",
        message: "Please paste your API key from the browser:",
        validate: (input: string) => {
          if (!input?.trim()) return "API key is required";
          return true;
        },
      },
      chalk.yellow(
        "Cannot prompt for API key in non-interactive mode. Please set NEXT_PUBLIC_TAMBO_API_KEY in .env file manually.",
      ),
    );

    // 3. Save API key to .env file
    const saved = await writeApiKeyToEnv(apiKey);
    return saved;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error(chalk.red(`Authentication error: ${error.message}`));
    } else {
      console.error(chalk.red(`Failed to save API key: ${error}`));
    }
    return false;
  }
}

/**
 * Guides the user through choosing hosting mode and finishing auth/setup
 */
async function handleHostingChoiceAndAuth(): Promise<boolean> {
  const { hostingChoice } = await interactivePrompt<{
    hostingChoice: string;
  }>(
    {
      type: "list",
      name: "hostingChoice",
      message: "Choose where to connect your app:",
      choices: [
        { name: "Cloud (time: 1 minute) — recommended", value: "cloud" },
        { name: "Self-host (time: 5-10 minutes)", value: "self" },
      ],
      default: "cloud",
    },
    chalk.yellow(
      "Cannot prompt for hosting choice in non-interactive mode. Please set NEXT_PUBLIC_TAMBO_API_KEY in .env file manually.",
    ),
  );

  if (hostingChoice === "cloud") {
    console.log(chalk.blue("\nInitializing tambo Cloud connection..."));
    return await handleAuthentication();
  }

  // Self-host path
  displaySelfHostInstructions();

  // Option to open repo in browser
  const { openRepo } = await interactivePrompt<{ openRepo: boolean }>(
    {
      type: "confirm",
      name: "openRepo",
      message: "Open the self-host repo instructions in your browser?",
      default: true,
    },
    chalk.yellow(
      "Cannot prompt to open browser in non-interactive mode. Visit https://github.com/tambo-ai/tambo-cloud manually.",
    ),
  );
  if (openRepo) {
    try {
      await open(
        "https://github.com/tambo-ai/tambo/blob/main/README.md#getting-started",
      );
    } catch (_e) {
      // non-fatal
    }
  }

  // If an API key already exists, allow keeping it
  const existingKey = await checkExistingApiKey();
  if (existingKey) {
    console.log(chalk.green("\n✔ Found existing API key. Using it."));
    return true;
  }

  console.log(chalk.cyan("\nStep 2: Provide your API key\n"));
  const { apiKeyOrCloud } = await interactivePrompt<{ apiKeyOrCloud: string }>(
    {
      type: "list",
      name: "apiKeyOrCloud",
      message: "How would you like to proceed?",
      choices: [
        { name: "Paste API key (default)", value: "paste" },
        { name: "Use Cloud instead (takes < 1 minute)", value: "cloud" },
      ],
      default: "paste",
    },
    chalk.yellow(
      "Cannot prompt for API key method in non-interactive mode. Please set NEXT_PUBLIC_TAMBO_API_KEY in .env file manually.",
    ),
  );

  if (apiKeyOrCloud === "cloud") {
    console.log(chalk.blue("\nSwitching to Cloud setup..."));
    return await handleAuthentication();
  }

  const { apiKey } = await interactivePrompt<{ apiKey: string }>(
    {
      type: "password",
      name: "apiKey",
      mask: "*",
      message: "Paste your self-hosted Tambo API key:",
      validate: (input: string) => {
        if (!input?.trim()) return "API key is required";
        return true;
      },
    },
    chalk.yellow(
      "Cannot prompt for API key in non-interactive mode. Please set NEXT_PUBLIC_TAMBO_API_KEY in .env file manually.",
    ),
  );

  return await writeApiKeyToEnv(apiKey);
}

/**
 * Handles the full-send initialization process
 * Installs all required components and sets up the project
 */
async function handleFullSendInit(options: InitOptions): Promise<void> {
  if (!validateRootPackageJson()) return;

  console.log(
    chalk.blue(
      "\n🚀 Initializing tambo with full-send mode. Let's get you set up!\n",
    ),
  );

  // Get installation path preference first
  const installPath = await getInstallationPath(options.yes);

  const authSuccess = await handleHostingChoiceAndAuth();
  if (!authSuccess) return;

  // Create tambo.ts file
  await createTamboTsFile(installPath);
  await handleAgentDocsUpdate({
    yes: options.yes,
    skipAgentDocs: options.skipAgentDocs,
    prefix: installPath,
  });

  // Install required components
  console.log(chalk.cyan("\nStep 2: Choose starter components to install"));

  // Add helpful message with showcase link
  console.log(
    chalk.gray(
      `💡 Not sure which component to choose? See them in action at: ${chalk.cyan("https://ui.tambo.co")}\n`,
    ),
  );

  const availableComponents = [
    {
      name: "message-thread-full",
      description:
        "Full-screen chat interface with history and typing indicators",
    },
    {
      name: "message-thread-panel",
      description: "Split-view chat with integrated workspace",
    },
    {
      name: "message-thread-collapsible",
      description: "Collapsible chat for sidebars",
    },
    {
      name: "control-bar",
      description: "Spotlight-style command palette",
    },
  ];

  const { selectedComponents } = await interactivePrompt<{
    selectedComponents: string[];
  }>(
    {
      type: "checkbox",
      name: "selectedComponents",
      message: "Select the components you want to install:",
      choices: availableComponents.map((comp) => ({
        name: `${comp.name} - ${comp.description}`,
        value: comp.name,
        checked: false,
      })),
      validate: (choices: readonly unknown[]) => {
        if (!Array.isArray(choices) || choices.length === 0) {
          return "Please select at least one component";
        }
        return true;
      },
    },
    chalk.yellow(
      "Cannot prompt for component selection in non-interactive mode. Use 'tambo init' followed by 'tambo add <component>' to add components individually.",
    ),
  );

  let installationSuccess = true;
  for (const component of selectedComponents) {
    const spinner = ora(`Installing ${component}...`).start();
    try {
      await handleAddComponent(component, {
        silent: true,
        legacyPeerDeps: options.legacyPeerDeps,
        installPath,
      });
      spinner.succeed(`Installed ${component}`);
    } catch (error) {
      installationSuccess = false;
      spinner.fail(
        `Failed to install ${component}: ${(error as Error).message}`,
      );
      // Break out of the loop on first failure
      break;
    }
  }

  if (!installationSuccess) {
    console.log(
      chalk.yellow(
        "\n⚠️ Component installation failed. Please try installing them individually using 'npx tambo add <component-name>' or with '--legacy-peer-deps' flag.",
      ),
    );
    return; // Exit early without showing next steps
  }

  displayFullSendInstructions(selectedComponents);
}

/**
 * Displays the full-send mode instructions
 * @param selectedComponents Array of component names that were selected by the user
 */
function displayFullSendInstructions(selectedComponents: string[] = []): void {
  console.log(chalk.green("\n✨ Full-send initialization complete!"));
  console.log(chalk.blue("\nNext steps:"));
  console.log(chalk.bold("\n1. Add the TamboProvider to your layout file"));

  // Determine the likely layout file paths
  const possiblePaths = [
    "app/layout.tsx",
    "app/layout.jsx",
    "src/app/layout.tsx",
    "src/app/layout.jsx",
  ];

  const layoutPath =
    possiblePaths.find((path) => fs.existsSync(path)) ?? "app/layout.tsx";
  console.log(chalk.gray(`\n   📁 Layout file location: ${layoutPath}`));
  console.log(chalk.gray(`\n   Add the following code to your layout file:`));

  // Map component names to their capitalized versions
  const componentNameMap: Record<string, string> = {
    "message-thread-full": "MessageThreadFull",
    "message-thread-panel": "MessageThreadPanel",
    "message-thread-collapsible": "MessageThreadCollapsible",
    "control-bar": "ControlBar",
  };

  // If no components were selected, use a default
  if (selectedComponents.length === 0) {
    selectedComponents = ["message-thread-full"];
  }

  // Generate import statements for selected components
  const importStatements = selectedComponents
    .map(
      (comp) =>
        `import { ${componentNameMap[comp]} } from "@/components/${COMPONENT_SUBDIR}/${comp}";`,
    )
    .join("\n");

  // Generate component instances
  const componentInstances = selectedComponents
    .map((comp) => `      <${componentNameMap[comp]} />`)
    .join("\n");

  // Just the TamboProvider part for clipboard with all selected components
  const providerSnippet = `"use client"; // Important!
import { TamboProvider } from "@tambo-ai/react";
import { components } from "../../lib/tambo";
${importStatements}
// other imports

export default function Page() {
  // other code
  return (
    <div>
      {/* other components */}
      <TamboProvider
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
        components={components}
      >
        {/* Tambo components */}
${componentInstances}
        {/* other Tambo components */}
      </TamboProvider>
      {/* other components */}
    </div>
  );}`;

  // Copy just the TamboProvider snippet to clipboard
  try {
    clipboard.writeSync(providerSnippet);
    console.log(chalk.cyan("\n" + providerSnippet + "\n"));
    console.log(
      chalk.green("\n   ✓ TamboProvider component copied to clipboard!"),
    );
  } catch (error) {
    console.log(chalk.cyan("\n" + providerSnippet + "\n"));
    console.log(chalk.yellow("\n   ⚠️ Failed to copy to clipboard: " + error));
  }

  console.log(chalk.bold("\n2. Use the installed components"));
  console.log(chalk.gray("   Import any of the following components:"));

  // Only show the components that were installed
  selectedComponents.forEach((comp) => {
    console.log(chalk.gray(`   • ${componentNameMap[comp]}`));
  });

  console.log(chalk.bold("\n3. Documentation"));
  console.log(
    chalk.gray("   Visit https://docs.tambo.co for detailed usage examples"),
  );

  console.log(chalk.bold("\n4. Start your app"));
  console.log(
    chalk.gray("   Run 'npm run dev' to see the components in action"),
  );
}

/**
 * Main initialization handler
 * @param options InitOptions containing initialization preferences
 */
export async function handleInit({
  fullSend = false,
  legacyPeerDeps = false,
  yes = false,
  skipAgentDocs = false,
}: InitOptions): Promise<void> {
  try {
    if (fullSend) {
      return await handleFullSendInit({
        fullSend,
        legacyPeerDeps,
        yes,
        skipAgentDocs,
      });
    }

    if (!validateRootPackageJson()) return;
    console.log(
      chalk.blue(
        "\nInitializing tambo. Choose hosting and let's set up your API key.\n",
      ),
    );

    const authSuccess = await handleHostingChoiceAndAuth();
    if (!authSuccess) return;

    await handleAgentDocsUpdate({ yes, skipAgentDocs });

    console.log(chalk.green("\n✨ Basic initialization complete!"));

    console.log("\nNext steps:");
    console.log(
      "  1. Visit our quickstart guide at " +
        chalk.cyan("https://docs.tambo.co/getting-started/quickstart") +
        " to get started",
    );
    console.log(
      "  2. Explore our component library at " +
        chalk.cyan("https://ui.tambo.co") +
        " to discover all available components\n",
    );
  } catch (error) {
    // NonInteractiveError has its own formatted message
    if (error instanceof NonInteractiveError) {
      console.error(error.message);
    } else {
      console.error(chalk.red("Initialization failed: " + error));
    }
    process.exit(1);
  }
}

/**
 * Validates the existence and format of package.json
 * @returns boolean indicating if package.json is valid
 */
function validateRootPackageJson(): boolean {
  try {
    JSON.parse(fs.readFileSync("package.json", "utf8"));
    return true;
  } catch (_error) {
    console.log(
      chalk.yellow(
        "This doesn't look like a valid Next.js project. Please run this command from the root of your project, where the `package.json` file is located.",
      ),
    );
    return false;
  }
}
