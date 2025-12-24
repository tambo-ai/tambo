import chalk from "chalk";
import fs from "fs";
import path from "path";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";
import { resolveComponentDependencies } from "../../utils/dependency-resolution.js";
import {
  interactivePrompt,
  NonInteractiveError,
} from "../../utils/interactive.js";
import { getInstallationPath } from "../init.js";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
  resolveComponentPaths,
} from "../shared/path-utils.js";
import { installComponents } from "./component.js";
import { setupTailwindAndGlobals } from "./tailwind-setup.js";
import type { InstallComponentOptions } from "./types.js";
import { getKnownComponentNames } from "./utils.js";

/**
 * Main function to handle component installation
 * @param componentNames Array of component names to install
 * @param options Installation options
 */
export async function handleAddComponents(
  componentNames: string[],
  options: InstallComponentOptions = {},
) {
  if (!componentNames || componentNames.length === 0) {
    console.log(chalk.red("Please specify at least one component name."));
    return;
  }

  try {
    // 1. Check package.json
    const projectRoot = process.cwd();
    if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
      throw new Error(
        "No package.json found. Please run this command in your project root.",
      );
    }

    // 2. Get installation path if not provided
    let installPath =
      options.installPath ?? (await getInstallationPath(options.yes));
    // Respect explicitly set isExplicitPrefix, otherwise infer from installPath being provided
    let isExplicitPrefix =
      options.isExplicitPrefix ?? Boolean(options.installPath);
    let baseInstallPath: string | undefined; // Track the original base path

    // Check if there are existing components in legacy location
    if (!isExplicitPrefix) {
      const legacyPath = getLegacyComponentDirectoryPath(
        projectRoot,
        installPath,
      );
      const newPath = getComponentDirectoryPath(
        projectRoot,
        installPath,
        isExplicitPrefix,
      );

      // Get known Tambo component names to filter
      const knownTamboComponents = getKnownComponentNames();

      // Check for Tambo components specifically in legacy location
      const hasTamboComponentsInLegacy =
        fs.existsSync(legacyPath) &&
        fs
          .readdirSync(legacyPath)
          .filter((f) => f.endsWith(".tsx"))
          .map((f) => f.replace(".tsx", ""))
          .some((componentName) => knownTamboComponents.has(componentName));

      // Check for any components in new location (this is fine since it's the designated Tambo directory)
      const hasNewComponents =
        fs.existsSync(newPath) &&
        fs.readdirSync(newPath).some((f) => f.endsWith(".tsx"));

      if (hasTamboComponentsInLegacy && !hasNewComponents) {
        // Only install to ui/ if there are actual Tambo components there
        console.log(
          chalk.yellow(
            `\n⚠️  Found existing components in ${LEGACY_COMPONENT_SUBDIR}/. ` +
              `Installing new components to the same location for compatibility.\n`,
          ),
        );
        console.log(
          chalk.blue(
            `💡 To migrate all components to the new location (${COMPONENT_SUBDIR}/), you'll need to:\n` +
              `   1. Move all components from ${LEGACY_COMPONENT_SUBDIR}/ to ${COMPONENT_SUBDIR}/\n` +
              `   2. Update all import paths from @/components/${LEGACY_COMPONENT_SUBDIR}/ to @/components/${COMPONENT_SUBDIR}/\n` +
              `   3. Update any custom component registrations in tambo.ts\n` +
              `\n` +
              `   or you can run ${chalk.bold("npx tambo migrate")} to migrate all components to the new location\n`,
          ),
        );

        // Save the base path before modifying installPath
        baseInstallPath = installPath;
        // Override to use legacy location for consistency
        installPath = path.join(installPath, LEGACY_COMPONENT_SUBDIR);
        isExplicitPrefix = true; // This prevents adding COMPONENT_SUBDIR again
      } else if (hasTamboComponentsInLegacy && hasNewComponents) {
        // Only show warning if there are actual Tambo components in legacy location
        console.log(
          chalk.red(
            `\n❌ Found components in both ${LEGACY_COMPONENT_SUBDIR}/ and ${COMPONENT_SUBDIR}/ locations.\n` +
              `   This can cause import path issues between components.\n`,
          ),
        );
        console.log(
          chalk.yellow(
            `   Please consolidate your components to one location:\n` +
              `   - Move all to ${COMPONENT_SUBDIR}/ (recommended): npx tambo migrate\n` +
              `   - Or manually move components from ${COMPONENT_SUBDIR}/ back to ${LEGACY_COMPONENT_SUBDIR}/\n`,
          ),
        );

        if (!options.yes) {
          const { continueAnyway } = await interactivePrompt<{
            continueAnyway: boolean;
          }>(
            {
              type: "confirm",
              name: "continueAnyway",
              message: "Continue installation anyway?",
              default: false,
            },
            chalk.yellow(
              "Use --yes flag to auto-continue when components are in mixed locations.",
            ),
          );

          if (!continueAnyway) {
            console.log(chalk.gray("Installation cancelled."));
            return;
          }
        }
      }
    }

    // 3. Resolve all dependencies first
    if (!options.silent) {
      console.log(`${chalk.blue("ℹ")} Resolving dependencies...`);
    }

    // Collect all components and their dependencies
    const allComponents = new Set<string>();
    for (const componentName of componentNames) {
      const components = await resolveComponentDependencies(componentName);
      components.forEach((comp) => allComponents.add(comp));
    }

    const components = Array.from(allComponents);

    // 4. Check which components need to be installed
    let existingComponents: string[] = [];
    let newComponents: string[] = [];

    // If forceUpdate is true, treat all components as new to force reinstall
    if (options.forceUpdate) {
      newComponents = components;
    } else {
      existingComponents = components.filter((comp) => {
        const { newPath, legacyPath } = resolveComponentPaths(
          projectRoot,
          installPath,
          comp,
          isExplicitPrefix,
        );

        return (
          fs.existsSync(newPath) || (legacyPath && fs.existsSync(legacyPath))
        );
      });
      newComponents = components.filter(
        (comp) => !existingComponents.includes(comp),
      );

      if (newComponents.length === 0) {
        if (!options.silent) {
          console.log(
            chalk.blue("ℹ All required components are already installed:"),
          );
          existingComponents.forEach((comp) => console.log(`  - ${comp}`));
        }
        return;
      }
    }

    // 5. Show installation plan
    if (!options.silent) {
      console.log(`${chalk.blue("ℹ")} Components to be installed:`);
      newComponents.forEach((comp) => console.log(`  - ${comp}`));

      if (existingComponents.length > 0) {
        console.log(`\n${chalk.blue("ℹ")} Already installed components:`);
        existingComponents.forEach((comp) => console.log(`  - ${comp}`));
      }

      if (!options.yes) {
        const { proceed } = await interactivePrompt<{ proceed: boolean }>(
          {
            type: "confirm",
            name: "proceed",
            message: "Do you want to proceed with installation?",
            default: true,
          },
          chalk.yellow("Use --yes flag to auto-proceed with installation."),
        );

        if (!proceed) {
          console.log(chalk.yellow("Installation cancelled"));
          return;
        }
      } else {
        console.log(
          chalk.blue("ℹ Auto-proceeding with installation (--yes flag)"),
        );
      }
    }

    // 6. Install components in order (dependencies first)
    await installComponents(newComponents, {
      ...options,
      installPath,
      isExplicitPrefix,
      baseInstallPath, // Pass the original base path for lib calculation
    });

    // 7. Setup Tailwind and globals.css after all components are installed
    await setupTailwindAndGlobals(process.cwd());

    if (!options.silent) {
      console.log(chalk.green("\n✨ Installation complete!"));
    }
  } catch (error) {
    if (!options.silent) {
      // NonInteractiveError has its own formatted message
      if (error instanceof NonInteractiveError) {
        console.error(error.message);
        process.exit(1); // Exit directly, don't re-throw
      } else {
        console.log(chalk.red(`\n✖ Installation failed: ${error}`));
      }
    }
    throw error;
  }
}

/**
 * Legacy function to handle single component installation
 * @param componentName The name of the component to install
 * @param options Installation options
 */
export async function handleAddComponent(
  componentName: string,
  options: InstallComponentOptions = {},
) {
  return await handleAddComponents([componentName], options);
}
