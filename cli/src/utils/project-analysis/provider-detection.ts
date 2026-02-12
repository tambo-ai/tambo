import { existsSync } from "node:fs";
import { Project, SyntaxKind, ts, type Node } from "ts-morph";
import type { ProviderInfo } from "./types.js";

/**
 * Detects React Context provider components in a layout file using AST parsing.
 * Finds all JSX elements whose tag names end with "Provider" and extracts their
 * import sources and nesting levels.
 *
 * @param layoutFilePath - Absolute path to the layout file to analyze
 * @returns Array of provider information sorted by nesting level (outermost first)
 */
export function detectProviders(layoutFilePath: string): ProviderInfo[] {
  // Handle edge case: file doesn't exist
  if (!existsSync(layoutFilePath)) {
    return [];
  }

  // Create a new Project for AST parsing
  const project = new Project({
    skipFileDependencyResolution: true,
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
    },
  });

  // Add the layout file to the project
  const sourceFile = project.addSourceFileAtPath(layoutFilePath);

  const importMap = buildImportMap(sourceFile);

  // Find all JSX elements (both regular and self-closing)
  const jsxElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  // First pass: identify all provider elements
  const providerElements: {
    element: Node;
    tagName: string;
    importSource: string;
  }[] = [];

  for (const element of jsxElements) {
    const tagName = extractTagName(element);

    // Only process elements ending with "Provider"
    if (!tagName?.endsWith("Provider")) {
      continue;
    }

    const importSource = importMap.get(tagName);

    // Skip if we can't find the import source
    if (!importSource) {
      continue;
    }

    providerElements.push({ element, tagName, importSource });
  }

  // Second pass: calculate nesting levels relative to other providers
  const providers: ProviderInfo[] = providerElements.map(
    ({ element, tagName, importSource }) => {
      const nestingLevel = calculateProviderNestingLevel(
        element,
        providerElements,
      );

      return {
        name: tagName,
        importSource,
        filePath: layoutFilePath,
        nestingLevel,
      };
    },
  );

  // Sort by nesting level (outermost first)
  return providers.sort((a, b) => a.nestingLevel - b.nestingLevel);
}

/**
 * Builds a map of component names to their import sources.
 *
 * @param sourceFile - The source file to extract imports from
 * @returns Map of component names to import module specifiers
 */
function buildImportMap(
  sourceFile: ReturnType<Project["addSourceFileAtPath"]>,
): Map<string, string> {
  const importMap = new Map<string, string>();

  // Get all import declarations
  const imports = sourceFile.getImportDeclarations();

  for (const importDecl of imports) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // Handle named imports (e.g., import { ThemeProvider } from "next-themes")
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      importMap.set(name, moduleSpecifier);
    }

    // Handle default imports (e.g., import ThemeProvider from "next-themes")
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      const name = defaultImport.getText();
      importMap.set(name, moduleSpecifier);
    }

    // Handle namespace imports (e.g., import * as Theme from "next-themes")
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      const name = namespaceImport.getText();
      importMap.set(name, moduleSpecifier);
    }
  }

  return importMap;
}

/**
 * Extracts the tag name from a JSX element or self-closing element.
 *
 * @param element - The JSX element node
 * @returns The tag name or null if it cannot be extracted
 */
function extractTagName(element: Node): string | null {
  if (element.getKind() === SyntaxKind.JsxElement) {
    const openingElement = element
      .asKind(SyntaxKind.JsxElement)
      ?.getOpeningElement();
    return openingElement?.getTagNameNode().getText() ?? null;
  }

  if (element.getKind() === SyntaxKind.JsxSelfClosingElement) {
    return (
      element
        .asKind(SyntaxKind.JsxSelfClosingElement)
        ?.getTagNameNode()
        .getText() ?? null
    );
  }

  return null;
}

/**
 * Calculates the nesting level of a provider element by counting how many other
 * provider elements wrap it.
 *
 * @param element - The JSX element to calculate nesting for
 * @param allProviders - Array of all provider elements found in the file
 * @returns The nesting level (0 = root level, not wrapped by any other provider)
 */
function calculateProviderNestingLevel(
  element: Node,
  allProviders: { element: Node; tagName: string; importSource: string }[],
): number {
  let level = 0;
  let current = element.getParent();

  while (current) {
    // Check if this ancestor is one of the provider elements
    const isProviderAncestor = allProviders.some(
      (provider) => provider.element === current,
    );

    if (isProviderAncestor) {
      level++;
    }

    current = current.getParent();
  }

  return level;
}
