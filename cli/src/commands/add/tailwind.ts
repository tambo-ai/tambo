import chalk from "chalk";
import deepEqual from "deep-equal";
import deepmerge from "deepmerge";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import type { Root } from "postcss";
import postcss from "postcss";
import semver from "semver";
import type { Config } from "tailwindcss";
import { Project, ScriptKind, SyntaxKind } from "ts-morph";
import { fileURLToPath } from "url";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detects the Tailwind CSS version from package.json
 * @param projectRoot The root directory of the project
 * @returns The Tailwind CSS version or null if not found
 */
function detectTailwindVersion(projectRoot: string): string | null {
  try {
    const packageJsonPath = path.join(projectRoot, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const tailwindVersion =
      packageJson.dependencies?.tailwindcss ??
      packageJson.devDependencies?.tailwindcss;

    if (!tailwindVersion) {
      return null;
    }

    // Extract version number from version string (e.g., "^4.0.0" -> "4.0.0")
    const cleanVersion =
      semver.clean(tailwindVersion) ?? semver.coerce(tailwindVersion)?.version;

    return cleanVersion ?? null;
  } catch (error) {
    console.warn(`Warning: Could not detect Tailwind version: ${error}`);
    return null;
  }
}

/**
 * Extracts CSS variables from a specific selector in a CSS file
 * @param cssFilePath Path to the CSS file
 * @param selector The CSS selector to extract variables from (e.g., ":root", ".dark")
 * @returns Map of CSS variables and their values
 */
function extractVariablesFromCSS(
  cssFilePath: string,
  selector: string,
): Map<string, string> {
  const variables = new Map<string, string>();

  if (!fs.existsSync(cssFilePath)) {
    console.warn(`Warning: CSS file not found: ${cssFilePath}`);
    return variables;
  }

  try {
    const cssContent = fs.readFileSync(cssFilePath, "utf-8");
    const root = postcss.parse(cssContent);

    // Look for the selector in the CSS
    root.walkRules(selector, (rule) => {
      rule.walkDecls((decl) => {
        if (decl.prop.startsWith("--")) {
          variables.set(decl.prop, decl.value);
        }
      });
    });

    // For v3, also check inside @layer base
    root.walkAtRules("layer", (layer) => {
      if (layer.params === "base") {
        layer.walkRules(selector, (rule) => {
          rule.walkDecls((decl) => {
            if (decl.prop.startsWith("--")) {
              variables.set(decl.prop, decl.value);
            }
          });
        });
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not parse CSS file ${cssFilePath}: ${error}`);
  }

  return variables;
}

/**
 * Gets the appropriate CSS variables for the detected Tailwind version
 * @param version The Tailwind CSS version
 * @returns Object containing root and dark variables
 */
function getTailwindVariables(version: string | null): {
  rootVars: Map<string, string>;
  darkVars: Map<string, string>;
} {
  const isV4 = version && semver.gte(version, "4.0.0");
  const registryPath = path.join(__dirname, "../../../src/registry");

  // Choose the appropriate CSS file based on version
  const cssFile = isV4
    ? path.join(registryPath, "config", "globals-v4.css")
    : path.join(registryPath, "config", "globals-v3.css");

  // Extract variables from the registry CSS file
  const rootVars = extractVariablesFromCSS(cssFile, ":root");
  const darkVars = extractVariablesFromCSS(cssFile, ".dark");

  return { rootVars, darkVars };
}

/**
 * Checks if a CSS variable already exists in the stylesheet
 * @param root The PostCSS root to search in
 * @param selector The CSS selector to look for (e.g., ":root", ".dark")
 * @param variable The CSS variable to check for (e.g., "--background")
 * @returns Whether the variable exists
 */
function cssVariableExists(
  root: Root,
  selector: string,
  variable: string,
): boolean {
  let found = false;
  root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop === variable) {
        found = true;
      }
    });
  });
  return found;
}

/**
 * Safely adds CSS variables to a root without removing existing ones
 * @param root The PostCSS root to modify
 * @param selector The CSS selector (e.g., ":root", ".dark")
 * @param variables Map of variables to add
 */
function safelyAddVariables(
  root: Root,
  selector: string,
  variables: Map<string, string>,
) {
  let targetRule: postcss.Rule | null = null;

  // Find existing rule with the selector
  root.walkRules(selector, (rule) => {
    targetRule ??= rule;
  });

  // If no rule exists, create it
  if (!targetRule) {
    targetRule = postcss.rule({
      selector: selector,
      raws: { before: "\n  ", after: "\n" },
    });

    // Find the best place to insert it
    let insertAfter: postcss.Node | null = null;
    root.walkRules((rule) => {
      if (rule.selector === ":root" || rule.selector.startsWith(":root")) {
        insertAfter = rule;
      }
    });

    if (insertAfter) {
      root.insertAfter(insertAfter, targetRule);
    } else {
      root.append(targetRule);
    }
  }

  // Add only missing variables
  variables.forEach((value, prop) => {
    if (!cssVariableExists(root, selector, prop)) {
      targetRule!.append(
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
 * Safely adds CSS variables inside an @layer or @at-rule block
 */
function safelyAddVariablesToLayer(
  layer: postcss.AtRule,
  selector: string,
  variables: Map<string, string>,
) {
  let targetRule: postcss.Rule | null = null;

  // Find existing rule with the selector inside the layer
  layer.walkRules(selector, (rule) => {
    targetRule ??= rule;
  });

  // If no rule exists, create it inside the layer
  if (!targetRule) {
    targetRule = postcss.rule({
      selector: selector,
      raws: { before: "\n  ", after: "\n" },
    });
    layer.append(targetRule);
  }

  // Add only missing variables
  variables.forEach((value, prop) => {
    const exists = targetRule!.nodes?.some(
      (node): node is postcss.Declaration =>
        node.type === "decl" && node.prop === prop,
    );

    if (!exists) {
      targetRule!.append(
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
 * Safely merges @theme blocks without overwriting user values
 */
function safelyMergeTheme(root: Root, newThemeVars: Map<string, string>) {
  let themeRule = root.nodes.find(
    (node): node is postcss.AtRule =>
      node.type === "atrule" && node.name === "theme",
  );

  if (!themeRule) {
    themeRule = postcss.atRule({
      name: "theme",
      raws: { before: "\n\n", after: "\n" },
    });
    root.prepend(themeRule);
  }

  // Add only missing theme variables
  newThemeVars.forEach((value, prop) => {
    const exists = themeRule!.nodes?.some(
      (node): node is postcss.Declaration =>
        node.type === "decl" && node.prop === prop,
    );

    if (!exists) {
      themeRule!.append(
        postcss.decl({
          prop,
          value,
          raws: { before: "\n  ", between: ": " },
        }),
      );
    }
  });
}

/**
 * Safely adds missing @variant definitions
 */
function safelyAddVariants(root: Root, newVariants: Map<string, string>) {
  newVariants.forEach((definition, name) => {
    // Check if variant already exists
    const exists = root.nodes.some(
      (node): node is postcss.AtRule =>
        node.type === "atrule" &&
        node.name === "variant" &&
        node.params.startsWith(name),
    );

    if (!exists) {
      const variantRule = postcss.atRule({
        name: "variant",
        params: `${name} ${definition}`,
        raws: { before: "\n", after: "\n" },
      });
      root.append(variantRule);
    }
  });
}

/**
 * Extracts all v4 configuration from registry file
 */
function extractV4Configuration(cssFilePath: string): {
  variables: Map<string, string>;
  darkVariables: Map<string, string>;
  themeVars: Map<string, string>;
  variants: Map<string, string>;
  utilities: Map<string, postcss.AtRule>;
} {
  const cssContent = fs.readFileSync(cssFilePath, "utf-8");
  const root = postcss.parse(cssContent);

  return {
    variables: extractVariablesFromCSS(cssFilePath, ":root"),
    darkVariables: extractVariablesFromCSS(cssFilePath, ".dark"),
    themeVars: extractThemeBlocks(root),
    variants: extractVariants(root),
    utilities: extractUtilities(root),
  };
}

/**
 * Handles @theme inline blocks
 */
function handleInlineTheme(root: Root) {
  // Find existing @theme inline block
  let inlineThemeRule = root.nodes.find(
    (node): node is postcss.AtRule =>
      node.type === "atrule" &&
      node.name === "theme" &&
      node.params === "inline",
  );

  // If no inline theme block exists, create one
  if (!inlineThemeRule) {
    inlineThemeRule = postcss.atRule({
      name: "theme",
      params: "inline",
      raws: { before: "\n\n", after: "\n" },
    });
    root.prepend(inlineThemeRule);
  }

  // Define the standard color mappings for tambo components
  const colorMappings = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "border",
    "input",
    "ring",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
    "container",
    "backdrop",
    "muted-backdrop",
  ];

  // Add only missing color mappings
  colorMappings.forEach((color) => {
    const colorProp = `--color-${color}`;
    const colorValue = `var(--${color})`;

    // Check if this color mapping already exists
    const exists = inlineThemeRule!.nodes?.some(
      (node): node is postcss.Declaration =>
        node.type === "decl" && node.prop === colorProp,
    );

    if (!exists) {
      inlineThemeRule!.append(
        postcss.decl({
          prop: colorProp,
          value: colorValue,
          raws: { before: "\n  ", between: ": " },
        }),
      );
    }
  });
}

/**
 * Preserves user's @config directives
 */
function preserveConfigDirectives(root: Root) {
  // Don't interfere with user's @config directives
  root.walkAtRules("config", (rule) => {
    // Leave these untouched - they're user-defined JS config references
    // Example: @config "../../tailwind.config.js";

    // Just log that we found one for debugging
    console.log(`${chalk.blue("ℹ")} Found @config directive: ${rule.params}`);

    // We explicitly don't modify these - they're user's explicit config references
    // The user is using JS config in v4, which requires explicit loading
  });
}

/**
 * Extracts @theme blocks from CSS
 */
function extractThemeBlocks(root: Root): Map<string, string> {
  const themeVars = new Map<string, string>();

  root.walkAtRules("theme", (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith("--")) {
        themeVars.set(decl.prop, decl.value);
      }
    });
  });

  return themeVars;
}

/**
 * Extracts @variant definitions from CSS
 */
function extractVariants(root: Root): Map<string, string> {
  const variants = new Map<string, string>();

  root.walkAtRules("variant", (rule) => {
    const [name, ...definition] = rule.params.split(" ");
    variants.set(name, definition.join(" "));
  });

  return variants;
}

/**
 * Extracts @utility definitions from CSS
 */
function extractUtilities(root: Root): Map<string, postcss.AtRule> {
  const utilities = new Map<string, postcss.AtRule>();

  root.walkAtRules("utility", (rule) => {
    const utilityName = rule.params.trim();
    utilities.set(utilityName, rule);
  });

  return utilities;
}

/**
 * Extracts utilities from @layer utilities section for v3
 */
function extractUtilitiesFromLayer(cssFilePath: string): postcss.Rule[] {
  const utilities: postcss.Rule[] = [];

  if (!fs.existsSync(cssFilePath)) {
    return utilities;
  }

  try {
    const cssContent = fs.readFileSync(cssFilePath, "utf-8");
    const root = postcss.parse(cssContent);

    // Look for @layer utilities
    root.walkAtRules("layer", (layer) => {
      if (layer.params === "utilities") {
        layer.walkRules((rule) => {
          utilities.push(rule.clone());
        });
      }
    });
  } catch (error) {
    console.warn(
      `Warning: Could not extract utilities from ${cssFilePath}: ${error}`,
    );
  }

  return utilities;
}

/**
 * Safely adds missing utilities to @layer utilities
 */
function safelyAddUtilities(root: Root, newUtilities: postcss.Rule[]) {
  // Find existing @layer utilities
  let utilitiesLayer = root.nodes.find(
    (node): node is postcss.AtRule =>
      node.type === "atrule" &&
      node.name === "layer" &&
      node.params === "utilities",
  );

  // If no utilities layer exists, create one
  if (!utilitiesLayer) {
    utilitiesLayer = postcss.atRule({
      name: "layer",
      params: "utilities",
      raws: { before: "\n\n", after: "\n" },
    });
    root.append(utilitiesLayer);
  }

  // Add only missing utilities
  newUtilities.forEach((newRule) => {
    // Check if this utility already exists
    const exists = utilitiesLayer!.nodes?.some(
      (node): node is postcss.Rule =>
        node.type === "rule" && node.selector === newRule.selector,
    );

    if (!exists) {
      utilitiesLayer!.append(newRule);
    }
  });
}

/**
 * Sets up Tailwind CSS and global styles for the project
 * @param projectRoot The root directory of the project
 */
export async function setupTailwindandGlobals(projectRoot: string) {
  const tailwindConfigPath = path.join(projectRoot, "tailwind.config.ts");

  // Detect Tailwind version first
  const tailwindVersion = detectTailwindVersion(projectRoot);
  const isV4 = tailwindVersion && semver.gte(tailwindVersion, "4.0.0");

  if (tailwindVersion) {
    console.log(
      `${chalk.blue("ℹ")} Detected Tailwind CSS v${tailwindVersion}`,
    );
  } else {
    console.log(
      `${chalk.yellow("⚠")} Could not detect Tailwind CSS version, assuming v3`,
    );
  }

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

  // Choose the appropriate globals.css file based on Tailwind version
  const defaultGlobalsCSS = path.join(
    registryPath,
    "config",
    isV4 ? "globals-v4.css" : "globals-v3.css",
  );

  // Initialize flags to track if updates are needed
  let configUpdated = false;
  let globalsUpdated = false;

  // Only process tailwind.config.ts for v3 users
  if (!isV4) {
    // Handle tailwind.config.ts for v3
    if (!fs.existsSync(tailwindConfigPath)) {
      fs.copyFileSync(defaultTailwindConfig, tailwindConfigPath);
      console.log(`${chalk.green("✔")} Created tailwind.config.ts`);
    } else {
      // Merge logic for v3
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
            arrayMerge: (target, source) => [
              ...new Set([...target, ...source]),
            ],
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
  } else {
    // For v4, maybe just inform the user
    console.log(`${chalk.blue("ℹ")} Tailwind v4 uses CSS-first configuration`);
  }

  if (configUpdated) {
    console.log(`${chalk.green("✔")} Updated tailwind.config.ts`);
  }

  // Handle globals.css with careful preservation of user content
  fs.mkdirSync(path.dirname(globalsPath), { recursive: true });

  if (!fs.existsSync(globalsPath)) {
    // If no globals.css exists, create it from the appropriate template
    fs.copyFileSync(defaultGlobalsCSS, globalsPath);
    console.log(`${chalk.green("✔")} Created globals.css`);
  } else {
    // Existing globals.css - ask for permission before modifying
    const existingCSS = fs.readFileSync(globalsPath, "utf-8");
    const existingRoot = postcss.parse(existingCSS);

    // Get the appropriate variables for this Tailwind version from registry files
    const { rootVars, darkVars } = getTailwindVariables(tailwindVersion);

    // Ask user for confirmation before making CSS changes
    console.log(
      `\n${chalk.yellow("⚠")} Tambo needs to add CSS variables to your globals.css file.`,
    );
    console.log(
      `${chalk.blue("ℹ")} This will preserve your existing styles and only add missing variables.`,
    );

    const { proceedWithCss } = await inquirer.prompt({
      type: "confirm",
      name: "proceedWithCss",
      message: "Allow Tambo to modify your globals.css file?",
      default: true,
    });

    if (!proceedWithCss) {
      console.log(`\n${chalk.yellow("⚠")} CSS modifications skipped.`);

      // Check what variables would have been added
      let hasMissingVariables = false;
      const missingRootVars = new Map<string, string>();
      const missingDarkVars = new Map<string, string>();

      if (isV4) {
        // Extract all v4 configuration from registry
        const v4Config = extractV4Configuration(defaultGlobalsCSS);

        // Check for missing variables
        v4Config.variables.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ":root", prop)) {
            missingRootVars.set(prop, value);
            hasMissingVariables = true;
          }
        });

        v4Config.darkVariables.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ".dark", prop)) {
            missingDarkVars.set(prop, value);
            hasMissingVariables = true;
          }
        });

        // Check for missing theme mappings
        const hasInlineTheme = existingRoot.nodes.some(
          (node): node is postcss.AtRule =>
            node.type === "atrule" &&
            node.name === "theme" &&
            node.params === "inline",
        );

        if (!hasInlineTheme) {
          hasMissingVariables = true;
        }
      } else {
        // v3 - check for missing variables
        rootVars.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ":root", prop)) {
            missingRootVars.set(prop, value);
            hasMissingVariables = true;
          }
        });

        darkVars.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ".dark", prop)) {
            missingDarkVars.set(prop, value);
            hasMissingVariables = true;
          }
        });
      }

      if (hasMissingVariables) {
        console.log(
          `\n${chalk.blue("ℹ")} Missing CSS variables that tambo components need:`,
        );

        if (missingRootVars.size > 0) {
          console.log(`\n${chalk.bold("Missing :root variables:")}`);
          missingRootVars.forEach((value, prop) => {
            console.log(`  ${chalk.cyan(prop)}: ${chalk.gray(value)}`);
          });
        }

        if (missingDarkVars.size > 0) {
          console.log(`\n${chalk.bold("Missing .dark variables:")}`);
          missingDarkVars.forEach((value, prop) => {
            console.log(`  ${chalk.cyan(prop)}: ${chalk.gray(value)}`);
          });
        }

        if (isV4) {
          const hasInlineTheme = existingRoot.nodes.some(
            (node): node is postcss.AtRule =>
              node.type === "atrule" &&
              node.name === "theme" &&
              node.params === "inline",
          );

          if (!hasInlineTheme) {
            console.log(
              `\n${chalk.bold("Missing @theme inline block needed")}`,
            );
          }
        }

        console.log(
          `\n${chalk.blue("ℹ")} Setup guide: ${chalk.underline("https://tambo.co/docs")}`,
        );
      } else {
        console.log(
          `\n${chalk.green("✔")} All required CSS variables are already present in your globals.css!`,
        );
        console.log(
          `${chalk.blue("ℹ")} Your tambo components should work without any additional setup.`,
        );
      }

      return; // Exit early without making changes
    }

    // User confirmed, proceed with CSS modifications
    console.log(`${chalk.green("✔")} Proceeding with CSS modifications...`);

    // Check if user is using Tailwind v4 format and we have v4 variables
    if (isV4) {
      console.log(
        `${chalk.blue("ℹ")} Using Tailwind v4 CSS-first configuration`,
      );

      // Extract all v4 configuration from registry
      const v4Config = extractV4Configuration(defaultGlobalsCSS);

      // Preserve user's existing @config directives
      preserveConfigDirectives(existingRoot);

      // Handle @theme inline blocks
      handleInlineTheme(existingRoot);

      // Merge theme variables
      safelyMergeTheme(existingRoot, v4Config.themeVars);

      // Add missing CSS variables
      safelyAddVariables(existingRoot, ":root", v4Config.variables);
      safelyAddVariables(existingRoot, ".dark", v4Config.darkVariables);

      // Add missing variants
      safelyAddVariants(existingRoot, v4Config.variants);
    } else {
      // For v3, use the traditional approach with @layer base
      console.log(
        `${chalk.blue("ℹ")} Using Tailwind v3 format for CSS variables`,
      );

      // Find or create @layer base
      let baseLayer = existingRoot.nodes.find(
        (node): node is postcss.AtRule =>
          node.type === "atrule" &&
          node.name === "layer" &&
          node.params === "base",
      );

      if (!baseLayer) {
        baseLayer = postcss.atRule({
          name: "layer",
          params: "base",
          raws: { before: "\n\n", after: "\n" },
        });
        existingRoot.append(baseLayer);
      }

      // Add variables INSIDE the @layer base block
      // Add missing root variables
      safelyAddVariablesToLayer(baseLayer, ":root", rootVars);

      // Add missing dark variables
      safelyAddVariablesToLayer(baseLayer, ".dark", darkVars);

      // Handle utilities layer for v3
      const registryUtilities = extractUtilitiesFromLayer(defaultGlobalsCSS);
      safelyAddUtilities(existingRoot, registryUtilities);
    }

    // Write updated CSS only if there were changes
    const updatedCSS = existingRoot.toString();
    if (existingCSS !== updatedCSS) {
      // Create backup before making changes
      fs.writeFileSync(`${globalsPath}.backup`, existingCSS);

      try {
        fs.writeFileSync(globalsPath, updatedCSS);
        globalsUpdated = true;

        // Remove backup if successful
        fs.unlinkSync(`${globalsPath}.backup`);
      } catch (error) {
        // Restore from backup if write fails
        fs.copyFileSync(`${globalsPath}.backup`, globalsPath);
        fs.unlinkSync(`${globalsPath}.backup`);
        throw error;
      }
    }
  }

  if (globalsUpdated) {
    console.log(
      `${chalk.green("✔")} Updated globals.css (preserved existing content)`,
    );
  }
}
