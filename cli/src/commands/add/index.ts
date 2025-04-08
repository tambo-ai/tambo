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
 * @param componentName The name of the component to install
 * @param options Installation options
 */
export async function handleAddComponent(
  componentName: string,
  options: InstallComponentOptions = {},
) {
  if (!componentName) {
    console.log(chalk.red("Please specify a component name."));
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
    const installPath = options.installPath ?? (await getInstallationPath());

    // 3. Resolve all dependencies first
    if (!options.silent) {
      console.log(`${chalk.blue("ℹ")} Resolving dependencies...`);
    }

    const components = await resolveComponentDependencies(componentName);

    // 4. Check which components need to be installed
    const existingComponents = components.filter((comp) =>
      fs.existsSync(path.join(process.cwd(), installPath, "ui", `${comp}.tsx`)),
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
    }

    // 6. Install components in order (dependencies first)
    await installComponents(newComponents, { ...options, installPath });

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
