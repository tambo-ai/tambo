import fs from "fs";

/**
 * Configuration for a detected framework
 */
export interface FrameworkConfig {
  /** Framework identifier */
  name: string;
  /** Display name for user-facing messages */
  displayName: string;
  /** Prefix required for client-side env vars, or null if none needed */
  envPrefix: string | null;
}

/**
 * Internal framework definition with detection logic
 */
interface FrameworkDefinition extends FrameworkConfig {
  /** Function to detect if this framework is in use */
  detect: () => boolean;
}

/**
 * Checks if a package exists in dependencies or devDependencies
 */
function hasPackage(packageName: string): boolean {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const deps = packageJson.dependencies ?? {};
    const devDeps = packageJson.devDependencies ?? {};
    return packageName in deps || packageName in devDeps;
  } catch {
    return false;
  }
}

/**
 * Checks if any of the specified files exist
 */
function hasAnyFile(filenames: string[]): boolean {
  return filenames.some((file) => fs.existsSync(file));
}

/**
 * Supported frameworks with their detection logic and env var prefixes
 * Order matters - first match wins
 */
const FRAMEWORKS: FrameworkDefinition[] = [
  {
    name: "next",
    displayName: "Next.js",
    envPrefix: "NEXT_PUBLIC_",
    detect: () =>
      hasPackage("next") ||
      hasAnyFile(["next.config.js", "next.config.ts", "next.config.mjs"]),
  },
  // Future frameworks can be added here:
  // {
  //   name: "vite",
  //   displayName: "Vite",
  //   envPrefix: "VITE_",
  //   detect: () => hasPackage("vite") || hasAnyFile(["vite.config.js", "vite.config.ts"]),
  // },
  // {
  //   name: "cra",
  //   displayName: "Create React App",
  //   envPrefix: "REACT_APP_",
  //   detect: () => hasPackage("react-scripts"),
  // },
];

/**
 * Detects which framework is being used in the current project
 * @returns The detected framework config, or null if no known framework is detected
 */
export function detectFramework(): FrameworkConfig | null {
  for (const framework of FRAMEWORKS) {
    if (framework.detect()) {
      return {
        name: framework.name,
        displayName: framework.displayName,
        envPrefix: framework.envPrefix,
      };
    }
  }
  return null;
}

/**
 * Gets the appropriate environment variable name for the API key
 * based on the detected framework
 * @param baseName The base env var name (e.g., "TAMBO_API_KEY")
 * @returns The full env var name with appropriate prefix
 */
export function getEnvVarName(baseName: string): string {
  const framework = detectFramework();
  if (framework?.envPrefix) {
    return `${framework.envPrefix}${baseName}`;
  }
  return baseName;
}

/**
 * Gets the API key environment variable name for the current project
 * @returns The env var name (e.g., "NEXT_PUBLIC_TAMBO_API_KEY" or "TAMBO_API_KEY")
 */
export function getTamboApiKeyEnvVar(): string {
  return getEnvVarName("TAMBO_API_KEY");
}
