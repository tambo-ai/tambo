import fs from "fs";
import path from "path";
import type {
  FrameworkInfo,
  ProjectStructure,
  TypeScriptInfo,
} from "./types.js";
import { findDirectory, findFirstExisting } from "./fs-helpers.js";

/**
 * Default directories to exclude when searching for components
 */
const EXCLUDE_DIRS = [
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".turbo",
  "coverage",
];

/**
 * Recursively finds all directories with a given name
 *
 * @param projectRoot - Root directory to search from
 * @param dirName - Directory name to find (e.g., 'components')
 * @returns Array of absolute paths to matching directories
 */
function findDirectoriesRecursively(
  projectRoot: string,
  dirName: string,
): string[] {
  const results: string[] = [];

  function walk(currentPath: string): void {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      // Skip directories we can't read
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const fullPath = path.join(currentPath, entry.name);

      // Skip excluded directories
      if (EXCLUDE_DIRS.some((ex) => entry.name === ex)) {
        continue;
      }

      // Match found
      if (entry.name === dirName) {
        results.push(fullPath);
        // Don't recurse into matched directories
        continue;
      }

      // Recurse into other directories
      walk(fullPath);
    }
  }

  walk(projectRoot);
  return results;
}

/**
 * Finds the root layout file based on detected framework
 *
 * @param projectRoot - Project root directory
 * @param framework - Detected framework information
 * @returns Absolute path to root layout file, or null if not found
 */
function findRootLayout(
  projectRoot: string,
  framework: FrameworkInfo,
): string | null {
  let candidates: string[] = [];

  if (framework.name === "next") {
    if (framework.variant === "next-app-router") {
      candidates = [
        "src/app/layout.tsx",
        "src/app/layout.jsx",
        "app/layout.tsx",
        "app/layout.jsx",
      ];
    } else {
      candidates = [
        "src/pages/_app.tsx",
        "src/pages/_app.jsx",
        "pages/_app.tsx",
        "pages/_app.jsx",
      ];
    }
  } else if (framework.name === "vite") {
    candidates = ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"];
  } else if (framework.name === "remix") {
    candidates = ["app/root.tsx", "app/root.jsx"];
  } else if (framework.name === "cra") {
    candidates = ["src/App.tsx", "src/App.jsx"];
  } else {
    // Unknown framework - try common patterns
    candidates = ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"];
  }

  return findFirstExisting(candidates, projectRoot);
}

/**
 * Detects project directory structure
 *
 * @param projectRoot - Project root directory to analyze
 * @param framework - Detected framework information
 * @returns Project structure information including directories and root layout path
 */
export function detectProjectStructure(
  projectRoot: string,
  framework: FrameworkInfo,
): ProjectStructure {
  // Check for src/ directory
  const srcPath = path.join(projectRoot, "src");
  const hasSrcDir =
    fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory();

  // Find app/ and pages/ directories
  const appDirPath = findDirectory(["src/app", "app"], projectRoot);
  const pagesDirPath = findDirectory(["src/pages", "pages"], projectRoot);

  // Find all components/ directories
  const componentsDirs = findDirectoriesRecursively(projectRoot, "components");

  // Locate root layout file
  const rootLayoutPath = findRootLayout(projectRoot, framework);

  return {
    hasSrcDir,
    srcPath: hasSrcDir ? srcPath : null,
    appDirPath,
    pagesDirPath,
    componentsDirs,
    rootLayoutPath,
  };
}

/**
 * Strips single-line comments from JSON content
 *
 * @param content - JSON content that may contain comments
 * @returns Content with comments removed
 */
function stripComments(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      // Remove single-line comments
      const commentIndex = line.indexOf("//");
      if (commentIndex !== -1) {
        return line.substring(0, commentIndex);
      }
      return line;
    })
    .join("\n");
}

/**
 * Detects TypeScript configuration in project
 *
 * @param projectRoot - Project root directory to analyze
 * @returns TypeScript configuration information including strict mode setting
 */
export function detectTypeScriptConfig(projectRoot: string): TypeScriptInfo {
  const configPath = path.join(projectRoot, "tsconfig.json");

  // Check if tsconfig.json exists
  if (!fs.existsSync(configPath)) {
    return {
      isTypeScript: false,
      configPath: null,
      strict: null,
    };
  }

  // Try to parse tsconfig.json
  try {
    const content = fs.readFileSync(configPath, "utf8");
    const stripped = stripComments(content);
    const config = JSON.parse(stripped);

    const strict = config.compilerOptions?.strict ?? null;

    return {
      isTypeScript: true,
      configPath,
      strict: typeof strict === "boolean" ? strict : null,
    };
  } catch {
    // If parsing fails, still report TypeScript is present
    return {
      isTypeScript: true,
      configPath,
      strict: null,
    };
  }
}
