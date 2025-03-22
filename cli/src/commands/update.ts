import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { installSingleComponent } from "./add/component.js";
import { componentExists } from "./add/utils.js";

interface UpdateComponentOptions {
  legacyPeerDeps?: boolean;
  silent?: boolean;
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
      console.error(
        chalk.red(
          `Component ${componentName} not found in registry. Use 'tambo add ${componentName}' to add it.`,
        ),
      );
      return;
    }

    // Check if component exists in local project
    const componentDir = path.join(process.cwd(), "src", "components", "ui");
    const componentPath = path.join(componentDir, `${componentName}.tsx`);

    if (!fs.existsSync(componentPath)) {
      console.error(
        chalk.red(
          `Component ${componentName} not found in your project. Use 'tambo add ${componentName}' to add it.`,
        ),
      );
      return;
    }

    // Prompt for confirmation
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.yellow(
          `⚠️  Warning: This will override your existing ${componentName} component with the version from the registry. Are you sure you want to continue?`,
        ),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray("Update cancelled."));
      return;
    }

    // Perform the update by reinstalling the component
    await installSingleComponent(componentName, {
      ...options,
      forceUpdate: true,
    });

    if (!options.silent) {
      console.log(
        chalk.green(`✔ Successfully updated ${componentName} component`),
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`Failed to update component ${componentName}: ${error}`),
    );
    process.exit(1);
  }
}
