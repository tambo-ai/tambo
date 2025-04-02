import chalk from "chalk";
import deepEqual from "deep-equal";
import deepmerge from "deepmerge";
import fs from "fs";
import path from "path";
import type { Root } from "postcss";
import postcss from "postcss";
import type { Config } from "tailwindcss";
import { Project, ScriptKind, SyntaxKind } from "ts-morph";
import { fileURLToPath } from "url";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
function parseConfigObject(sourceFile: string, configName: string): Config {
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

/**
 * Ensures a CSS section exists and updates its variables
 * @param baseLayer The base layer AtRule to modify
 * @param selector CSS selector for the section
 * @param variables Map of CSS variables to add/update
 */
function ensureSection(
  baseLayer: postcss.AtRule,
  selector: string,
  variables: Map<string, string>,
) {
  let sectionRule = baseLayer.nodes?.find(
    (node): node is postcss.Rule =>
      node.type === "rule" && node.selector === selector,
  );

  if (!sectionRule) {
    sectionRule = postcss.rule({
      selector: selector,
      raws: { before: "\n  ", after: "\n" },
    });
    baseLayer.append(sectionRule);
  }

  variables.forEach((value, prop) => {
    if (
      !sectionRule.nodes?.some(
        (node) => node.type === "decl" && node.prop === prop,
      )
    ) {
      sectionRule.append(
        postcss.decl({
          prop,
          value,
          raws: { before: "\n    ", between: ": " },
        }),
      );
    }
  });
}

/**
 * Sets up Tailwind CSS and global styles for the project
 * @param projectRoot The root directory of the project
 */
export async function setupTailwindandGlobals(projectRoot: string) {
  const tailwindConfigPath = path.join(projectRoot, "tailwind.config.ts");

  // Detect if src directory exists
  const hasSrcDir = fs.existsSync(path.join(projectRoot, "src"));
  const appPath = hasSrcDir ? "src/app" : "app";

  // Create app directory if it doesn't exist
  const fullAppPath = path.join(projectRoot, appPath);
  fs.mkdirSync(fullAppPath, { recursive: true });

  // Set globals.css path based on project structure
  const globalsPath = path.join(projectRoot, appPath, "globals.css");

  const registryPath = path.join(__dirname, "../../../src/registry");
  const defaultTailwindConfig = path.join(
    registryPath,
    "config",
    "tailwind.config.ts",
  );
  const defaultGlobalsCSS = path.join(registryPath, "config", "globals.css");

  // Initialize flags to track if updates are needed
  let configUpdated = false;
  let globalsUpdated = false;

  // Handle tailwind.config.ts
  if (!fs.existsSync(tailwindConfigPath)) {
    fs.copyFileSync(defaultTailwindConfig, tailwindConfigPath);
    console.log(`${chalk.green("✔")} Created tailwind.config.ts`);
  } else {
    // Create a new TypeScript project
    const project = new Project({
      skipFileDependencyResolution: true,
      compilerOptions: { allowJs: true },
    });

    // Add both config files to the project
    const existingConfigFile = project.createSourceFile(
      "existing.ts",
      fs.readFileSync(tailwindConfigPath, "utf-8"),
      { scriptKind: ScriptKind.TS },
    );

    const defaultConfigFile = project.createSourceFile(
      "default.ts",
      fs.readFileSync(defaultTailwindConfig, "utf-8"),
      { scriptKind: ScriptKind.TS },
    );

    // Extract config objects
    const existingConfig = existingConfigFile
      .getVariableDeclaration("config")
      ?.getInitializer()
      ?.getText();

    const defaultConfig = defaultConfigFile
      .getVariableDeclaration("config")
      ?.getInitializer()
      ?.getText();

    if (existingConfig && defaultConfig) {
      try {
        const existing = parseConfigObject(existingConfig, "existing");
        const defaults = parseConfigObject(defaultConfig, "default");

        // Deep merge the configurations, with existing taking precedence
        const merged = deepmerge(defaults, existing, {
          arrayMerge: (target, source) => [...new Set([...target, ...source])],
        }) as Config;

        // Update the theme colors specifically
        if (defaults.theme?.colors) {
          merged.theme ??= {};
          merged.theme.colors = {
            ...merged.theme.colors,
            ...defaults.theme.colors,
          };
        }

        // Write back the merged config with error handling
        const formattedConfig = `import type { Config } from 'tailwindcss'

const config: Config = ${JSON.stringify(merged, null, 2)}

export default config`;

        // Only update and log if there were actual changes
        if (!deepEqual(existing, merged)) {
          try {
            // Create backup of existing config
            if (fs.existsSync(tailwindConfigPath)) {
              fs.copyFileSync(
                tailwindConfigPath,
                `${tailwindConfigPath}.backup`,
              );
            }

            // Write new config
            fs.writeFileSync(tailwindConfigPath, formattedConfig);
            configUpdated = true;

            // Remove backup if successful
            if (fs.existsSync(`${tailwindConfigPath}.backup`)) {
              fs.unlinkSync(`${tailwindConfigPath}.backup`);
            }
          } catch (error) {
            // Restore from backup if available
            if (fs.existsSync(`${tailwindConfigPath}.backup`)) {
              fs.copyFileSync(
                `${tailwindConfigPath}.backup`,
                tailwindConfigPath,
              );
              fs.unlinkSync(`${tailwindConfigPath}.backup`);
            }
            throw error;
          }
        }
      } catch (error) {
        throw new Error(`Failed to merge configs: ${error}`);
      }
    }
  }

  if (configUpdated) {
    console.log(`${chalk.green("✔")} Updated tailwind.config.ts`);
  }

  // Handle globals.css
  fs.mkdirSync(path.dirname(globalsPath), { recursive: true });

  if (!fs.existsSync(globalsPath)) {
    fs.copyFileSync(defaultGlobalsCSS, globalsPath);
    console.log(`${chalk.green("✔")} Created globals.css`);
  } else {
    const existingCSS = fs.readFileSync(globalsPath, "utf-8");
    const defaultCSS = fs.readFileSync(defaultGlobalsCSS, "utf-8");

    const existingRoot = postcss.parse(existingCSS);
    const defaultRoot = postcss.parse(defaultCSS);

    // Find or create the @layer base rule for our HSL variables
    let baseLayer = existingRoot.nodes.find(
      (node): node is postcss.AtRule =>
        node.type === "atrule" &&
        node.name === "layer" &&
        node.params === "base",
    );

    // If no base layer exists, create a new one
    if (!baseLayer) {
      baseLayer = postcss.atRule({
        name: "layer",
        params: "base",
        raws: { before: "\n\n", after: "\n" },
      });
      existingRoot.append(baseLayer);
    }

    // Modify the root level variables to use HSL
    existingRoot.walkRules(":root", (rule) => {
      rule.walkDecls((decl) => {
        if (decl.prop === "--background" || decl.prop === "--foreground") {
          rule.removeChild(decl);
        }
      });
    });

    // Remove the media query for dark mode as we'll handle it through .dark class
    existingRoot.walkAtRules("media", (rule) => {
      if (rule.params.includes("prefers-color-scheme")) {
        existingRoot.removeChild(rule);
      }
    });

    // Extract and add HSL variables
    const extractVariables = (root: Root, selector: string) => {
      const vars = new Map<string, string>();
      root.walkAtRules("layer", (layer) => {
        if (layer.params === "base") {
          layer.walkRules(selector, (rule) => {
            rule.walkDecls((decl) => {
              if (decl.prop.startsWith("--") && decl.value.includes(" ")) {
                vars.set(decl.prop, decl.value);
              }
            });
          });
        }
      });
      return vars;
    };

    const defaultRootVars = extractVariables(defaultRoot, ":root");
    const defaultDarkVars = extractVariables(defaultRoot, ".dark");

    // Ensure both sections exist and have all required HSL variables
    ensureSection(baseLayer, ":root", defaultRootVars);
    ensureSection(baseLayer, ".dark", defaultDarkVars);

    // Add utilities layer if it doesn't exist
    let utilitiesLayer = existingRoot.nodes.find(
      (node): node is postcss.AtRule =>
        node.type === "atrule" &&
        node.name === "layer" &&
        node.params === "utilities" &&
        node.toString().includes("hsl(var(--"),
    );

    if (!utilitiesLayer) {
      utilitiesLayer = postcss.atRule({
        name: "layer",
        params: "utilities",
        raws: { before: "\n\n", after: "\n" },
      });
      existingRoot.append(utilitiesLayer);

      // Add utility classes using PostCSS API
      const addUtilityClass = (
        selector: string,
        prop: string,
        value: string,
      ) => {
        const rule = postcss.rule({ selector });
        rule.append(postcss.decl({ prop, value }));
        utilitiesLayer?.append(rule);
      };

      const utilityClasses = [
        {
          selector: ".bg-background",
          prop: "background-color",
          value: "hsl(var(--background))",
        },
        {
          selector: ".text-foreground",
          prop: "color",
          value: "hsl(var(--foreground))",
        },
        {
          selector: ".bg-card",
          prop: "background-color",
          value: "hsl(var(--card))",
        },
        {
          selector: ".text-card-foreground",
          prop: "color",
          value: "hsl(var(--card-foreground))",
        },
        {
          selector: ".bg-popover",
          prop: "background-color",
          value: "hsl(var(--popover))",
        },
        {
          selector: ".text-popover-foreground",
          prop: "color",
          value: "hsl(var(--popover-foreground))",
        },
        {
          selector: ".bg-primary",
          prop: "background-color",
          value: "hsl(var(--primary))",
        },
        {
          selector: ".text-primary-foreground",
          prop: "color",
          value: "hsl(var(--primary-foreground))",
        },
        {
          selector: ".bg-secondary",
          prop: "background-color",
          value: "hsl(var(--secondary))",
        },
        {
          selector: ".text-secondary-foreground",
          prop: "color",
          value: "hsl(var(--secondary-foreground))",
        },
        {
          selector: ".bg-muted",
          prop: "background-color",
          value: "hsl(var(--muted))",
        },
        {
          selector: ".text-muted-foreground",
          prop: "color",
          value: "hsl(var(--muted-foreground))",
        },
        {
          selector: ".bg-accent",
          prop: "background-color",
          value: "hsl(var(--accent))",
        },
        {
          selector: ".text-accent-foreground",
          prop: "color",
          value: "hsl(var(--accent-foreground))",
        },
        {
          selector: ".bg-destructive",
          prop: "background-color",
          value: "hsl(var(--destructive))",
        },
        {
          selector: ".text-destructive-foreground",
          prop: "color",
          value: "hsl(var(--destructive-foreground))",
        },
        {
          selector: ".border-border",
          prop: "border-color",
          value: "hsl(var(--border))",
        },
        {
          selector: ".bg-input",
          prop: "background-color",
          value: "hsl(var(--input))",
        },
        {
          selector: ".ring-ring",
          prop: "--tw-ring-color",
          value: "hsl(var(--ring))",
        },
        {
          selector: ".hover\\:bg-primary\\/90:hover",
          prop: "background-color",
          value: "hsl(var(--primary) / 0.9)",
        },
        {
          selector: ".hover\\:bg-muted\\/90:hover",
          prop: "background-color",
          value: "hsl(var(--muted) / 0.9)",
        },
      ];

      // Add all utility classes
      utilityClasses.forEach(({ selector, prop, value }) => {
        addUtilityClass(selector, prop, value);
      });
    }

    // Write updated CSS
    const updatedCSS = existingRoot.toString();

    // Only update if there were changes
    const originalContent = fs.readFileSync(globalsPath, "utf-8");

    if (originalContent !== updatedCSS) {
      fs.writeFileSync(globalsPath, updatedCSS);
      globalsUpdated = true;
    }
  }

  if (globalsUpdated) {
    console.log(`${chalk.green("✔")} Updated globals.css`);
  }
}
