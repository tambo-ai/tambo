import chalk from "chalk";
import fs from "fs";
import ora from "ora";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";
import {
  displayDependencyInfo,
  expandComponentsWithDependencies,
  resolveDependenciesForComponents,
} from "../../utils/dependency-resolution.js";
import { interactivePrompt } from "../../utils/interactive.js";
import { installComponents } from "../add/component.js";
import { setupTailwindAndGlobals } from "../add/tailwind-setup.js";
import type { InstallComponentOptions } from "../add/types.js";
import { getInstalledComponents } from "../add/utils.js";
import { getInstallationPath } from "../init.js";
import {
  detectCrossLocationDependencies,
  findComponentLocation,
  handleDependencyInconsistencies,
  type DependencyInconsistency,
} from "../shared/component-utils.js";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
} from "../shared/path-utils.js";
import type { UpgradeOptions } from "./index.js";
import { confirmAction, migrateComponentsDuringUpgrade } from "./utils.js";

/**
 * Represents a component that will be upgraded
 */
interface ComponentToUpgrade {
  /** Component name */
  name: string;
  /** Installation path for the component */
  installPath: string;
  /** Whether this component is in legacy location */
  isLegacy?: boolean;
  /** Base installation path (used for lib directory calculation) */
  baseInstallPath?: string;
}

/**
 * Prepares the final component list for upgrade based on migration decisions
 * @param componentsToUpgrade - Initial components to upgrade
 * @param legacyComponents - Components in legacy location
 * @param shouldMigrate - Whether migration should be performed
 * @param installPath - Base installation path
 * @returns Final list of components with correct paths
 */
async function prepareFinalComponentList(
  componentsToUpgrade: { name: string; installPath: string }[],
  legacyComponents: string[],
  shouldMigrate: boolean,
  installPath: string,
): Promise<ComponentToUpgrade[]> {
  if (shouldMigrate) {
    return componentsToUpgrade.map((component) => ({
      name: component.name,
      installPath: component.installPath,
    }));
  }

  const projectRoot = process.cwd();
  return componentsToUpgrade.map((component) => {
    if (legacyComponents.includes(component.name)) {
      return {
        name: component.name,
        installPath: getLegacyComponentDirectoryPath(
          projectRoot,
          component.installPath,
        ),
        isLegacy: true,
        baseInstallPath: component.installPath,
      };
    }
    return {
      name: component.name,
      installPath: component.installPath,
      baseInstallPath: installPath,
    };
  });
}

/**
 * Upgrades tambo registry components with directory structure migration support
 *
 * This function handles the complete upgrade workflow:
 * 1. Discovers installed components in both legacy (ui/) and new (tambo/) locations
 * 2. Detects cross-location dependencies that could cause import issues
 * 3. Offers migration options to resolve inconsistencies
 * 4. Upgrades components to latest registry versions
 * 5. Maintains proper import paths and support file locations
 *
 * @param options - Upgrade configuration options
 * @returns Promise that resolves to true if upgrade succeeded, false otherwise
 */
export async function upgradeComponents(
  options: UpgradeOptions,
): Promise<boolean> {
  try {
    const projectRoot = process.cwd();
    console.log(chalk.blue("Determining component location..."));

    const installPath =
      options.prefix ?? (await getInstallationPath(options.yes));
    const isExplicitPrefix = Boolean(options.prefix);

    // Find and verify components
    const spinner = ora("Finding components...").start();

    const componentDir = getComponentDirectoryPath(
      projectRoot,
      installPath,
      isExplicitPrefix,
    );

    const legacyDir = !isExplicitPrefix
      ? getLegacyComponentDirectoryPath(projectRoot, installPath)
      : null;

    if (
      !fs.existsSync(componentDir) &&
      (!legacyDir || !fs.existsSync(legacyDir))
    ) {
      spinner.info(
        "No tambo components directory found. Skipping component upgrades.",
      );
      return true;
    }

    const installedComponentNames = await getInstalledComponents(
      installPath,
      isExplicitPrefix,
    );
    spinner.succeed(
      `Found ${installedComponentNames.length} tambo components to upgrade`,
    );

    if (installedComponentNames.length === 0) return true;

    // Verify component locations
    const verifySpinner = ora("Verifying component locations...").start();
    const verifiedComponents: { name: string; installPath: string }[] = [];
    const missingComponents: string[] = [];
    const legacyComponents: string[] = [];
    const newComponents: string[] = [];

    for (const componentName of installedComponentNames) {
      const location = findComponentLocation(
        componentName,
        projectRoot,
        installPath,
        isExplicitPrefix,
      );

      if (location) {
        verifiedComponents.push({
          name: componentName,
          installPath: location.installPath,
        });

        if (location.needsCreation) {
          legacyComponents.push(componentName);
        } else {
          newComponents.push(componentName);
        }
      } else {
        missingComponents.push(componentName);
      }
    }

    verifySpinner.succeed("Component verification complete");

    // Check for cross-location dependencies
    let inconsistencies: DependencyInconsistency[] = [];
    if (legacyComponents.length > 0 && newComponents.length > 0) {
      const dependencySpinner = ora(
        "Checking component dependencies...",
      ).start();
      inconsistencies = await detectCrossLocationDependencies(
        verifiedComponents,
        installPath,
        isExplicitPrefix,
      );

      if (inconsistencies.length > 0) {
        dependencySpinner.fail("Found component location inconsistencies!");
      } else {
        dependencySpinner.succeed("Component dependencies verified");
      }
    }

    // Show missing components
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

    // Component selection
    let componentsToUpgrade = verifiedComponents;

    if (!options.yes) {
      const { selectedComponents } = await interactivePrompt<{
        selectedComponents: string[];
      }>(
        {
          type: "checkbox",
          name: "selectedComponents",
          message: "Choose which components to update:",
          choices: verifiedComponents.map((comp) => ({
            name: comp.name,
            value: comp.name,
            checked: false,
          })),
          pageSize: 10,
        },
        chalk.yellow("Use --yes flag to upgrade all components."),
      );

      if (selectedComponents.length === 0) {
        console.log(chalk.gray("\nNo components selected for upgrade."));
        return true;
      }

      const proceed = await confirmAction(
        `This will upgrade ${selectedComponents.length} component(s) with the latest versions from the registry. Continue?`,
        true,
      );

      if (!proceed) {
        console.log(chalk.gray("\nComponent upgrades cancelled."));
        return true;
      }

      const verifiedMap = new Map(verifiedComponents.map((c) => [c.name, c]));
      componentsToUpgrade = selectedComponents
        .map((name: string) => verifiedMap.get(name))
        .filter(Boolean) as { name: string; installPath: string }[];
    }

    // Resolve dependencies for selected components
    console.log(chalk.blue("\nResolving component dependencies..."));
    const installedComponentSet = new Set(installedComponentNames);

    // Resolve dependencies for all components
    const dependencyResult = await resolveDependenciesForComponents(
      componentsToUpgrade,
      installedComponentSet,
    );

    // Display dependency information
    displayDependencyInfo(dependencyResult, componentsToUpgrade);

    // Expand componentsToUpgrade to include all dependencies with their locations
    componentsToUpgrade = await expandComponentsWithDependencies(
      componentsToUpgrade,
      dependencyResult,
      projectRoot,
      installPath,
      isExplicitPrefix,
    );

    // Handle inconsistencies and migration
    let migrationPerformed = false;

    if (inconsistencies.length > 0) {
      migrationPerformed = await handleDependencyInconsistencies(
        inconsistencies,
        legacyComponents,
        installPath,
        "upgrade",
      );
    } else if (legacyComponents.length > 0 && !options.yes) {
      console.log(
        chalk.yellow(
          `\n⚠️  Found ${legacyComponents.length} components in legacy location (${LEGACY_COMPONENT_SUBDIR}/):`,
        ),
      );
      legacyComponents.forEach((comp) => console.log(`    - ${comp}`));

      migrationPerformed = await confirmAction(
        `Would you like to automatically migrate these to ${COMPONENT_SUBDIR}/ and update import paths during upgrade?`,
        false,
      );

      if (migrationPerformed) {
        await migrateComponentsDuringUpgrade(legacyComponents, installPath);
      }
    }

    // Prepare final component list
    const finalComponentsToUpgrade = await prepareFinalComponentList(
      componentsToUpgrade,
      legacyComponents,
      migrationPerformed,
      installPath,
    );

    // Upgrade components
    let successCount = 0;

    for (const component of finalComponentsToUpgrade) {
      const componentSpinner = ora(`Upgrading ${component.name}...`).start();

      try {
        const installOptions: InstallComponentOptions = {
          legacyPeerDeps: options.legacyPeerDeps,
          forceUpdate: true,
          installPath: component.installPath,
          silent: true,
          yes: options.yes,
        };

        if (component.isLegacy) {
          installOptions.isExplicitPrefix = true;
          installOptions.baseInstallPath = component.baseInstallPath;
        }

        await installComponents([component.name], installOptions);
        successCount++;
        componentSpinner.succeed(`Updated ${component.name}`);
      } catch (error) {
        componentSpinner.fail(`Failed to update ${component.name}: ${error}`);
      }
    }

    console.log(
      chalk.green(
        `✔ Successfully upgraded ${successCount} of ${finalComponentsToUpgrade.length} components`,
      ),
    );

    if (successCount > 0) {
      console.log(chalk.blue("\nChecking CSS configuration..."));
      await setupTailwindAndGlobals(projectRoot);
    }

    // Show post-upgrade guidance
    const remainingLegacyComponents = finalComponentsToUpgrade.filter(
      (c) => c.isLegacy,
    );
    if (remainingLegacyComponents.length > 0) {
      console.log(chalk.blue("\n📝 Post-upgrade notes:"));
      console.log(
        chalk.gray(
          `• ${remainingLegacyComponents.length} components remain in ${LEGACY_COMPONENT_SUBDIR}/ location`,
        ),
      );
      console.log(
        chalk.gray(
          `• Import paths: @/components/${LEGACY_COMPONENT_SUBDIR}/component-name`,
        ),
      );
      console.log(
        chalk.gray(
          `• Run 'npx tambo migrate' anytime to move all components to ${COMPONENT_SUBDIR}/`,
        ),
      );
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to upgrade components: ${error}`));
    return false;
  }
}
