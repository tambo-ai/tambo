/**
 * Verifies the component registry integrity.
 *
 * This module is intended to be imported by both:
 * - The CLI entrypoint (`verify-exports.ts`)
 * - Unit tests
 *
 * Keep it side-effect free (no `process.exit`, no top-level `main()` call).
 */

import fs from "node:fs";
import path from "node:path";

export const PACKAGE_ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(PACKAGE_ROOT, "src");
export const COMPONENTS_DIR = path.join(SRC_DIR, "components");

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

function extractComponentImportsFromSource(content: string): string[] {
  const matches = content.matchAll(
    /@tambo-ai\/ui-registry\/components\/([a-z0-9-]+)/gi,
  );

  const referencedComponents: string[] = [];
  for (const match of matches) {
    const componentName = match[1];
    if (componentName) referencedComponents.push(componentName);
  }

  return referencedComponents;
}

function stripKnownScriptExtension(importPath: string): string {
  // Allow ESM-style TS authoring (e.g. `import "./foo.js"`) while resolving
  // to existing TS sources on disk.
  return importPath.replace(/\.(?:[cm]?[jt]sx?)$/i, "");
}

function resolveRelativeImportPath(params: {
  fileDir: string;
  importPath: string;
}): string | null {
  const normalized = stripKnownScriptExtension(params.importPath);
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx"];

  for (const ext of extensions) {
    const fullPath = path.resolve(params.fileDir, normalized + ext);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }

    const indexPath = path.resolve(params.fileDir, normalized, `index${ext}`);
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return indexPath;
    }
  }

  return null;
}

function findReferencedComponentFromResolvedPath(params: {
  resolvedPath: string;
  componentsDir: string;
  ownComponentName: string;
}): string | null {
  const relativeToComponents = path.relative(
    params.componentsDir,
    params.resolvedPath,
  );

  // If it doesn't live under `componentsDir`, it's not a component-to-component
  // dependency.
  if (relativeToComponents.startsWith("..")) {
    return null;
  }

  const [componentName] = relativeToComponents.split(path.sep);

  if (!componentName) return null;
  if (componentName === params.ownComponentName) return null;
  if (componentName === "lib" || componentName === "base") return null;

  return componentName;
}

/**
 * Validates a single component for missing requires.
 *
 * We check both:
 * - `config.files[].content` path references (templated registry paths)
 * - Actual TS/TSX file contents (imports / cross-component relative imports)
 */
export function validateComponentRequires(
  componentName: string,
  knownComponents: Set<string>,
  componentsDir: string = COMPONENTS_DIR,
): MissingRequiresError[] {
  const errors: MissingRequiresError[] = [];
  const seen = new Set<string>();
  const configPath = path.join(componentsDir, componentName, "config.json");

  if (!fs.existsSync(configPath)) {
    return errors;
  }

  const config: ComponentConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8"),
  );
  const requires = new Set(config.requires ?? []);
  const componentDir = path.join(componentsDir, componentName);

  const pushError = (referencedComponent: string, fileName: string): void => {
    if (!knownComponents.has(referencedComponent)) return;
    if (requires.has(referencedComponent)) return;

    const key = `${fileName}:${referencedComponent}`;
    if (seen.has(key)) return;
    seen.add(key);

    errors.push({
      component: componentName,
      referencedComponent,
      file: fileName,
    });
  };

  for (const file of config.files) {
    if (file.content) {
      const referencedComponent = extractComponentFromPath(
        file.content,
        componentName,
      );
      if (referencedComponent) {
        pushError(referencedComponent, file.name);
      }
    }

    if (!file.name.endsWith(".ts") && !file.name.endsWith(".tsx")) {
      continue;
    }

    const filePath = path.join(componentDir, file.name);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");

    // 1) Package imports like `@tambo-ai/ui-registry/components/<name>`
    for (const referencedComponent of extractComponentImportsFromSource(
      fileContent,
    )) {
      pushError(referencedComponent, file.name);
    }

    // 2) Cross-component relative imports that escape the component directory
    const relativeImports = extractRelativeImports(fileContent);
    const fileDir = path.dirname(filePath);

    for (const importPath of relativeImports) {
      const resolvedPath = resolveRelativeImportPath({ fileDir, importPath });
      if (!resolvedPath) continue;

      const referencedComponent = findReferencedComponentFromResolvedPath({
        resolvedPath,
        componentsDir,
        ownComponentName: componentName,
      });
      if (referencedComponent) {
        pushError(referencedComponent, file.name);
      }
    }
  }

  return errors;
}

// ============================================================================
// Relative Import Verification
// ============================================================================

/**
 * Extracts relative import paths from TypeScript/TSX content.
 *
 * Intentionally lightweight (regex-based), but covers the key TS/ESM edges:
 * - `import ... from "./x"`
 * - `import "./x"`
 * - `export * from "./x"` / `export { a } from "./x"`
 * - `import("./x")`
 */
export function extractRelativeImports(content: string): string[] {
  const patterns = [
    /import\s+(?:type\s+)?(?:[^'";]*\s+from\s+)?['"](\.[^'"]+)['"]/g,
    /export\s+(?:\*|\{[^}]*\})\s+from\s+['"](\.[^'"]+)['"]/g,
    /import\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  ];

  const imports: string[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const importPath = match[1];
      if (!importPath || seen.has(importPath)) continue;
      seen.add(importPath);
      imports.push(importPath);
    }
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
      const resolvedPath = resolveRelativeImportPath({ fileDir, importPath });
      if (!resolvedPath) {
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
