import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { installComponents } from "../add/component.js";
import { getInstalledComponents } from "../add/utils.js";
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
    const installedComponentNames = await getInstalledComponents(installPath);

    spinner.succeed(
      `Found ${installedComponentNames.length} tambo components to upgrade`,
    );

    if (installedComponentNames.length === 0) {
      return true;
    }

    // Verify each component location
    const verifySpinner = ora("Verifying component locations...").start();
    const verifiedComponents: { name: string; installPath: string }[] = [];
    const missingComponents: string[] = [];

    for (const componentName of installedComponentNames) {
      const location = findComponentLocation(
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

    verifySpinner.succeed("Component verification complete\n");

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

    // Component selection interface (unless acceptAll is true)
    let componentsToUpgrade = verifiedComponents;

    if (!options.acceptAll) {
      const instructions = [
        chalk.reset.gray("↑↓ to select a component"),
        chalk.reset.gray("Space: Toggle selection"),
        chalk.reset.gray("a: Toggle all"),
        chalk.reset.gray("i: Invert selection"),
        chalk.reset.gray("Enter: Upgrade"),
      ].join("\n");

      const { selectedComponents } = await inquirer.prompt({
        type: "checkbox",
        name: "selectedComponents",
        message: `Choose which components to update ·\n${instructions}`,
        choices: verifiedComponents.map((comp) => ({
          name: comp.name,
          value: comp.name,
          checked: false,
        })),
        pageSize: 10,
        instructions: false,
      });

      if (selectedComponents.length === 0) {
        console.log(chalk.gray("\nNo components selected for upgrade."));
        return true;
      }

      // Final confirmation
      console.log("\n");
      const proceed = await confirmAction(
        `This will upgrade ${selectedComponents.length} component(s) with the latest versions from the registry. Continue?`,
        true,
      );

      if (!proceed) {
        console.log(chalk.gray("\nComponent upgrades cancelled."));
        return true;
      }

      // Filter to only include selected components
      const verifiedMap = new Map(verifiedComponents.map((c) => [c.name, c]));
      componentsToUpgrade = selectedComponents
        .map((name: string) => verifiedMap.get(name))
        .filter(Boolean) as { name: string; installPath: string }[];

      if (componentsToUpgrade.length === 0) {
        console.log(
          chalk.red("Selected components could not be matched – aborting."),
        );
        return false;
      }
    }

    // Install/upgrade selected components one by one
    let successCount = 0;

    for (const component of componentsToUpgrade) {
      const componentSpinner = ora(`Upgrading ${component.name}...`).start();

      try {
        // Install one component at a time
        await installComponents([component.name], {
          legacyPeerDeps: options.legacyPeerDeps,
          forceUpdate: true,
          installPath: component.installPath,
          silent: true,
        });

        successCount++;
        componentSpinner.succeed(`Updated ${component.name}`);
      } catch (error) {
        componentSpinner.fail(`Failed to update ${component.name}: ${error}`);
      }
    }

    console.log(
      chalk.green(
        `✔ Successfully upgraded ${successCount} of ${componentsToUpgrade.length} components`,
      ),
    );
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to upgrade components: ${error}`));
    return false;
  }
}
