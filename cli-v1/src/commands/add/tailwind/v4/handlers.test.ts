import { describe, expect, it } from "@jest/globals";
import postcss from "postcss";
import { handleInlineTheme } from "./handlers.js";

describe("handleInlineTheme", () => {
  it("should create @theme inline block after @import", () => {
    const css = `@import "tailwindcss";\n:root { --bg: #fff; }`;
    const root = postcss.parse(css);

    handleInlineTheme(root);

    const result = root.toString();
    expect(result).toContain("@theme inline");
    // Should come after @import
    expect(result.indexOf("@import")).toBeLessThan(
      result.indexOf("@theme inline"),
    );
  });

  it("should add color mappings to existing @theme inline block", () => {
    const css = `@import "tailwindcss";\n@theme inline { --existing: #000; }`;
    const root = postcss.parse(css);

    handleInlineTheme(root);

    const result = root.toString();
    expect(result).toContain("--color-background: var(--background)");
    expect(result).toContain("--existing: #000");
  });

  it("should not duplicate color mappings", () => {
    const css = `@import "tailwindcss";\n@theme inline { --color-background: var(--bg); }`;
    const root = postcss.parse(css);

    handleInlineTheme(root);

    const result = root.toString();
    // Should keep original value
    expect(result).toContain("--color-background: var(--bg)");
    expect(result.match(/--color-background/g)?.length).toBe(1);
  });

  it("should add all standard color mappings", () => {
    const css = `@import "tailwindcss";`;
    const root = postcss.parse(css);

    handleInlineTheme(root);

    const result = root.toString();
    const expectedColors = [
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
    ];

    for (const color of expectedColors) {
      expect(result).toContain(`--color-${color}: var(--${color})`);
    }
  });

  it("should prepend when no @import exists (fallback)", () => {
    const css = `:root { --bg: #fff; }`;
    const root = postcss.parse(css);

    handleInlineTheme(root);

    const result = root.toString();
    expect(result).toContain("@theme inline");
    // Should be at the beginning when no @import
    expect(result.indexOf("@theme inline")).toBeLessThan(
      result.indexOf(":root"),
    );
  });
});
