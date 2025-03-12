import chalk from "chalk";
import clipboard from "clipboardy";
import fs from "fs";
import inquirer from "inquirer";
import open from "open";
import ora from "ora";
import { handleAddComponent } from "./add/index";

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

interface InitOptions {
  fullSend?: boolean;
  legacyPeerDeps?: boolean;
}

/**
 * Handles the authentication flow with Tambo
 * @returns Promise<boolean> Returns true if authentication was successful
 * @throws AuthenticationError
 */
async function handleAuthentication(): Promise<boolean> {
  try {
    // 1. Browser-based auth flow
    console.log(chalk.cyan("Step 1: Authentication"));
    const authUrl = "https://tambo.co/cli-auth";
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
    const { apiKey } = await inquirer.prompt([
      {
        type: "password",
        name: "apiKey",
        message: "Please paste your API key from the browser:",
        validate: (input: string) => {
          if (!input?.trim()) return "API key is required";
          return true;
        },
      },
    ]);

    // 3. Save API key to .env file
    const envContent = `\nNEXT_PUBLIC_TAMBO_API_KEY=${apiKey.trim()}`;

    // Check if .env.local exists, if not create it
    if (!fs.existsSync(".env.local")) {
      fs.writeFileSync(".env.local", "# Environment Variables");
      console.log(chalk.green("✔ Created new .env.local file"));
    } else {
      // Check if API key already exists in the file
      const existingContent = fs.readFileSync(".env.local", "utf8");
      const keyRegex = /^NEXT_PUBLIC_TAMBO_API_KEY=.*/g;

      if (keyRegex.test(existingContent)) {
        // Replace existing key
        const updatedContent = existingContent.replace(
          keyRegex,
          `NEXT_PUBLIC_TAMBO_API_KEY=${apiKey.trim()}`,
        );
        fs.writeFileSync(".env.local", updatedContent);
        console.log(chalk.green("✔ Updated existing API key in .env.local"));
        return true;
      }
    }

    fs.appendFileSync(".env.local", envContent);
    console.log(chalk.green("✔ API key saved to .env.local"));
    return true;
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
 * Handles the full-send initialization process
 * Installs all required components and sets up the project
 */
async function handleFullSendInit(options: InitOptions): Promise<void> {
  if (!validateRootPackageJson()) return;

  console.log(
    chalk.blue(
      "🚀 Initializing Tambo with full-send mode. Let's get you set up!\n",
    ),
  );

  const authSuccess = await handleAuthentication();
  if (!authSuccess) return;

  // Install required components
  console.log(chalk.cyan("\nStep 2: Installing required components"));

  const components = [
    "message-thread-full",
    "message-thread-panel",
    "message-thread-collapsible",
    "control-bar",
  ];

  let installationSuccess = true;
  for (const component of components) {
    const spinner = ora(`Installing ${component}...`).start();
    try {
      await handleAddComponent(component, {
        silent: true,
        legacyPeerDeps: options.legacyPeerDeps,
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
        "\n⚠️ Component installation failed. Please try installing them individually using 'tambo add <component-name>' or with '--legacy-peer-deps' flag.",
      ),
    );
    return; // Exit early without showing next steps
  }

  displayFullSendInstructions();
}

/**
 * Displays the full-send mode instructions
 */
function displayFullSendInstructions(): void {
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

  // Full provider code for display
  const fullProviderCode = `
import { TamboProvider } from "@tambo-ai/react";

export default function RootLayout({ children }) {
	return (
		<TamboProvider
			apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
		>
			{children}
		</TamboProvider>
	);
}`;

  // Just the TamboProvider part for clipboard
  const providerSnippet = `<TamboProvider
	apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
>
`;

  // Copy just the TamboProvider snippet to clipboard
  try {
    clipboard.writeSync(providerSnippet);
    console.log(chalk.cyan(fullProviderCode));
    console.log(
      chalk.green("\n   ✓ TamboProvider component copied to clipboard!"),
    );
  } catch (error) {
    console.log(chalk.cyan(fullProviderCode));
    console.log(chalk.yellow("\n   ⚠️ Failed to copy to clipboard: " + error));
  }

  console.log(chalk.bold("\n2. Use the installed components"));
  console.log(chalk.gray("   Import any of the following components:"));
  console.log(chalk.gray("   • MessageThreadFull"));
  console.log(chalk.gray("   • MessageThreadPanel"));
  console.log(chalk.gray("   • MessageThreadCollapsible"));
  console.log(chalk.gray("   • ControlBar"));

  console.log(chalk.bold("\n3. Documentation"));
  console.log(
    chalk.gray("   Visit https://tambo.co/docs for detailed usage examples"),
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
}: InitOptions): Promise<void> {
  try {
    if (fullSend) {
      return await handleFullSendInit({ fullSend, legacyPeerDeps });
    }

    if (!validateRootPackageJson()) return;
    console.log(chalk.blue("Initializing Tambo. Let's set up your API key."));

    const authSuccess = await handleAuthentication();
    if (!authSuccess) return;

    console.log(chalk.green("\n✨ Basic initialization complete!"));
    console.log(chalk.blue("\nNext steps:"));
    console.log("1. Add components using 'npx tambo add <component-name>'");
    console.log("2. Check the documentation for available components");
    console.log("3. Run your app to test the integration");
  } catch (error) {
    console.error(chalk.red("Initialization failed: " + error));
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
