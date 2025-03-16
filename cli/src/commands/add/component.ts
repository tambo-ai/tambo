import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { ComponentConfig, InstallComponentOptions } from "./types";
import { componentExists, getConfigPath, getRegistryPath } from "./utils";

/**
 * Installs a single component and its dependencies
 * @param componentName The name of the component to install
 * @param options Installation options
 */
export async function installSingleComponent(
	componentName: string,
	options: InstallComponentOptions = {},
): Promise<void> {
	const configPath = getConfigPath(componentName);

	if (!componentExists(componentName)) {
		throw new Error(
			`Component ${componentName} not found in registry at ${configPath}`,
		);
	}

	const config: ComponentConfig = JSON.parse(
		fs.readFileSync(configPath, "utf-8"),
	);

	// 1. Create directories
	const componentDir = path.join(process.cwd(), "src", "components", "ui");
	const libDir = path.join(process.cwd(), "src", "lib");
	fs.mkdirSync(componentDir, { recursive: true });
	fs.mkdirSync(libDir, { recursive: true });

	// 2. Setup utils
	const utilsPath = path.join(libDir, "utils.ts");
	if (!fs.existsSync(utilsPath)) {
		const utilsContent = `
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}`;
		fs.writeFileSync(utilsPath, utilsContent.trim());
	}

	// 3. Handle dependencies
	if (config.dependencies.length > 0 || config.devDependencies?.length > 0) {
		const packageJson = JSON.parse(
			fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
		);
		const installedDeps = {
			...packageJson.dependencies,
			...packageJson.devDependencies,
		};

		const prodDeps = config.dependencies.filter((dep) => !installedDeps[dep]);
		const devDeps = [
			...(config.devDependencies || []),
			"tailwindcss",
			"postcss",
			"autoprefixer",
			"tailwind-merge",
			"clsx",
		].filter((dep) => !installedDeps[dep]);

		if (prodDeps.length > 0 || devDeps.length > 0) {
			if (!options.silent) {
				console.log(
					`${chalk.green("✔")} Installing dependencies for ${componentName}...`,
				);
			}

			try {
				// Add legacy-peer-deps flag if specified in options
				const legacyFlag = options.legacyPeerDeps ? " --legacy-peer-deps" : "";

				if (prodDeps.length > 0) {
					execSync(`npm install${legacyFlag} ${prodDeps.join(" ")}`, {
						stdio: "inherit",
						encoding: "utf-8",
					});
				}
				if (devDeps.length > 0) {
					execSync(`npm install -D${legacyFlag} ${devDeps.join(" ")}`, {
						stdio: "inherit",
						encoding: "utf-8",
					});
				}
			} catch (error) {
				throw new Error(
					`Failed to install dependencies for ${componentName}: ${error}`,
				);
			}
		}
	}

	// 4. Copy component files
	let filesAdded = 0;
	for (const file of config.files) {
		const sourcePath = path.join(getRegistryPath(componentName), file.name);
		const targetPath = path.join(componentDir, file.name);

		if (!fs.existsSync(targetPath)) {
			if (fs.existsSync(sourcePath)) {
				fs.copyFileSync(sourcePath, targetPath);
			} else {
				fs.writeFileSync(targetPath, file.content);
			}
			filesAdded++;
		}
	}

	if (!options.silent && filesAdded > 0) {
		console.log(`${chalk.green("✔")} Installed ${componentName}`);
	}
}
