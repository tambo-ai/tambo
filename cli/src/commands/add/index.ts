import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { getInstallationPath } from "../init.js";
import { installComponents } from "./component.js";
import { resolveComponentDependencies } from "./dependencies.js";
import { setupTailwindandGlobals } from "./tailwind.js";
import type { InstallComponentOptions } from "./types.js";

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
    if (!fs.existsSync(path.join(process.cwd(), "package.json"))) {
      throw new Error(
        "No package.json found. Please run this command in your project root.",
      );
    }

    // 2. Get installation path if not provided
    const installPath =
      options.installPath ?? (await getInstallationPath(options.yes));
    const isExplicitPrefix = Boolean(options.installPath);

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
    const existingComponentsPath = isExplicitPrefix
      ? path.join(process.cwd(), installPath)
      : path.join(process.cwd(), installPath, "ui");
    const existingComponents = components.filter((comp) =>
      fs.existsSync(path.join(existingComponentsPath, `${comp}.tsx`)),
    );
    const newComponents = components.filter(
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

    // 5. Show installation plan
    if (!options.silent) {
      console.log(`${chalk.blue("ℹ")} Components to be installed:`);
      newComponents.forEach((comp) => console.log(`  - ${comp}`));

      if (existingComponents.length > 0) {
        console.log(`\n${chalk.blue("ℹ")} Already installed components:`);
        existingComponents.forEach((comp) => console.log(`  - ${comp}`));
      }

      if (!options.yes) {
        const { proceed } = await inquirer.prompt({
          type: "confirm",
          name: "proceed",
          message: "Do you want to proceed with installation?",
          default: true,
        });

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
    });

    // 7. Setup Tailwind and globals.css after all components are installed
    await setupTailwindandGlobals(process.cwd());

    if (!options.silent) {
      console.log(chalk.green("\n✨ Installation complete!"));
    }
  } catch (error) {
    if (!options.silent) {
      console.log(chalk.red(`\n✖ Installation failed: ${error}`));
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
