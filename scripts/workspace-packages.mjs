import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

/**
 * Resolves the transitive closure of workspace package dependencies for a given app.
 *
 * In development, all workspace deps are included so Next.js compiles from source for HMR.
 * In production, only packages that export raw .ts/.tsx files (no build step) are included,
 * so packages with built output (dist/, esm/) are consumed as-is — validating the build.
 *
 * @param {string} appDir - Absolute path to the app directory
 * @returns {string[]} - Array of workspace package names to transpile
 */
export function getWorkspaceTranspilePackages(appDir) {
  const isDev = process.env.NODE_ENV !== "production";
  const repoRoot = findRepoRoot(appDir);
  const rootPkg = JSON.parse(
    readFileSync(join(repoRoot, "package.json"), "utf8"),
  );

  // Build name → { dir, pkg } map for all workspace packages
  const workspaceMap = new Map();
  for (const pattern of rootPkg.workspaces) {
    const dirs = pattern.includes("*")
      ? readdirSync(join(repoRoot, pattern.replace("/*", "")), {
          withFileTypes: true,
        })
          .filter((d) => d.isDirectory())
          .map((d) => join(repoRoot, pattern.replace("/*", ""), d.name))
      : [join(repoRoot, pattern)];

    for (const dir of dirs) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
        if (pkg.name) {
          workspaceMap.set(pkg.name, { dir, pkg });
        }
      } catch {
        // Skip dirs without package.json
      }
    }
  }

  // Recursively collect workspace deps
  const appPkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
  const result = new Set();

  function collect(pkg) {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    for (const dep of Object.keys(allDeps)) {
      if (workspaceMap.has(dep) && !result.has(dep)) {
        result.add(dep);
        const depEntry = workspaceMap.get(dep);
        collect(depEntry.pkg);
      }
    }
  }

  collect(appPkg);
  result.delete(appPkg.name);

  if (isDev) {
    return [...result];
  }

  // In production, only transpile packages that export raw TypeScript
  return [...result].filter((name) => {
    const { pkg } = workspaceMap.get(name);
    return needsTranspilation(pkg);
  });
}

/**
 * Checks whether a package exports raw .ts/.tsx files as its production entry points,
 * meaning it has no build step and must be transpiled by the consuming bundler.
 *
 * Packages with built output have a "development" condition for source and "import"/"require"
 * conditions pointing to .js files — these don't need transpilation in production.
 *
 * @param {Record<string, unknown>} pkg - Parsed package.json
 * @returns {boolean}
 */
function needsTranspilation(pkg) {
  const exports = pkg.exports;
  if (!exports) {
    // Fall back to main field
    return isRawTypeScriptFile(pkg.main || "");
  }

  return anyProdTargetNeedsTranspilation(exports);
}

function isRawTypeScriptFile(path) {
  if (typeof path !== "string") {
    return false;
  }

  const clean = path.split(/[?#]/, 1)[0];
  return (
    (clean.endsWith(".ts") || clean.endsWith(".tsx")) &&
    !clean.endsWith(".d.ts")
  );
}

function anyProdTargetNeedsTranspilation(target) {
  if (isRawTypeScriptFile(target)) {
    return true;
  }

  if (Array.isArray(target)) {
    return target.some(anyProdTargetNeedsTranspilation);
  }

  if (typeof target !== "object" || target === null) {
    return false;
  }

  const keys = Object.keys(target);
  const isSubpathMap =
    keys.length > 0 && keys.every((key) => key === "." || key.startsWith("./"));
  if (isSubpathMap) {
    return Object.values(target).some(anyProdTargetNeedsTranspilation);
  }

  for (const [condition, value] of Object.entries(target)) {
    if (condition === "development" || condition === "types") {
      continue;
    }
    if (anyProdTargetNeedsTranspilation(value)) {
      return true;
    }
  }

  return false;
}

/** @returns {string} Absolute path to repo root */
function findRepoRoot(dir) {
  let current = resolve(dir);
  while (true) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      );
      if (pkg.workspaces) {
        return current;
      }
    } catch {
      // Continue searching
    }

    const parent = resolve(current, "..");
    if (parent === current) {
      break;
    }
    current = parent;
  }
  throw new Error("Could not find repo root with workspaces");
}
