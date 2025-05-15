import chalk from "chalk";
import fs from "fs";
import ora from "ora";
import path from "path";
import { installComponents } from "../add/component.js";
import { componentExists } from "../add/utils.js";
import { getInstallationPath } from "../init.js";
import type { UpgradeOptions } from "./index.js";
import { confirmAction } from "./utils.js";

/**
 * Finds the component location in the project
 * @param componentName Name of the component to find
 * @param projectRoot Project root directory
 * @param installPath Pre-determined installation path
 * @returns Object containing component path and installation path
 */
async function findComponentLocation(
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
 * Upgrade tambo registry components
 */
export async function upgradeComponents(
  options: UpgradeOptions,
): Promise<boolean> {
  try {
    const projectRoot = process.cwd();

    console.log(chalk.blue("Determining component location..."));

    // Get installation path (this will print messages and prompt user)
    const installPath = await getInstallationPath();

    // Resume with a new spinner after installation path is determined
    const spinner = ora("Finding components...").start();

    const componentDir = path.join(projectRoot, installPath, "ui");

    if (!fs.existsSync(componentDir)) {
      spinner.info(
        "No tambo components directory found. Skipping component upgrades.",
      );
      return true;
    }

    // Get list of installed components
    const files = fs.readdirSync(componentDir);
    const installedComponentNames = files
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => file.replace(".tsx", ""))
      .filter((componentName) => componentExists(componentName));

    spinner.succeed(
      `Found ${installedComponentNames.length} tambo components to upgrade`,
    );

    if (installedComponentNames.length === 0) {
      return true;
    }

    // Verify each component location
    const verifySpinner = ora("Verifying component locations...").start();
    const verifiedComponents = [];
    const missingComponents = [];

    for (const componentName of installedComponentNames) {
      const location = await findComponentLocation(
        componentName,
        projectRoot,
        installPath,
      );
      if (location) {
        verifiedComponents.push({
          name: componentName,
          installPath: location.installPath,
        });
      } else {
        missingComponents.push(componentName);
      }
    }

    verifySpinner.succeed("Component verification complete");

    if (missingComponents.length > 0) {
      console.log(
        chalk.yellow(
          `⚠️ Could not locate these components: ${missingComponents.join(", ")}`,
        ),
      );
    }

    if (verifiedComponents.length === 0) {
      console.log("No valid components found to upgrade.");
      return true;
    }

    // Confirm all upgrades if not using acceptAll
    if (!options.acceptAll) {
      const proceed = await confirmAction(
        `This will upgrade ${verifiedComponents.length} tambo components with the latest versions from the registry. Continue?`,
        true,
      );

      if (!proceed) {
        console.log(chalk.gray("Component upgrades cancelled."));
        return true;
      }
    }

    // Install/upgrade components one by one
    let successCount = 0;

    for (const component of verifiedComponents) {
      const componentSpinner = ora(`Upgrading ${component.name}...`).start();

      try {
        // Install one component at a time
        await installComponents([component.name], {
          legacyPeerDeps: options.legacyPeerDeps,
          forceUpdate: true,
          installPath: component.installPath,
          silent: true, // Use our own spinner instead
        });

        successCount++;
        componentSpinner.succeed(`Updated ${component.name}`);
      } catch (error) {
        componentSpinner.fail(`Failed to update ${component.name}: ${error}`);
      }
    }

    console.log(
      chalk.green(
        `✔ Successfully upgraded ${successCount} of ${verifiedComponents.length} components`,
      ),
    );
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to upgrade components: ${error}`));
    return false;
  }
}
