import fs from "fs";
import path from "path";
import type { FrameworkInfo, FrameworkName, NextJsVariant } from "./types.js";

/**
 * Config files to check for each framework
 */
const NEXT_CONFIG_FILES = [
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
] as const;

const VITE_CONFIG_FILES = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mjs",
] as const;

/**
 * Checks if any of the specified config files exist
 */
function hasAnyConfigFile(filenames: readonly string[], root: string): boolean {
  return filenames.some((file) => fs.existsSync(path.join(root, file)));
}

/**
 * Reads and parses package.json from project root
 *
 * @param projectRoot - Project root directory
 * @returns Object with dependencies and devDependencies merged, or empty object if parse fails
 */
function readPackageJsonDeps(projectRoot: string): Record<string, unknown> {
  try {
    const packageJsonPath = path.join(projectRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
  } catch {
    return {};
  }
}

/**
 * Detects Next.js router variant (App Router vs Pages Router)
 *
 * App Router detection: checks for app/layout.tsx or src/app/layout.tsx
 * Pages Router detection: checks for pages/_app.tsx or src/pages/_app.tsx
 * Priority: App Router takes precedence if both exist
 *
 * @param projectRoot - Project root directory
 * @returns Next.js router variant
 */
function detectNextJsVariant(projectRoot: string): NextJsVariant {
  // Check for App Router layout files
  const appLayoutCandidates = [
    "app/layout.tsx",
    "app/layout.jsx",
    "src/app/layout.tsx",
    "src/app/layout.jsx",
  ];

  for (const candidate of appLayoutCandidates) {
    if (fs.existsSync(path.join(projectRoot, candidate))) {
      return "next-app-router";
    }
  }

  // Check for Pages Router _app files
  const pagesAppCandidates = [
    "pages/_app.tsx",
    "pages/_app.jsx",
    "src/pages/_app.tsx",
    "src/pages/_app.jsx",
  ];

  for (const candidate of pagesAppCandidates) {
    if (fs.existsSync(path.join(projectRoot, candidate))) {
      return "next-pages-router";
    }
  }

  // Default to App Router for new projects
  return "next-app-router";
}

/**
 * Detects the React framework in use in a project
 *
 * Detection priority (as recommended by research):
 * 1. Next.js (config files or 'next' dependency) - highest priority
 * 2. Vite (config files or 'vite' dependency)
 * 3. Remix ('@remix-run/react' dependency)
 * 4. CRA ('react-scripts' dependency) - lowest priority (deprecated)
 *
 * @param projectRoot - Project root directory to analyze
 * @returns Framework information including name, variant (if Next.js), display name, and env prefix
 */
export function detectFrameworkInfo(projectRoot: string): FrameworkInfo {
  const deps = readPackageJsonDeps(projectRoot);

  // 1. Next.js detection (highest priority)
  if ("next" in deps || hasAnyConfigFile(NEXT_CONFIG_FILES, projectRoot)) {
    const variant = detectNextJsVariant(projectRoot);
    return {
      name: "next" as FrameworkName,
      variant,
      displayName:
        variant === "next-app-router"
          ? "Next.js App Router"
          : "Next.js Pages Router",
      envPrefix: "NEXT_PUBLIC_",
    };
  }

  // 2. Vite detection
  if ("vite" in deps || hasAnyConfigFile(VITE_CONFIG_FILES, projectRoot)) {
    return {
      name: "vite" as FrameworkName,
      displayName: "Vite",
      envPrefix: "VITE_",
    };
  }

  // 3. Remix detection
  if ("@remix-run/react" in deps) {
    return {
      name: "remix" as FrameworkName,
      displayName: "Remix",
      envPrefix: null,
    };
  }

  // 4. CRA detection (lowest priority - deprecated)
  if ("react-scripts" in deps) {
    return {
      name: "cra" as FrameworkName,
      displayName: "Create React App",
      envPrefix: "REACT_APP_",
    };
  }

  // Unknown framework
  return {
    name: "unknown" as FrameworkName,
    displayName: "Unknown",
    envPrefix: null,
  };
}
