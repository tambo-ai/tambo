#!/usr/bin/env npx tsx
/**
 * Verifies the component registry integrity.
 *
 * This script ensures:
 * 1. All exports in package.json point to files that exist
 * 2. All component directories have a corresponding export
 * 3. Components that reference other components list them in `requires`
 * 4. All relative imports in component files can be resolved
 *
 * Run this in CI to prevent drift between exports, filesystem, and dependencies.
 */

import fs from "node:fs";
import path from "node:path";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(PACKAGE_ROOT, "src");
const COMPONENTS_DIR = path.join(SRC_DIR, "components");

// Note: This interface only covers the exports field we need.
// The actual package.json has many more fields that we ignore here.
interface PackageJson {
  exports?: Record<string, string>;
}

interface FileEntry {
  name: string;
  content?: string;
}

interface ComponentConfig {
  name: string;
  requires?: string[];
  files: FileEntry[];
}

export interface MissingRequiresError {
  component: string;
  referencedComponent: string;
  file: string;
}

export interface UnresolvedImportError {
  component: string;
  file: string;
  importPath: string;
}

// ============================================================================
// Export Verification
// ============================================================================

export function getPackageExports(
  packageRoot: string = PACKAGE_ROOT,
): Map<string, string> {
  const packageJsonPath = path.join(packageRoot, "package.json");
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf-8"),
  );

  if (!packageJson.exports) {
    throw new Error("No exports field found in package.json");
  }

  return new Map(Object.entries(packageJson.exports));
}

export function getComponentDirectories(
  componentsDir: string = COMPONENTS_DIR,
): string[] {
  if (!fs.existsSync(componentsDir)) {
    return [];
  }

  return fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

export function verifyExportsPointToFiles(
  exports: Map<string, string>,
  packageRoot: string = PACKAGE_ROOT,
): string[] {
  const errors: string[] = [];

  for (const [exportPath, filePath] of exports) {
    // TODO: Remove this exception when base components are moved to their own package
    // This is a temporary workaround to avoid false positives in CI checks
    if (exportPath === "./base/*") continue;

    const fullPath = path.join(packageRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      errors.push(
        `Export "${exportPath}" points to non-existent file: ${filePath}`,
      );
    }
  }

  return errors;
}

export function verifyComponentsHaveExports(
  exports: Map<string, string>,
  components: string[],
): string[] {
  const errors: string[] = [];

  for (const component of components) {
    const expectedExport = `./components/${component}`;
    if (!exports.has(expectedExport)) {
      errors.push(
        `Component directory "${component}" has no corresponding export "${expectedExport}"`,
      );
    }
  }

  return errors;
}

// ============================================================================
// Component Requires Verification
// ============================================================================

/**
 * Extracts the component name from a content path.
 * Handles both legacy and new path formats:
 * - Legacy: "src/registry/component-name/file.tsx"
 * - New: "components/component-name/file.tsx"
 */
export function extractComponentFromPath(
  contentPath: string,
  ownComponentName: string,
): string | null {
  const parts = contentPath.split("/");

  // Handle legacy "src/registry/" prefix
  if (parts[0] === "src" && parts[1] === "registry") {
    const remainingParts = parts.slice(2);
    // Skip lib/base directories - these aren't component references
    if (remainingParts[0] === "lib" || remainingParts[0] === "base") {
      return null;
    }
    // The component name is the next part
    const componentName = remainingParts[0];
    if (componentName && componentName !== ownComponentName) {
      return componentName;
    }
  }

  // Handle "components/" prefix
  if (parts[0] === "components") {
    const componentName = parts[1];
    if (componentName && componentName !== ownComponentName) {
      return componentName;
    }
  }

  return null;
}

/**
 * Gets all component names from the registry
 */
export function getComponentNames(
  componentsDir: string = COMPONENTS_DIR,
): Set<string> {
  const components = new Set<string>();

  if (!fs.existsSync(componentsDir)) {
    return components;
  }

  const entries = fs.readdirSync(componentsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const configPath = path.join(componentsDir, entry.name, "config.json");
      if (fs.existsSync(configPath)) {
        components.add(entry.name);
      }
    }
  }

  return components;
}

/**
 * Validates a single component for missing requires
 */
export function validateComponentRequires(
  componentName: string,
  knownComponents: Set<string>,
  componentsDir: string = COMPONENTS_DIR,
): MissingRequiresError[] {
  const errors: MissingRequiresError[] = [];
  const configPath = path.join(componentsDir, componentName, "config.json");

  if (!fs.existsSync(configPath)) {
    return errors;
  }

  const config: ComponentConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8"),
  );
  const requires = new Set(config.requires ?? []);

  for (const file of config.files) {
    if (!file.content) continue;

    const referencedComponent = extractComponentFromPath(
      file.content,
      componentName,
    );

    if (
      referencedComponent &&
      knownComponents.has(referencedComponent) &&
      !requires.has(referencedComponent)
    ) {
      errors.push({
        component: componentName,
        referencedComponent,
        file: file.name,
      });
    }
  }

  return errors;
}

// ============================================================================
// Relative Import Verification
// ============================================================================

/**
 * Extracts relative import paths from TypeScript/TSX file content
 */
export function extractRelativeImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

/**
 * Validates that all relative imports in component files can be resolved
 */
export function validateRelativeImports(
  componentName: string,
  componentsDir: string = COMPONENTS_DIR,
): UnresolvedImportError[] {
  const errors: UnresolvedImportError[] = [];
  const componentDir = path.join(componentsDir, componentName);
  const configPath = path.join(componentDir, "config.json");

  if (!fs.existsSync(configPath)) {
    return errors;
  }

  const config: ComponentConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8"),
  );

  for (const file of config.files) {
    if (!file.name.endsWith(".ts") && !file.name.endsWith(".tsx")) {
      continue;
    }

    const filePath = path.join(componentDir, file.name);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const relativeImports = extractRelativeImports(fileContent);
    const fileDir = path.dirname(filePath);

    for (const importPath of relativeImports) {
      const extensions = ["", ".ts", ".tsx", ".js", ".jsx"];
      let resolved = false;

      for (const ext of extensions) {
        const fullPath = path.resolve(fileDir, importPath + ext);
        if (fs.existsSync(fullPath)) {
          resolved = true;
          break;
        }
        const indexPath = path.resolve(fileDir, importPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          resolved = true;
          break;
        }
      }

      if (!resolved) {
        errors.push({
          component: componentName,
          file: file.name,
          importPath,
        });
      }
    }
  }

  return errors;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  console.log("Verifying component registry...\n");

  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error(`Components directory not found: ${COMPONENTS_DIR}`);
    process.exit(1);
  }

  const exports = getPackageExports();
  const componentDirs = getComponentDirectories();
  const knownComponents = getComponentNames();

  const exportErrors: string[] = [
    ...verifyExportsPointToFiles(exports),
    ...verifyComponentsHaveExports(exports, componentDirs),
  ];

  const requiresErrors: MissingRequiresError[] = [];
  const importErrors: UnresolvedImportError[] = [];

  for (const componentName of knownComponents) {
    requiresErrors.push(
      ...validateComponentRequires(componentName, knownComponents),
    );
    importErrors.push(...validateRelativeImports(componentName));
  }

  let hasErrors = false;

  if (exportErrors.length > 0) {
    hasErrors = true;
    console.error("Export verification failed:\n");
    exportErrors.forEach((error) => console.error(`  - ${error}`));
    console.error("\n");
  }

  if (requiresErrors.length > 0) {
    hasErrors = true;
    console.error("Missing requires entries:\n");
    for (const error of requiresErrors) {
      console.error(
        `  ${error.component}/config.json: Missing "${error.referencedComponent}" in requires`,
      );
      console.error(
        `    File "${error.file}" references ${error.referencedComponent}\n`,
      );
    }
    console.error(
      `To fix: Add the missing component names to the "requires" array in each config.json\n`,
    );
  }

  if (importErrors.length > 0) {
    hasErrors = true;
    console.error("Unresolved relative imports:\n");
    for (const error of importErrors) {
      console.error(
        `  ${error.component}/${error.file}: Cannot resolve import '${error.importPath}'`,
      );
    }
    console.error(
      `\nTo fix: Ensure the imported files exist in the component directory\n`,
    );
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log(`All ${exports.size} exports verified`);
  console.log(`All ${componentDirs.length} components have exports`);
  console.log(`All ${knownComponents.size} components have valid requires`);
  console.log("\nVerification passed!");
}

// Only run main when executed directly (not when imported)
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("verify-exports.ts");

if (isMainModule) {
  main();
}
