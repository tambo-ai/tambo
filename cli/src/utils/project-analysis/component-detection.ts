import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Project, SyntaxKind, ts, type Node } from "ts-morph";
import type { ComponentInfo } from "./types.js";

const MAX_FILE_SIZE = 50 * 1024; // 50KB
const MAX_COMPONENTS = 50;

/**
 * Detects React components in specified directories that could become Tambo interactables.
 * Finds exported functional components with props and hook usage.
 *
 * @param componentsDirs - Array of absolute paths to component directories
 * @returns Array of component information, limited to 50 components max
 */
export function detectComponents(componentsDirs: string[]): ComponentInfo[] {
  const allComponents: ComponentInfo[] = [];

  for (const dir of componentsDirs) {
    // Create a fresh Project per directory to avoid AST memory leaks
    const components = detectComponentsInDirectory(dir);
    allComponents.push(...components);

    // Stop early if we've hit the limit
    if (allComponents.length >= MAX_COMPONENTS) {
      break;
    }
  }

  // Filter to only exported components and limit results
  return allComponents
    .filter((comp) => comp.isExported)
    .slice(0, MAX_COMPONENTS);
}

/**
 * Detects React components in a single directory.
 *
 * @param dir - Absolute path to directory to scan
 * @returns Array of component information
 */
function detectComponentsInDirectory(dir: string): ComponentInfo[] {
  const files = findComponentFiles(dir);
  const components: ComponentInfo[] = [];

  // Create a fresh Project for this directory
  const project = new Project({
    skipFileDependencyResolution: true,
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
    },
  });

  for (const filePath of files) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath);
      const fileComponents = extractComponentsFromFile(sourceFile, filePath);
      components.push(...fileComponents);
    } catch {
      // Skip files that fail to parse
      continue;
    }
  }

  return components;
}

/**
 * Finds all component files in a directory recursively.
 * Filters out test files, story files, type definition files, and large files.
 *
 * @param dir - Directory to search
 * @returns Array of absolute file paths
 */
function findComponentFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findComponentFiles(fullPath));
        continue;
      }

      // Only process component files
      if (!isComponentFile(entry.name)) {
        continue;
      }

      // Skip files that are too large (likely generated/bundled)
      try {
        const stats = statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          continue;
        }
      } catch {
        continue;
      }

      files.push(fullPath);
    }
  } catch {
    // Skip directories that can't be read
    return [];
  }

  return files;
}

/**
 * Checks if a filename represents a component file.
 * Filters out test files, story files, and type definition files.
 *
 * @param filename - Name of file to check
 * @returns True if file should be processed
 */
function isComponentFile(filename: string): boolean {
  // Must be a React file
  if (!/\.(tsx|jsx|ts|js)$/.test(filename)) {
    return false;
  }

  // Skip test files
  if (/\.(test|spec)\.(tsx?|jsx?)$/.test(filename)) {
    return false;
  }

  // Skip story files
  if (/\.stories\.(tsx?|jsx?)$/.test(filename)) {
    return false;
  }

  // Skip type definition files
  if (filename.endsWith(".d.ts")) {
    return false;
  }

  return true;
}

/**
 * Extracts component information from a source file.
 *
 * @param sourceFile - TypeScript source file to analyze
 * @param filePath - Absolute path to the file
 * @returns Array of component information found in the file
 */
function extractComponentsFromFile(
  sourceFile: ReturnType<Project["addSourceFileAtPath"]>,
  filePath: string,
): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  // Find function declarations that are React components
  const functionDeclarations = sourceFile.getFunctions();
  for (const func of functionDeclarations) {
    const name = func.getName();

    // Must start with uppercase to be a component
    if (!name || !isUpperCase(name[0])) {
      continue;
    }

    // Must return JSX
    if (!hasJsxReturn(func)) {
      continue;
    }

    const isExported = func.isExported();
    const params = func.getParameters();
    const hasProps = params.length > 0;
    const propsInterface = hasProps
      ? params[0]?.getTypeNode()?.getText()
      : undefined;
    const hooks = extractHooks(func);
    const description = extractJsDocDescription(func);

    components.push({
      name,
      filePath,
      isExported,
      hasProps,
      propsInterface,
      hooks,
      description,
    });
  }

  // Find variable declarations that are React components
  const variableDeclarations = sourceFile.getVariableDeclarations();
  for (const varDecl of variableDeclarations) {
    const name = varDecl.getName();

    // Must start with uppercase to be a component
    if (!isUpperCase(name[0])) {
      continue;
    }

    const initializer = varDecl.getInitializer();
    if (!initializer) {
      continue;
    }

    // Check if it's typed as React.FC or FC<>
    const typeNode = varDecl.getTypeNode();
    const isReactFC = typeNode?.getText().includes("FC") ?? false;

    // Check if initializer is arrow function with JSX
    const isArrowFunction = initializer.getKind() === SyntaxKind.ArrowFunction;
    const hasJsx = isArrowFunction && hasJsxInBody(initializer);

    // Must be either typed as FC or an arrow function with JSX
    if (!isReactFC && !hasJsx) {
      continue;
    }

    const isExported = varDecl.getVariableStatement()?.isExported() ?? false;
    const arrowFunc = initializer.asKind(SyntaxKind.ArrowFunction);
    const params = arrowFunc?.getParameters() ?? [];
    const hasProps = params.length > 0;

    // For FC-typed components, extract generic type param for props interface
    let propsInterface: string | undefined;
    if (hasProps) {
      if (isReactFC && typeNode) {
        // Extract generic from FC<PropsType>
        const typeText = typeNode.getText();
        const genericMatch = /FC<([^>]+)>/.exec(typeText);
        propsInterface = genericMatch?.[1];
      }

      // Fall back to parameter type annotation if not FC or no generic found
      propsInterface ??= params[0]?.getTypeNode()?.getText();
    }

    const hooks = extractHooks(initializer);
    const variableStatement = varDecl.getVariableStatement();
    const description = variableStatement
      ? extractJsDocDescription(variableStatement)
      : undefined;

    components.push({
      name,
      filePath,
      isExported,
      hasProps,
      propsInterface,
      hooks,
      description,
    });
  }

  return components;
}

/**
 * Checks if a character is uppercase.
 *
 * @param char - Character to check
 * @returns True if character is uppercase
 */
function isUpperCase(char: string): boolean {
  return char === char.toUpperCase() && char !== char.toLowerCase();
}

/**
 * Checks if a function has a JSX return statement.
 *
 * @param func - Function node to check
 * @returns True if function returns JSX
 */
function hasJsxReturn(func: Node): boolean {
  const returnStatements = func.getDescendantsOfKind(
    SyntaxKind.ReturnStatement,
  );

  for (const returnStmt of returnStatements) {
    const expr = returnStmt.getExpression();
    if (!expr) {
      continue;
    }

    // Check if the expression itself is JSX
    const kind = expr.getKind();
    if (
      kind === SyntaxKind.JsxElement ||
      kind === SyntaxKind.JsxFragment ||
      kind === SyntaxKind.JsxSelfClosingElement
    ) {
      return true;
    }

    // Also check descendants for JSX
    if (hasJsxNode(expr)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a node body contains JSX.
 *
 * @param node - Node to check
 * @returns True if node contains JSX
 */
function hasJsxInBody(node: Node): boolean {
  return hasJsxNode(node);
}

/**
 * Checks if a node or its descendants contain JSX elements.
 *
 * @param node - Node to check
 * @returns True if JSX is found
 */
function hasJsxNode(node: Node): boolean {
  const jsxElements = node.getDescendantsOfKind(SyntaxKind.JsxElement);
  const jsxFragments = node.getDescendantsOfKind(SyntaxKind.JsxFragment);
  const jsxSelfClosing = node.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  );

  return (
    jsxElements.length > 0 ||
    jsxFragments.length > 0 ||
    jsxSelfClosing.length > 0
  );
}

/**
 * Extracts JSDoc description from a function or variable statement.
 *
 * @param node - Node with potential JSDoc comments
 * @returns The description text, or undefined if no JSDoc exists
 */
function extractJsDocDescription(node: {
  getJsDocs(): { getDescription(): string }[];
}): string | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length === 0) {
    return undefined;
  }

  const description = jsDocs[0]?.getDescription().trim();
  return description || undefined;
}

/**
 * Extracts React hooks used within a component.
 * Finds all call expressions matching the pattern /^use[A-Z]/.
 *
 * @param node - Component node to analyze
 * @returns Array of hook names used in the component
 */
function extractHooks(node: Node): string[] {
  const hooks = new Set<string>();
  const callExpressions = node.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const call of callExpressions) {
    const expr = call.getExpression();
    const text = expr.getText();

    // Match hook pattern: use[A-Z]
    if (/^use[A-Z]/.test(text)) {
      hooks.add(text);
    }
  }

  return Array.from(hooks).sort();
}
