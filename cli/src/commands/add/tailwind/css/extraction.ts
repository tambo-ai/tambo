import fs from "fs";
import path from "path";
import type { Root } from "postcss";
import postcss from "postcss";
import semver from "semver";
import { getRegistryBasePath } from "../../utils.js";

/**
 * Extracts CSS variables from a specific selector in a CSS file
 * @param cssFilePath Path to the CSS file
 * @param selector The CSS selector to extract variables from (e.g., ":root", ".dark")
 * @returns Map of CSS variables and their values
 */
export function extractVariablesFromCSS(
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
export function getTailwindVariables(version: string | null): {
  rootVars: Map<string, string>;
  darkVars: Map<string, string>;
} {
  const isV4 = version && semver.gte(version, "4.0.0");
  const registryPath = getRegistryBasePath();

  // Choose the appropriate CSS file based on version
  const cssFile = isV4
    ? path.join(registryPath, "styles", "globals-v4.css")
    : path.join(registryPath, "styles", "globals-v3.css");

  // Extract variables from the registry CSS file
  const rootVars = extractVariablesFromCSS(cssFile, ":root");
  const darkVars = extractVariablesFromCSS(cssFile, ".dark");

  return { rootVars, darkVars };
}

/**
 * Extracts utilities from @layer utilities section
 */
export function extractUtilitiesFromLayer(cssFilePath: string): postcss.Rule[] {
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
 * Extracts @theme blocks from CSS
 */
export function extractThemeBlocks(root: Root): Map<string, string> {
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
export function extractVariants(root: Root): Map<string, string> {
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
export function extractUtilities(root: Root): Map<string, postcss.AtRule> {
  const utilities = new Map<string, postcss.AtRule>();

  root.walkAtRules("utility", (rule) => {
    const utilityName = rule.params.trim();
    utilities.set(utilityName, rule);
  });

  return utilities;
}

/**
 * Extracts @custom-variant definitions from CSS (v4 syntax)
 */
export function extractCustomVariants(root: Root): Map<string, string> {
  const customVariants = new Map<string, string>();

  root.walkAtRules("custom-variant", (rule) => {
    const [name, ...definition] = rule.params.split(" ");
    customVariants.set(name, definition.join(" "));
  });

  return customVariants;
}

/**
 * Extracts all v4 configuration from registry file
 */
export function extractV4Configuration(cssFilePath: string): {
  variables: Map<string, string>;
  darkVariables: Map<string, string>;
  themeVars: Map<string, string>;
  variants: Map<string, string>;
  customVariants: Map<string, string>;
  utilities: Map<string, postcss.AtRule>;
} {
  const cssContent = fs.readFileSync(cssFilePath, "utf-8");
  const root = postcss.parse(cssContent);

  return {
    variables: extractVariablesFromCSS(cssFilePath, ":root"),
    darkVariables: extractVariablesFromCSS(cssFilePath, ".dark"),
    themeVars: extractThemeBlocks(root),
    variants: extractVariants(root),
    customVariants: extractCustomVariants(root),
    utilities: extractUtilities(root),
  };
}
