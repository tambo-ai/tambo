import chalk from "chalk";
import ora from "ora";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../constants/paths.js";
import {
  displayDependencyInfo,
  expandComponentsWithDependencies,
  resolveDependenciesForComponents,
} from "../utils/dependency-resolution.js";
import {
  interactivePrompt,
  NonInteractiveError,
} from "../utils/interactive.js";
import { installComponents } from "./add/component.js";
import { setupTailwindAndGlobals } from "./add/tailwind-setup.js";
import type { InstallComponentOptions } from "./add/types.js";
import { componentExists, getInstalledComponents } from "./add/utils.js";
import { getInstallationPath } from "./init.js";
import {
  detectCrossLocationDependencies,
  findComponentLocation,
  handleDependencyInconsistencies,
  type DependencyInconsistency,
} from "./shared/component-utils.js";
import { getLegacyComponentDirectoryPath } from "./shared/path-utils.js";

interface UpdateComponentOptions {
  legacyPeerDeps?: boolean;
  silent?: boolean;
  prefix?: string;
  isExplicitPrefix?: boolean;
  yes?: boolean;
}

/**
 * Handles updating multiple components from the registry with dependency inconsistency detection
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
    const installPath =
      options.prefix ?? (await getInstallationPath(options.yes));
    const isExplicitPrefix = Boolean(options.prefix);

    let componentsToUpdate: string[] = [];

    // Handle "installed" keyword
    if (componentNames.length === 1 && componentNames[0] === "installed") {
      const installedComponents = await getInstalledComponents(
        installPath,
        isExplicitPrefix,
      );

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
        console.log();
      }
    } else {
      // Validate components exist in registry
      for (const componentName of componentNames) {
        if (!componentExists(componentName)) {
          throw new Error(
            `Component ${componentName} not found in registry. Use 'npx tambo add ${componentName}' to add it.`,
          );
        }
      }
      componentsToUpdate = componentNames;
    }

    // Check which components are actually installed and categorize them
    const verifiedComponents: { name: string; installPath: string }[] = [];
    const missingComponents: string[] = [];
    const legacyComponents: string[] = [];
    const newComponents: string[] = [];

    for (const componentName of componentsToUpdate) {
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

    // Show missing components
    if (missingComponents.length > 0) {
      if (!options.silent) {
        console.log(
          chalk.yellow(
            `⚠️ These components are not installed in your project: ${missingComponents.join(", ")}`,
          ),
        );

        if (verifiedComponents.length === 0) {
          console.log(chalk.blue("ℹ No components to update."));
          return;
        }
      }
    }

    if (verifiedComponents.length === 0) {
      if (!options.silent) {
        console.log(chalk.blue("ℹ No components to update."));
      }
      return;
    }

    // Resolve dependencies for components to update
    if (!options.silent) {
      console.log(chalk.blue("\nℹ Resolving component dependencies..."));
    }

    // Get list of all installed components to filter dependencies
    const allInstalledComponents = await getInstalledComponents(
      installPath,
      isExplicitPrefix,
    );
    const installedComponentSet = new Set(allInstalledComponents);

    // Resolve dependencies for all components
    const dependencyResult = await resolveDependenciesForComponents(
      verifiedComponents,
      installedComponentSet,
      { silent: options.silent },
    );

    // Display dependency information
    if (!options.silent) {
      displayDependencyInfo(dependencyResult, verifiedComponents);
    }

    // Expand verifiedComponents to include all dependencies with their locations
    const expandedComponents = await expandComponentsWithDependencies(
      verifiedComponents,
      dependencyResult,
      projectRoot,
      installPath,
      isExplicitPrefix,
    );

    // Update verifiedComponents and categorize expanded dependencies
    verifiedComponents.length = 0;
    verifiedComponents.push(...expandedComponents);

    // Re-categorize components after expansion
    legacyComponents.length = 0;
    newComponents.length = 0;

    for (const component of verifiedComponents) {
      const location = findComponentLocation(
        component.name,
        projectRoot,
        installPath,
        isExplicitPrefix,
      );

      if (location) {
        if (location.needsCreation) {
          legacyComponents.push(component.name);
        } else {
          newComponents.push(component.name);
        }
      } else {
        // Missing dependencies go to the new location by default
        newComponents.push(component.name);
      }
    }

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

    // Handle dependency inconsistencies
    let migrationPerformed = false;
    if (inconsistencies.length > 0) {
      migrationPerformed = await handleDependencyInconsistencies(
        inconsistencies,
        legacyComponents,
        installPath,
        "update",
      );
    }

    // Prepare final component list
    const finalComponents = verifiedComponents.map((component) => {
      if (!migrationPerformed && legacyComponents.includes(component.name)) {
        // Component stays in legacy location
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
        isLegacy: false,
      };
    });

    // Show update plan and ask for confirmation
    if (!options.silent) {
      console.log(chalk.blue(`ℹ Components to be updated:`));
      finalComponents.forEach((comp) => console.log(`  - ${comp.name}`));

      if (!options.yes) {
        const { confirm } = await interactivePrompt<{ confirm: boolean }>(
          {
            type: "confirm",
            name: "confirm",
            message: chalk.yellow(
              `⚠️  Warning: This will override your existing components with versions from the registry. Are you sure you want to continue?`,
            ),
            default: false,
          },
          chalk.yellow(
            "Use --yes flag to auto-proceed with component updates.",
          ),
        );

        if (!confirm) {
          console.log(chalk.gray("Update cancelled."));
          return;
        }
      } else {
        console.log(chalk.blue("ℹ Auto-proceeding with update (--yes flag)"));
      }
    }

    // Update components
    let successCount = 0;
    const totalComponents = finalComponents.length;

    for (const component of finalComponents) {
      try {
        const installOptions: InstallComponentOptions = {
          ...options,
          forceUpdate: true,
          installPath: component.installPath,
          silent: true,
        };

        // Set isExplicitPrefix when using explicit prefix or legacy location
        if (isExplicitPrefix || component.isLegacy) {
          installOptions.isExplicitPrefix = true;
          if (component.isLegacy) {
            installOptions.baseInstallPath = component.baseInstallPath;
          }
        }

        await installComponents([component.name], installOptions);
        successCount++;

        if (!options.silent) {
          console.log(chalk.green(`✔ Successfully updated ${component.name}`));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!options.silent) {
          console.error(
            chalk.red(`✖ Failed to update ${component.name}: ${errorMessage}`),
          );
        }
      }
    }

    if (successCount > 0 && !options.silent) {
      console.log(chalk.blue("\nChecking CSS configuration..."));
      await setupTailwindAndGlobals(projectRoot);
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

      // Show guidance for mixed locations
      const legacyUpdatedComponents = finalComponents.filter((c) => c.isLegacy);
      if (legacyUpdatedComponents.length > 0) {
        console.log(chalk.blue("\n📝 Post-update notes:"));
        console.log(
          chalk.gray(
            `• ${legacyUpdatedComponents.length} components remain in ${LEGACY_COMPONENT_SUBDIR}/ location`,
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
    }
  } catch (error) {
    if (!options.silent) {
      // NonInteractiveError has its own formatted message
      if (error instanceof NonInteractiveError) {
        console.error(error.message);
        process.exit(1); // Exit directly, don't re-throw
      } else {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          chalk.red(`Failed to update components: ${errorMessage}`),
        );
      }
    }
    throw error;
  }
}
