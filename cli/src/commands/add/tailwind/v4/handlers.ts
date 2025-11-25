import chalk from "chalk";
import type { Root } from "postcss";
import postcss from "postcss";

/**
 * Handles @theme inline blocks
 */
export function handleInlineTheme(root: Root) {
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
    const exists = inlineThemeRule.nodes?.some(
      (node): node is postcss.Declaration =>
        node.type === "decl" && node.prop === colorProp,
    );

    if (!exists) {
      inlineThemeRule.append(
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
export function preserveConfigDirectives(root: Root) {
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
