import type { Root } from "postcss";
import postcss from "postcss";

/**
 * Checks if a CSS variable already exists in the stylesheet
 * @param root The PostCSS root to search in
 * @param selector The CSS selector to look for (e.g., ":root", ".dark")
 * @param variable The CSS variable to check for (e.g., "--background")
 * @returns Whether the variable exists
 */
export function cssVariableExists(
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
export function addVariables(
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
export function addVariablesToLayer(
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
 * Safely merges @theme blocks without overwriting user values
 */
export function mergeTheme(root: Root, newThemeVars: Map<string, string>) {
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
    const exists = themeRule.nodes?.some(
      (node): node is postcss.Declaration =>
        node.type === "decl" && node.prop === prop,
    );

    if (!exists) {
      themeRule.append(
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
export function addVariants(root: Root, newVariants: Map<string, string>) {
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
 * Safely adds missing utilities to @layer utilities
 */
export function addUtilities(root: Root, newUtilities: postcss.Rule[]) {
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
    const exists = utilitiesLayer.nodes?.some(
      (node): node is postcss.Rule =>
        node.type === "rule" && node.selector === newRule.selector,
    );

    if (!exists) {
      utilitiesLayer.append(newRule);
    }
  });
}

/**
 * Safely adds missing @custom-variant definitions (v4 syntax)
 */
export function addCustomVariants(
  root: Root,
  newCustomVariants: Map<string, string>,
) {
  newCustomVariants.forEach((definition, name) => {
    // Check if custom variant already exists
    const exists = root.nodes.some(
      (node): node is postcss.AtRule =>
        node.type === "atrule" &&
        node.name === "custom-variant" &&
        node.params.startsWith(name),
    );

    if (!exists) {
      const customVariantRule = postcss.atRule({
        name: "custom-variant",
        params: `${name} ${definition}`,
        raws: { before: "\n\n", after: "\n" }, // Added extra \n for blank line above
      });

      // Insert after @import statements, not at the end
      let insertAfter: postcss.Node | null = null;

      // Find the last @import statement
      root.walkAtRules("import", (rule) => {
        insertAfter = rule;
      });

      if (insertAfter) {
        // Insert right after the last @import
        root.insertAfter(insertAfter, customVariantRule);
      } else {
        // If no @import found, insert at the beginning
        root.prepend(customVariantRule);
      }
    }
  });
}
