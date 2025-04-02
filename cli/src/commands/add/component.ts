import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { ComponentConfig, InstallComponentOptions } from "./types.js";
import { componentExists, getConfigPath, getRegistryPath } from "./utils.js";

/**
 * Installs multiple components and their dependencies
 * @param componentNames Array of component names to install
 * @param options Installation options
 */
export async function installComponents(
  componentNames: string[],
  options: InstallComponentOptions = {},
): Promise<void> {
  // Validate all components exist first
  for (const componentName of componentNames) {
    const configPath = getConfigPath(componentName);
    if (!componentExists(componentName)) {
      throw new Error(
        `Component ${componentName} not found in registry at ${configPath}`,
      );
    }
  }

  // 1. Create component directory
  const componentDir = path.join(
    process.cwd(),
    options.installPath ?? "components",
    "ui",
  );
  const libDir = path.join(
    process.cwd(),
    path.dirname(options.installPath ?? "components"),
    "lib",
  );
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

  // 3. Collect all dependencies across components
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
  );
  const installedDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const allProdDeps = new Set<string>();
  const allDevDeps = new Set<string>([
    "tailwindcss",
    "postcss",
    "autoprefixer",
    "tailwind-merge",
    "clsx",
  ]);

  for (const componentName of componentNames) {
    const config: ComponentConfig = JSON.parse(
      fs.readFileSync(getConfigPath(componentName), "utf-8"),
    );

    config.dependencies.forEach((dep) => allProdDeps.add(dep));
    config.devDependencies?.forEach((dep) => allDevDeps.add(dep));
  }

  // Filter out already installed dependencies
  const prodDeps = Array.from(allProdDeps).filter((dep) => !installedDeps[dep]);
  const devDeps = Array.from(allDevDeps).filter((dep) => !installedDeps[dep]);

  // 4. Install all dependencies at once
  if (prodDeps.length > 0 || devDeps.length > 0) {
    if (!options.silent) {
      console.log(
        `${chalk.green("✔")} Installing dependencies for ${componentNames.join(", ")}...`,
      );
    }

    try {
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
      throw new Error(`Failed to install dependencies: ${error}`);
    }
  }

  // 5. Copy component files
  let filesAdded = 0;
  for (const componentName of componentNames) {
    const config: ComponentConfig = JSON.parse(
      fs.readFileSync(getConfigPath(componentName), "utf-8"),
    );

    for (const file of config.files) {
      const sourcePath = path.join(getRegistryPath(componentName), file.name);
      const targetPath = path.join(componentDir, file.name);

      if (!fs.existsSync(targetPath) || options.forceUpdate) {
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
        } else {
          fs.writeFileSync(targetPath, file.content);
        }
        filesAdded++;
      }
    }
  }

  if (!options.silent && filesAdded > 0) {
    console.log(
      `${chalk.green("✔")} ${options.forceUpdate ? "Updated" : "Installed"} ${componentNames.join(", ")}`,
    );
  }
}
