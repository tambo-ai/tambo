import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { installComponents } from "./add/component.js";
import { componentExists } from "./add/utils.js";
import { getInstallationPath } from "./init.js";

interface UpdateComponentOptions {
  legacyPeerDeps?: boolean;
  silent?: boolean;
}

/**
 * Finds the component location in the project
 * @param componentName Name of the component to find
 * @param projectRoot Project root directory
 * @returns Object containing component path and installation path
 */
async function findComponentLocation(
  componentName: string,
  projectRoot: string,
) {
  try {
    // Get the correct installation path based on project structure
    const installPath = await getInstallationPath();
    const componentDir = path.join(projectRoot, installPath, "ui");
    const componentPath = path.join(componentDir, `${componentName}.tsx`);

    if (!fs.existsSync(componentPath)) {
      return null;
    }

    return {
      componentPath,
      installPath,
    };
  } catch (error) {
    throw new Error(`Failed to locate component: ${error}`);
  }
}

/**
 * Handles updating a component from the registry
 * @param componentName The name of the component to update
 * @param options Update options
 */
export async function handleUpdateComponent(
  componentName: string,
  options: UpdateComponentOptions = {},
): Promise<void> {
  try {
    // Check if component exists in registry
    if (!componentExists(componentName)) {
      throw new Error(
        `Component ${componentName} not found in registry. Use 'npx tambo add ${componentName}' to add it.`,
      );
    }

    const projectRoot = process.cwd();
    const location = await findComponentLocation(componentName, projectRoot);

    if (!location) {
      throw new Error(
        `Component ${componentName} not found in your project. Use 'npx tambo add ${componentName}' to add it.`,
      );
    }

    // Prompt for confirmation
    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: chalk.yellow(
        `⚠️  Warning: This will override your existing ${componentName} component with the version from the registry. Are you sure you want to continue?`,
      ),
      default: false,
    });

    if (!confirm) {
      if (!options.silent) {
        console.log(chalk.gray("Update cancelled."));
      }
      return;
    }

    // Perform the update by reinstalling the component
    await installComponents([componentName], {
      ...options,
      forceUpdate: true,
      installPath: location.installPath,
    });

    if (!options.silent) {
      console.log(
        chalk.green(`✔ Successfully updated ${componentName} component`),
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!options.silent) {
      console.error(chalk.red(`Failed to update component: ${errorMessage}`));
    }
    throw error;
  }
}
