import type { Config } from "tailwindcss";
import { Project, ScriptKind, SyntaxKind } from "ts-morph";

/**
 * Parses a TypeScript configuration object into a plain JavaScript object.
 * This function handles complex TypeScript syntax including:
 * - Object literal expressions
 * - Array literals
 * - Type assertions
 * - Nested objects and arrays
 *
 * @param sourceFile - The TypeScript source code containing the config object
 * @param configName - Name of the config for error reporting (e.g. "default" or "existing")
 * @returns Parsed configuration object as a plain JavaScript object
 * @throws Error if parsing fails or if required properties are missing
 */
export function parseConfigObject(
  sourceFile: string,
  configName: string,
): Config {
  try {
    // Create a temporary source file to parse the config object
    const tempProject = new Project({
      skipFileDependencyResolution: true,
      compilerOptions: {
        allowJs: true,
        strict: true,
      },
    });

    const tempFile = tempProject.createSourceFile(
      "temp.ts",
      `const parsed = ${sourceFile}`,
      { scriptKind: ScriptKind.TS },
    );

    const initializer = tempFile
      .getVariableDeclaration("parsed")
      ?.getInitializer();

    if (!initializer) {
      throw new Error(`Invalid config structure in ${configName}`);
    }

    // Validate it's an object literal expression
    if (initializer.getKind() !== SyntaxKind.ObjectLiteralExpression) {
      throw new Error(`Config in ${configName} must be an object literal`);
    }

    // Convert the object literal to a plain object using ts-morph
    const objectLiteral = initializer.asKind(
      SyntaxKind.ObjectLiteralExpression,
    );
    if (!objectLiteral) {
      throw new Error(`Failed to parse config object in ${configName}`);
    }

    const result: Record<string, unknown> = {};

    // Iterate through all properties in the object literal (e.g. content, theme, plugins, etc.)
    // Each property could be a simple value, object, array, or use TypeScript-specific syntax
    for (const property of objectLiteral.getProperties()) {
      // Handle normal property assignments (e.g. content: ['./src/**/*.{js,ts,jsx,tsx}'])
      if (property.getKind() === SyntaxKind.PropertyAssignment) {
        const propAssignment = property.asKind(SyntaxKind.PropertyAssignment);
        if (propAssignment) {
          // Extract the property name, removing any quotes if present
          const name = propAssignment.getName().replace(/^["']|["']$/g, "");
          const initializer = propAssignment.getInitializer();
          if (initializer) {
            try {
              // Case 1: Nested object literals (e.g. theme: { colors: { ... } })
              if (
                initializer.getKind() === SyntaxKind.ObjectLiteralExpression
              ) {
                // Recursively parse nested objects
                result[name] = parseConfigObject(
                  initializer.getText(),
                  `${configName}.${name}`,
                );
              }
              // Case 2: Array literals (e.g. content: ['./src/**/*.{js,ts}'])
              else if (
                initializer.getKind() === SyntaxKind.ArrayLiteralExpression
              ) {
                const arrayLiteral = initializer.asKind(
                  SyntaxKind.ArrayLiteralExpression,
                );
                if (arrayLiteral) {
                  // Map over array elements, handling both objects and primitives
                  result[name] = arrayLiteral.getElements().map((element) => {
                    // If array contains objects, recursively parse them
                    if (
                      element.getKind() === SyntaxKind.ObjectLiteralExpression
                    ) {
                      return parseConfigObject(
                        element.getText(),
                        `${configName}.${name}[]`,
                      );
                    }
                    // For primitive array elements, handle string literals
                    const text = element.getText();
                    return text.startsWith('"') || text.startsWith("'")
                      ? text.slice(1, -1) // Remove quotes from strings
                      : text; // Keep as is for other primitives
                  });
                }
              }
              // Case 3: Spread elements (e.g. ...otherConfig)
              // These are TypeScript-specific and not valid in plain JSON
              else if (initializer.getKind() === SyntaxKind.SpreadElement) {
                continue;
              }
              // Case 4: Type assertions (e.g. colors as const)
              // Need to extract the actual value from the type assertion
              else if (initializer.getKind() === SyntaxKind.AsExpression) {
                const asExpression = initializer.asKind(
                  SyntaxKind.AsExpression,
                );
                const text = asExpression?.getExpression().getText() ?? "";
                result[name] =
                  text.startsWith('"') || text.startsWith("'")
                    ? text.slice(1, -1) // Remove quotes from strings
                    : text; // Keep as is for other primitives
              }
              // Case 5: All other primitive values (strings, numbers, booleans)
              else {
                const text = initializer.getText();
                result[name] =
                  text.startsWith('"') || text.startsWith("'")
                    ? text.slice(1, -1) // Remove quotes from strings
                    : text; // Keep as is for other primitives
              }
            } catch (error) {
              // If parsing a property fails, log a warning and skip it
              // This allows the rest of the config to be processed
              console.warn(
                `Warning: Skipping property "${name}" due to parsing error ${error}`,
              );
              continue;
            }
          }
        }
      }
      // Handle spread assignments (e.g. ...spreadConfig)
      // These are TypeScript-specific and not valid in plain JSON
      else if (property.getKind() === SyntaxKind.SpreadAssignment) {
        continue;
      }
    }

    // Validate essential Tailwind config properties
    if (!result.content && configName === "default") {
      throw new Error("Default Tailwind config must specify content paths");
    }

    return result as Config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse ${configName} config: ${error.message}`);
    }
    throw new Error(`Unknown error parsing ${configName} config`);
  }
}
