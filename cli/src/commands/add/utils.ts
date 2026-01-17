import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LEGACY_COMPONENT_SUBDIR } from "../../constants/paths.js";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
} from "../shared/path-utils.js";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gets the registry root path.
 *
 * This is the directory that contains the `components/` folder (and related
 * registry directories like `lib/` and `styles/`).
 *
 * For local development, `TAMBO_REGISTRY_PATH` can be set to override registry
 * resolution.
 * @returns The path to the registry root
 */
export function getRegistryBasePath(): string {
  const envPath = process.env.TAMBO_REGISTRY_PATH;
  if (envPath) {
    const resolvedEnvPath = path.resolve(envPath);
    const componentsDir = path.join(resolvedEnvPath, "components");
    if (!fs.existsSync(componentsDir)) {
      throw new Error(
        `Invalid TAMBO_REGISTRY_PATH: expected a registry root containing a 'components' directory at "${componentsDir}"`,
      );
    }

    return resolvedEnvPath;
  }

  // When running the compiled CLI (from dist/commands/add), registry is at dist/registry/
  const distRegistryPath = path.join(__dirname, "../../registry");
  if (fs.existsSync(distRegistryPath)) {
    return distRegistryPath;
  }

  // When running the TS source directly (from src/commands/add), registry is at dist/registry/
  const distRegistryPathFromSrc = path.join(
    __dirname,
    "../../../dist/registry",
  );
  if (fs.existsSync(distRegistryPathFromSrc)) {
    return distRegistryPathFromSrc;
  }

  // Monorepo dev fallback.
  const cliRoot = path.resolve(__dirname, "../../..");
  const uiRegistrySrcPath = path.resolve(
    cliRoot,
    "../packages/ui-registry/src",
  );
  if (fs.existsSync(uiRegistrySrcPath)) {
    return uiRegistrySrcPath;
  }

  throw new Error(
    "Registry not found. The CLI looked for the registry in dist/registry and packages/ui-registry/src. Set TAMBO_REGISTRY_PATH to the registry root, or rebuild the CLI to generate dist/registry.",
  );
}

/**
 * Gets the registry path for a component
 * @param componentName The name of the component
 * @returns The path to the component in the registry
 */
export function getRegistryPath(componentName: string): string {
  return path.join(getRegistryBasePath(), "components", componentName);
}

/**
 * Gets the config path for a component
 * @param componentName The name of the component
 * @returns The path to the component's config file
 */
export function getConfigPath(componentName: string): string {
  return path.join(getRegistryPath(componentName), "config.json");
}

/**
 * Checks if a component exists in the registry with a valid config
 * @param componentName The name of the component to check
 * @returns True if the component exists with valid config, false otherwise
 */
export function componentExists(componentName: string): boolean {
  try {
    const configPath = getConfigPath(componentName);
    if (!fs.existsSync(configPath)) {
      return false;
    }

    // Try to parse the config to ensure it's valid JSON
    const configContent = fs.readFileSync(configPath, "utf-8");
    JSON.parse(configContent);
    return true;
  } catch (_error) {
    return false;
  }
}

interface ComponentInfo {
  name: string;
  description: string;
  componentName: string;
}

/**
 * Gets a list of all available components with their descriptions and component names
 * @returns An array of ComponentInfo objects
 */
export function getComponentList(): ComponentInfo[] {
  const componentsPath = path.join(getRegistryBasePath(), "components");
  if (!fs.existsSync(componentsPath)) {
    return [];
  }

  const components = fs
    .readdirSync(componentsPath)
    .filter((file) =>
      fs.statSync(path.join(componentsPath, file)).isDirectory(),
    );

  return components
    .map((componentName) => {
      const configPath = getConfigPath(componentName);
      if (!fs.existsSync(configPath)) {
        return null;
      }
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      return {
        name: componentName,
        description: config.description ?? "No description available",
        componentName: config.componentName ?? componentName,
      };
    })
    .filter((component) => component !== null);
}

/**
 * Gets detailed information about all known Tambo components
 * @returns An object with main components and support components
 */
export function getTamboComponentInfo(): {
  mainComponents: Set<string>;
  supportComponents: Set<string>;
  allComponents: Set<string>;
} {
  try {
    const componentsPath = path.join(getRegistryBasePath(), "components");
    if (!fs.existsSync(componentsPath)) {
      return {
        mainComponents: new Set(),
        supportComponents: new Set(),
        allComponents: new Set(),
      };
    }

    const mainComponents = new Set<string>();
    const supportComponents = new Set<string>();

    // First, add all components that have their own directories
    const directories = fs
      .readdirSync(componentsPath)
      .filter((file) => {
        const fullPath = path.join(componentsPath, file);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter((componentName) => componentExists(componentName));

    directories.forEach((name) => mainComponents.add(name));

    // Then, scan all config files to find additional components that are included as files
    directories.forEach((componentName) => {
      const configPath = getConfigPath(componentName);
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          if (config.files && Array.isArray(config.files)) {
            config.files.forEach((file: { name: string }) => {
              if (file.name?.endsWith(".tsx")) {
                // Extract component name from filename (remove .tsx extension)
                const fileName = path.basename(file.name, ".tsx");
                // Don't add the component itself
                if (
                  fileName !== componentName &&
                  !mainComponents.has(fileName)
                ) {
                  supportComponents.add(fileName);
                }
              }
            });
          }
        } catch (_error) {
          // Skip if config parsing fails
        }
      }
    });

    // Combine both sets for allComponents
    const allComponents = new Set([...mainComponents, ...supportComponents]);

    return { mainComponents, supportComponents, allComponents };
  } catch (_error) {
    return {
      mainComponents: new Set(),
      supportComponents: new Set(),
      allComponents: new Set(),
    };
  }
}

/**
 * Gets a set of all known tambo registry component names
 * @returns A Set of component names that exist in the registry
 */
export function getKnownComponentNames(): Set<string> {
  const { allComponents } = getTamboComponentInfo();
  return allComponents;
}

/**
 * Checks if components exist in the legacy location
 * @param installPath The installation path for components
 * @returns Path to legacy components if they exist, null otherwise
 */
export function checkLegacyComponents(installPath: string): string | null {
  const legacyPath = path.join(
    process.cwd(),
    installPath,
    LEGACY_COMPONENT_SUBDIR,
  );

  if (fs.existsSync(legacyPath)) {
    const files = fs.readdirSync(legacyPath);
    const hasComponents = files.some((file) => file.endsWith(".tsx"));

    if (hasComponents) {
      return legacyPath;
    }
  }

  return null;
}

/**
 * Gets a list of all installed component names in the project
 * @param installPath The installation path for components
 * @param isExplicitPrefix Whether the installPath was explicitly provided via --prefix
 * @returns An array of installed component names (only tambo registry components)
 */
export async function getInstalledComponents(
  installPath: string,
  isExplicitPrefix = false,
): Promise<string[]> {
  try {
    const projectRoot = process.cwd();
    const componentsPath = getComponentDirectoryPath(
      projectRoot,
      installPath,
      isExplicitPrefix,
    );

    const legacyPath = !isExplicitPrefix
      ? getLegacyComponentDirectoryPath(projectRoot, installPath)
      : null;

    const allComponents = new Set<string>();

    // Check new location
    if (fs.existsSync(componentsPath)) {
      const files = fs.readdirSync(componentsPath);
      const knownComponents = getKnownComponentNames();

      files
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""))
        .filter((name) => knownComponents.has(name) && componentExists(name))
        .forEach((name) => allComponents.add(name));
    }

    // Check legacy location
    if (legacyPath && fs.existsSync(legacyPath)) {
      const files = fs.readdirSync(legacyPath);
      const knownComponents = getKnownComponentNames();

      files
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""))
        .filter((name) => knownComponents.has(name) && componentExists(name))
        .forEach((name) => allComponents.add(name));
    }

    return Array.from(allComponents);
  } catch (_error) {
    return [];
  }
}
