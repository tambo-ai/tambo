import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { installComponents } from "./add/component.js";
import { componentExists, getInstalledComponents } from "./add/utils.js";
import { getInstallationPath } from "./init.js";

interface UpdateComponentOptions {
  legacyPeerDeps?: boolean;
  silent?: boolean;
}

/**
 * Finds the component location in the project
 * @param componentName Name of the component to find
 * @param projectRoot Project root directory
 * @param installPath Pre-determined installation path
 * @returns Object containing component path and installation path
 */
function findComponentLocation(
  componentName: string,
  projectRoot: string,
  installPath: string,
) {
  try {
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
 * Handles updating multiple components from the registry
 * @param componentNames Array of component names to update, or ["installed"] to update all
 * @param options Update options
 */
export async function handleUpdateComponents(
  componentNames: string[],
  options: UpdateComponentOptions = {},
): Promise<void> {
  try {
    if (!componentNames || componentNames.length === 0) {
      throw new Error(
        "Please specify at least one component name or 'installed'.",
      );
    }

    const projectRoot = process.cwd();

    // Get installation path once at the beginning
    const installPath = await getInstallationPath();

    let componentsToUpdate: string[] = [];

    // Handle special "installed" keyword
    if (componentNames.length === 1 && componentNames[0] === "installed") {
      const installedComponents = await getInstalledComponents(installPath);

      if (installedComponents.length === 0) {
        if (!options.silent) {
          console.log(
            chalk.blue("ℹ No tambo components are currently installed."),
          );
        }
        return;
      }

      componentsToUpdate = installedComponents;

      if (!options.silent) {
        console.log(
          chalk.blue(
            `ℹ Found ${installedComponents.length} installed components:`,
          ),
        );
        installedComponents.forEach((comp) => console.log(`  - ${comp}`));
        console.log(); // Empty line for spacing
      }
    } else {
      // Validate all components exist in registry
      for (const componentName of componentNames) {
        if (!componentExists(componentName)) {
          throw new Error(
            `Component ${componentName} not found in registry. Use 'npx tambo add ${componentName}' to add it.`,
          );
        }
      }
      componentsToUpdate = componentNames;
    }

    // Check which components are actually installed
    const validComponents: { name: string; installPath: string }[] = [];
    const missingComponents: string[] = [];

    for (const componentName of componentsToUpdate) {
      const location = findComponentLocation(
        componentName,
        projectRoot,
        installPath,
      );
      if (location) {
        validComponents.push({
          name: componentName,
          installPath: location.installPath,
        });
      } else {
        missingComponents.push(componentName);
      }
    }

    if (missingComponents.length > 0) {
      if (!options.silent) {
        console.log(
          chalk.yellow(
            `⚠️ These components are not installed in your project: ${missingComponents.join(", ")}`,
          ),
        );

        if (validComponents.length === 0) {
          console.log(chalk.blue("ℹ No components to update."));
          return;
        }
      }
    }

    if (validComponents.length === 0) {
      if (!options.silent) {
        console.log(chalk.blue("ℹ No components to update."));
      }
      return;
    }

    // Show update plan and ask for confirmation
    if (!options.silent) {
      console.log(chalk.blue(`ℹ Components to be updated:`));
      validComponents.forEach((comp) => console.log(`  - ${comp.name}`));

      const { confirm } = await inquirer.prompt({
        type: "confirm",
        name: "confirm",
        message: chalk.yellow(
          `⚠️  Warning: This will override your existing components with versions from the registry. Are you sure you want to continue?`,
        ),
        default: false,
      });

      if (!confirm) {
        console.log(chalk.gray("Update cancelled."));
        return;
      }
    }

    // Group components by install path to minimize reinstalls
    const componentsByPath = new Map<string, string[]>();
    for (const component of validComponents) {
      const existing = componentsByPath.get(component.installPath) ?? [];
      existing.push(component.name);
      componentsByPath.set(component.installPath, existing);
    }

    // Update components grouped by install path
    let successCount = 0;
    const totalComponents = validComponents.length;

    for (const [installPath, components] of componentsByPath.entries()) {
      try {
        await installComponents(components, {
          ...options,
          forceUpdate: true,
          installPath,
          silent: true,
        });
        successCount += components.length;

        if (!options.silent) {
          for (const componentName of components) {
            console.log(
              chalk.green(`✔ Successfully updated ${componentName}`),
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!options.silent) {
          for (const componentName of components) {
            console.error(
              chalk.red(
                `✖ Failed to update ${componentName}: ${errorMessage}`,
              ),
            );
          }
        }
      }
    }

    if (!options.silent) {
      if (successCount === totalComponents) {
        console.log(
          chalk.green(
            `\n✨ Successfully updated all ${successCount} components!`,
          ),
        );
      } else {
        console.log(
          chalk.yellow(
            `\n⚠️ Updated ${successCount} of ${totalComponents} components.`,
          ),
        );
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!options.silent) {
      console.error(chalk.red(`Failed to update components: ${errorMessage}`));
    }
    throw error;
  }
}
