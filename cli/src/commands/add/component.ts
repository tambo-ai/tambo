import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";
import { updateImportPaths } from "../migrate.js";
import type { ComponentConfig, InstallComponentOptions } from "./types.js";
import { componentExists, getConfigPath, getRegistryPath } from "./utils.js";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Calculates the lib directory path based on the install path and whether it's an explicit prefix
 * @param installPath The component installation path
 * @param isExplicitPrefix Whether the installPath was explicitly provided via --prefix
 * @returns The calculated lib directory path
 */
function calculateLibDir(
  installPath: string,
  isExplicitPrefix: boolean,
): string {
  if (isExplicitPrefix) {
    // For explicit prefix, check if it starts with 'src' as a whole directory
    const pathParts = installPath.split(path.sep);
    const startsWithSrc = pathParts.length > 0 && pathParts[0] === "src";

    if (startsWithSrc) {
      return path.join(process.cwd(), "src", "lib");
    } else {
      return path.join(process.cwd(), "lib");
    }
  } else {
    // For auto-detected paths, use the standard logic
    return path.join(process.cwd(), path.dirname(installPath), "lib");
  }
}

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

  const componentDir = isExplicitPrefix
    ? path.join(process.cwd(), installPath)
    : path.join(process.cwd(), installPath, COMPONENT_SUBDIR);

  // For lib directory, use the base install path if provided (for legacy compatibility)
  // Otherwise use the standard calculation
  let libDir: string;
  if (options.baseInstallPath) {
    // When using legacy location, calculate lib based on the original base path
    libDir = calculateLibDir(options.baseInstallPath, false);
  } else {
    libDir = calculateLibDir(installPath, isExplicitPrefix);
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
          // Check if content looks like a path to a file in registry
          if (file.content.startsWith("src/registry/")) {
            // Get the registry root path
            const registryRoot = path.join(__dirname, "../../../");
            const contentPath = path.join(registryRoot, file.content);

            if (fs.existsSync(contentPath)) {
              fileContent = fs.readFileSync(contentPath, "utf-8");
            } else {
              console.error(`Cannot find referenced file: ${contentPath}`);
            }
          } else {
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
}
