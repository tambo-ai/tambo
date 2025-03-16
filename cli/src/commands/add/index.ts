import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { installSingleComponent } from "./component";
import { resolveComponentDependencies } from "./dependencies";
import { setupTailwindandGlobals } from "./tailwind";
import { InstallComponentOptions } from "./types";

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

		// 2. Resolve all dependencies first
		if (!options.silent) {
			console.log(`${chalk.blue("ℹ")} Resolving dependencies...`);
		}

		const components = await resolveComponentDependencies(componentName);

		// 3. Check which components need to be installed
		const existingComponents = components.filter((comp) =>
			fs.existsSync(
				path.join(process.cwd(), "src", "components", "ui", `${comp}.tsx`),
			),
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

		// 4. Show installation plan
		if (!options.silent) {
			console.log(`${chalk.blue("ℹ")} Components to be installed:`);
			newComponents.forEach((comp) => console.log(`  - ${comp}`));

			if (existingComponents.length > 0) {
				console.log(`\n${chalk.blue("ℹ")} Already installed components:`);
				existingComponents.forEach((comp) => console.log(`  - ${comp}`));
			}

			const { proceed } = await inquirer.prompt([
				{
					type: "confirm",
					name: "proceed",
					message: "Do you want to proceed with installation?",
					default: true,
				},
			]);

			if (!proceed) {
				console.log(chalk.yellow("Installation cancelled"));
				return;
			}
		}

		// 5. Install components in order (dependencies first)
		for (const component of newComponents) {
			await installSingleComponent(component, options);
		}

		// 6. Setup Tailwind and globals.css after all components are installed
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
