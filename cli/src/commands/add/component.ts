import chalk from "chalk";
import fs from "fs";
import path from "path";
import { LEGACY_COMPONENT_SUBDIR } from "../../constants/paths.js";
import { execFileSync } from "../../utils/interactive.js";
import {
  detectPackageManager,
  formatPackageArgs,
  getDevFlag,
  getInstallCommand,
} from "../../utils/package-manager.js";
import {
  getComponentDirectoryPath,
  getLibDirectory,
} from "../shared/path-utils.js";
import { updateImportPaths } from "../migrate.js";
import { handleAgentDocsUpdate } from "../shared/agent-docs.js";
import type { ComponentConfig, InstallComponentOptions } from "./types.js";
import {
  componentExists,
  getConfigPath,
  getRegistryBasePath,
  getRegistryPath,
} from "./utils.js";

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
  const installPath = options.installPath ?? "components";
  const isExplicitPrefix = Boolean(options.isExplicitPrefix);
  const projectRoot = process.cwd();

  const componentDir = getComponentDirectoryPath(
    projectRoot,
    installPath,
    isExplicitPrefix,
  );

  // For lib directory, use the base install path if provided (for legacy compatibility)
  // Otherwise use the standard calculation
  let libDir: string;
  if (options.baseInstallPath) {
    // When using legacy location, calculate lib based on the original base path
    libDir = getLibDirectory(projectRoot, options.baseInstallPath, false);
  } else {
    libDir = getLibDirectory(projectRoot, installPath, isExplicitPrefix);
  }

  fs.mkdirSync(componentDir, { recursive: true });

  // Only create lib directory if it doesn't exist
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  // 2. Setup utils - only if it doesn't exist
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
    const pm = detectPackageManager();
    const installCmd = getInstallCommand(pm);
    const devFlag = getDevFlag(pm);
    // --legacy-peer-deps is npm-specific
    const legacyPeerDepsFlag =
      options.legacyPeerDeps && pm === "npm" ? ["--legacy-peer-deps"] : [];

    if (!options.silent) {
      console.log(
        `${chalk.green("✔")} Installing dependencies for ${componentNames.join(", ")} using ${pm}...`,
      );
    }

    try {
      const allowNonInteractive = Boolean(options.yes);

      if (prodDeps.length > 0) {
        const args = [
          ...installCmd,
          ...legacyPeerDepsFlag,
          ...formatPackageArgs(pm, prodDeps),
        ];
        execFileSync(pm, args, {
          stdio: "inherit",
          encoding: "utf-8",
          allowNonInteractive,
        });
      }
      if (devDeps.length > 0) {
        const args = [
          ...installCmd,
          devFlag,
          ...legacyPeerDepsFlag,
          ...formatPackageArgs(pm, devDeps),
        ];
        execFileSync(pm, args, {
          stdio: "inherit",
          encoding: "utf-8",
          allowNonInteractive,
        });
      }
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error}`);
    }
  }

  // 5. Copy component files
  let filesAdded = 0;
  // Determine if we're installing to legacy location
  const isLegacyLocation =
    options.baseInstallPath !== undefined ||
    (isExplicitPrefix && installPath.includes(LEGACY_COMPONENT_SUBDIR));

  const targetLocation = isLegacyLocation ? "ui" : "tambo";

  for (const componentName of componentNames) {
    const config: ComponentConfig = JSON.parse(
      fs.readFileSync(getConfigPath(componentName), "utf-8"),
    );

    for (const file of config.files) {
      const sourcePath = path.join(getRegistryPath(componentName), file.name);

      // Check if this is a lib file (path contains /lib/)
      const isLibFile =
        file.name.includes("/lib/") || file.name.startsWith("lib/");

      // Determine target directory based on file type
      const targetDir = isLibFile ? libDir : componentDir;

      // Extract just the filename or subdirectory+filename
      const relativePath = isLibFile
        ? file.name.substring(file.name.indexOf("lib/") + 4) // Remove 'lib/' prefix
        : file.name;

      const targetPath = path.join(targetDir, relativePath);

      // Ensure the directory exists
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });

      if (!fs.existsSync(targetPath) || options.forceUpdate) {
        let fileContent = "";

        if (fs.existsSync(sourcePath)) {
          fileContent = fs.readFileSync(sourcePath, "utf-8");
        } else {
          // Try to resolve content path from registry base
          // Handle both old format (src/registry/...) and new format (lib/..., components/...)
          // Strip leading "src/registry/" prefix using path operations for cross-platform safety
          let contentRelativePath = file.content;
          const parts = contentRelativePath.split(path.sep);
          if (parts[0] === "src" && parts[1] === "registry") {
            contentRelativePath = parts.slice(2).join(path.sep);
          }

          const contentPath = path.join(
            getRegistryBasePath(),
            contentRelativePath,
          );

          if (fs.existsSync(contentPath)) {
            fileContent = fs.readFileSync(contentPath, "utf-8");
          } else {
            // If still not found, try treating file.content as literal content
            fileContent = file.content;
          }
        }

        // Update import paths if this is a component file
        if (file.name.endsWith(".tsx") || file.name.endsWith(".ts")) {
          fileContent = updateImportPaths(fileContent, targetLocation);
        }

        fs.writeFileSync(targetPath, fileContent);
        filesAdded++;
      }
    }
  }

  if (!options.silent && filesAdded > 0) {
    console.log(
      `${chalk.green("✔")} ${options.forceUpdate ? "Updated" : "Installed"} ${componentNames.join(", ")}`,
    );
  }

  if (!options.silent && !options.skipAgentDocs) {
    await handleAgentDocsUpdate({
      skipPrompt: true,
      yes: options.yes,
      prefix: options.installPath,
      skipAgentDocs: options.skipAgentDocs,
    });
  }
}
