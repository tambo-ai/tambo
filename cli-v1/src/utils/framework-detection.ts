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
 * Order matters - first match wins (more specific frameworks should come first)
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
  {
    name: "remix",
    displayName: "Remix",
    envPrefix: null, // Remix uses server-side env vars, no prefix needed
    detect: () =>
      hasPackage("@remix-run/react") ||
      hasPackage("@remix-run/node") ||
      hasAnyFile(["remix.config.js", "remix.config.ts"]),
  },
  {
    name: "react-router",
    displayName: "React Router 7",
    envPrefix: "VITE_", // React Router 7 uses Vite under the hood
    detect: () =>
      hasPackage("react-router") &&
      hasAnyFile(["react-router.config.ts", "react-router.config.js"]),
  },
  {
    name: "astro",
    displayName: "Astro",
    envPrefix: "PUBLIC_",
    detect: () =>
      hasPackage("astro") ||
      hasAnyFile(["astro.config.mjs", "astro.config.ts", "astro.config.js"]),
  },
  {
    name: "vite",
    displayName: "Vite",
    envPrefix: "VITE_",
    detect: () =>
      hasPackage("vite") ||
      hasAnyFile(["vite.config.js", "vite.config.ts", "vite.config.mjs"]),
  },
  {
    name: "cra",
    displayName: "Create React App",
    envPrefix: "REACT_APP_",
    detect: () => hasPackage("react-scripts"),
  },
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

/**
 * CSS file location patterns for each framework
 */
interface CssLocation {
  /** Possible paths where global CSS might exist (in priority order) */
  searchPaths: string[];
  /** Default path to create CSS if none exists */
  defaultPath: string;
}

/**
 * Gets the expected CSS file locations for the detected framework
 * @returns CSS location info for the current framework
 */
export function getGlobalsCssLocations(): CssLocation {
  const framework = detectFramework();
  const hasSrcDir = fs.existsSync("src");

  switch (framework?.name) {
    case "next":
      return {
        searchPaths: hasSrcDir
          ? [
              "src/app/globals.css",
              "src/styles/globals.css",
              "app/globals.css",
              "styles/globals.css",
            ]
          : ["app/globals.css", "styles/globals.css"],
        defaultPath: hasSrcDir ? "src/app/globals.css" : "app/globals.css",
      };

    case "remix":
      return {
        searchPaths: [
          "app/tailwind.css",
          "app/styles/tailwind.css",
          "app/root.css",
        ],
        defaultPath: "app/tailwind.css",
      };

    case "react-router":
      return {
        searchPaths: ["app/app.css", "app/tailwind.css", "app/styles.css"],
        defaultPath: "app/app.css",
      };

    case "astro":
      return {
        searchPaths: [
          "src/styles/global.css",
          "src/styles/globals.css",
          "src/global.css",
        ],
        defaultPath: "src/styles/global.css",
      };

    case "vite":
      return {
        searchPaths: hasSrcDir
          ? [
              "src/index.css",
              "src/App.css",
              "src/styles/globals.css",
              "index.css",
            ]
          : ["index.css", "src/index.css"],
        defaultPath: hasSrcDir ? "src/index.css" : "index.css",
      };

    case "cra":
      return {
        searchPaths: ["src/index.css", "src/App.css"],
        defaultPath: "src/index.css",
      };

    default:
      // Generic fallback
      return {
        searchPaths: hasSrcDir
          ? [
              "src/index.css",
              "src/globals.css",
              "src/styles/globals.css",
              "index.css",
            ]
          : ["index.css", "styles/globals.css"],
        defaultPath: hasSrcDir ? "src/index.css" : "index.css",
      };
  }
}

/**
 * Finds an existing global CSS file or returns the default path
 * @returns The path to use for global CSS
 */
export function findOrGetGlobalsCssPath(): string {
  const locations = getGlobalsCssLocations();

  for (const searchPath of locations.searchPaths) {
    if (fs.existsSync(searchPath)) {
      return searchPath;
    }
  }

  return locations.defaultPath;
}
