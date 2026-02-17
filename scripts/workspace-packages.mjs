import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Resolves the transitive closure of workspace package dependencies for a given app.
 * @param {string} appDir - Absolute path to the app directory
 * @returns {string[]} - Array of workspace package names to transpile
 */
export function getWorkspaceTranspilePackages(appDir) {
  const repoRoot = findRepoRoot(appDir);
  const rootPkg = JSON.parse(
    readFileSync(join(repoRoot, "package.json"), "utf8"),
  );

  // Build name → dir map for all workspace packages
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
          workspaceMap.set(pkg.name, dir);
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
        try {
          const depPkg = JSON.parse(
            readFileSync(join(workspaceMap.get(dep), "package.json"), "utf8"),
          );
          collect(depPkg);
        } catch {
          // Skip unreadable packages
        }
      }
    }
  }

  collect(appPkg);
  result.delete(appPkg.name);
  return [...result];
}

/** @returns {string} Absolute path to repo root */
function findRepoRoot(dir) {
  let current = resolve(dir);
  while (current !== "/") {
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
    current = resolve(current, "..");
  }
  throw new Error("Could not find repo root with workspaces");
}
