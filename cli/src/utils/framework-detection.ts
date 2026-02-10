import fs from "fs";
import path from "path";

/** Known framework identifiers */
export type FrameworkName = "next" | "vite";

/** Vite config filenames, checked during both detection and toolchain setup */
export const VITE_CONFIG_FILES = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mjs",
] as const;

/**
 * Configuration for a detected framework
 */
export interface FrameworkConfig {
  /** Framework identifier */
  name: FrameworkName;
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
  detect: (root: string) => boolean;
}

/**
 * Checks if a package exists in dependencies or devDependencies
 */
function hasPackage(packageName: string, root: string): boolean {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    );
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
function hasAnyFile(filenames: string[], root: string): boolean {
  return filenames.some((file) => fs.existsSync(path.join(root, file)));
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
    detect: (root) =>
      hasPackage("next", root) ||
      hasAnyFile(["next.config.js", "next.config.ts", "next.config.mjs"], root),
  },
  {
    name: "vite",
    displayName: "Vite",
    envPrefix: "VITE_",
    detect: (root) =>
      hasPackage("vite", root) || hasAnyFile([...VITE_CONFIG_FILES], root),
  },
];

/**
 * Detects which framework is being used in the current project
 * @param projectRoot The root directory to check. Defaults to process.cwd().
 * @returns The detected framework config, or null if no known framework is detected
 */
export function detectFramework(projectRoot?: string): FrameworkConfig | null {
  const root = projectRoot ?? process.cwd();
  for (const framework of FRAMEWORKS) {
    if (framework.detect(root)) {
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

/**
 * Gets the default CSS file path based on the detected framework.
 * @param projectRoot The root directory of the project
 * @param framework The detected framework config, or null if unknown
 * @returns A relative path suitable for creating a new globals CSS file.
 */
export function getDefaultCssPath(
  projectRoot: string,
  framework: FrameworkConfig | null,
): string {
  const hasSrcDir = fs.existsSync(path.join(projectRoot, "src"));

  if (framework?.name === "vite") {
    return hasSrcDir ? "src/index.css" : "index.css";
  }

  // Next.js or default
  const appPath = hasSrcDir ? "src/app" : "app";
  return path.join(appPath, "globals.css");
}
