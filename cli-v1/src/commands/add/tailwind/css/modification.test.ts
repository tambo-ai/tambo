import { describe, expect, it } from "@jest/globals";
import postcss from "postcss";
import {
  addCustomVariants,
  addVariables,
  addVariablesToLayer,
  addVariants,
  addUtilities,
  cssVariableExists,
  mergeTheme,
} from "./modification.js";

describe("cssVariableExists", () => {
  it("should return true when variable exists in selector", () => {
    const css = `:root { --background: #fff; }`;
    const root = postcss.parse(css);
    expect(cssVariableExists(root, ":root", "--background")).toBe(true);
  });

  it("should return false when variable does not exist", () => {
    const css = `:root { --background: #fff; }`;
    const root = postcss.parse(css);
    expect(cssVariableExists(root, ":root", "--foreground")).toBe(false);
  });

  it("should return false when selector does not exist", () => {
    const css = `:root { --background: #fff; }`;
    const root = postcss.parse(css);
    expect(cssVariableExists(root, ".dark", "--background")).toBe(false);
  });
});

describe("addVariables", () => {
  it("should add variables to existing :root selector", () => {
    const css = `@import "tailwindcss";\n:root { --existing: #000; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#fff"]]);

    addVariables(root, ":root", vars);

    const result = root.toString();
    expect(result).toContain("--background: #fff");
    expect(result).toContain("--existing: #000");
  });

  it("should not duplicate existing variables", () => {
    const css = `@import "tailwindcss";\n:root { --background: #000; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#fff"]]);

    addVariables(root, ":root", vars);

    const result = root.toString();
    // Should still have original value, not the new one
    expect(result).toContain("--background: #000");
    expect(result.match(/--background/g)?.length).toBe(1);
  });

  it("should create new :root selector after @import when none exists", () => {
    const css = `@import "tailwindcss";\na { color: red; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#fff"]]);

    addVariables(root, ":root", vars);

    const result = root.toString();
    expect(result).toContain(":root");
    expect(result).toContain("--background: #fff");
    // @import should still be first
    expect(result.indexOf("@import")).toBeLessThan(result.indexOf(":root"));
  });

  it("should create .dark selector after :root when none exists", () => {
    const css = `@import "tailwindcss";\n:root { --bg: #fff; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#000"]]);

    addVariables(root, ".dark", vars);

    const result = root.toString();
    expect(result).toContain(".dark");
    expect(result).toContain("--background: #000");
    // .dark should come after :root
    expect(result.indexOf(":root")).toBeLessThan(result.indexOf(".dark"));
  });

  it("should insert after @theme blocks when no :root exists", () => {
    const css = `@import "tailwindcss";\n@theme inline { --color-bg: var(--bg); }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#fff"]]);

    addVariables(root, ":root", vars);

    const result = root.toString();
    // @import and @theme should come before :root
    expect(result.indexOf("@import")).toBeLessThan(result.indexOf(":root"));
    expect(result.indexOf("@theme")).toBeLessThan(result.indexOf(":root"));
  });

  it("should not match nested :root inside @media", () => {
    const css = `@import "tailwindcss";\n@media (prefers-color-scheme: light) { :root { color: #000; } }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#fff"]]);

    addVariables(root, ".dark", vars);

    const result = root.toString();
    // Should create a top-level .dark, not insert inside @media
    expect(result).toContain(".dark");
    // @import should still be first
    expect(result.indexOf("@import")).toBeLessThan(result.indexOf(".dark"));
  });
});

describe("mergeTheme", () => {
  it("should add variables to existing @theme block", () => {
    const css = `@import "tailwindcss";\n@theme { --existing: #000; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--color-bg", "var(--background)"]]);

    mergeTheme(root, vars);

    const result = root.toString();
    expect(result).toContain("--color-bg: var(--background)");
    expect(result).toContain("--existing: #000");
  });

  it("should create @theme block after @import when none exists", () => {
    const css = `@import "tailwindcss";\n:root { --bg: #fff; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--color-bg", "var(--background)"]]);

    mergeTheme(root, vars);

    const result = root.toString();
    expect(result).toContain("@theme");
    expect(result).toContain("--color-bg: var(--background)");
    // @import should come before @theme
    expect(result.indexOf("@import")).toBeLessThan(result.indexOf("@theme"));
  });

  it("should not duplicate existing theme variables", () => {
    const css = `@import "tailwindcss";\n@theme { --color-bg: var(--bg); }`;
    const root = postcss.parse(css);
    const vars = new Map([["--color-bg", "var(--background)"]]);

    mergeTheme(root, vars);

    const result = root.toString();
    // Should keep original value
    expect(result).toContain("--color-bg: var(--bg)");
    expect(result.match(/--color-bg/g)?.length).toBe(1);
  });
});

describe("addCustomVariants", () => {
  it("should add custom variant after @import", () => {
    const css = `@import "tailwindcss";\n:root { --bg: #fff; }`;
    const root = postcss.parse(css);
    const variants = new Map([["dark", "(&:is(.dark *))"]]);

    addCustomVariants(root, variants);

    const result = root.toString();
    expect(result).toContain("@custom-variant dark (&:is(.dark *))");
    // Should come after @import
    expect(result.indexOf("@import")).toBeLessThan(
      result.indexOf("@custom-variant"),
    );
  });

  it("should not duplicate existing custom variants", () => {
    const css = `@import "tailwindcss";\n@custom-variant dark (&:is(.dark *));`;
    const root = postcss.parse(css);
    const variants = new Map([["dark", "(&:is(.dark *))"]]);

    addCustomVariants(root, variants);

    const result = root.toString();
    expect(result.match(/@custom-variant dark/g)?.length).toBe(1);
  });

  it("should prepend custom variant when no @import exists", () => {
    const css = `:root { --bg: #fff; }`;
    const root = postcss.parse(css);
    const variants = new Map([["dark", "(&:is(.dark *))"]]);

    addCustomVariants(root, variants);

    const result = root.toString();
    expect(result).toContain("@custom-variant dark (&:is(.dark *))");
    // Should be at the beginning
    expect(result.indexOf("@custom-variant")).toBeLessThan(
      result.indexOf(":root"),
    );
  });
});

describe("addVariablesToLayer", () => {
  it("should add variables to existing rule inside layer", () => {
    const css = `@layer base { :root { --existing: #000; } }`;
    const root = postcss.parse(css);
    const layer = root.first as postcss.AtRule;
    const vars = new Map([["--background", "#fff"]]);

    addVariablesToLayer(layer, ":root", vars);

    const result = root.toString();
    expect(result).toContain("--background: #fff");
    expect(result).toContain("--existing: #000");
  });

  it("should create new rule inside layer when none exists", () => {
    const css = `@layer base { }`;
    const root = postcss.parse(css);
    const layer = root.first as postcss.AtRule;
    const vars = new Map([["--background", "#fff"]]);

    addVariablesToLayer(layer, ":root", vars);

    const result = root.toString();
    expect(result).toContain(":root");
    expect(result).toContain("--background: #fff");
  });

  it("should not duplicate existing variables in layer", () => {
    const css = `@layer base { :root { --background: #000; } }`;
    const root = postcss.parse(css);
    const layer = root.first as postcss.AtRule;
    const vars = new Map([["--background", "#fff"]]);

    addVariablesToLayer(layer, ":root", vars);

    const result = root.toString();
    // Should keep original value
    expect(result).toContain("--background: #000");
    expect(result.match(/--background/g)?.length).toBe(1);
  });
});

describe("addVariants", () => {
  it("should add variant definitions", () => {
    const css = `@import "tailwindcss";`;
    const root = postcss.parse(css);
    const variants = new Map([["hocus", "(&:hover, &:focus)"]]);

    addVariants(root, variants);

    const result = root.toString();
    expect(result).toContain("@variant hocus (&:hover, &:focus)");
  });

  it("should not duplicate existing variants", () => {
    const css = `@import "tailwindcss";\n@variant hocus (&:hover, &:focus);`;
    const root = postcss.parse(css);
    const variants = new Map([["hocus", "(&:hover, &:focus)"]]);

    addVariants(root, variants);

    const result = root.toString();
    expect(result.match(/@variant hocus/g)?.length).toBe(1);
  });

  it("should add multiple variants", () => {
    const css = `@import "tailwindcss";`;
    const root = postcss.parse(css);
    const variants = new Map([
      ["hocus", "(&:hover, &:focus)"],
      ["group-hover", "(&:hover)"],
    ]);

    addVariants(root, variants);

    const result = root.toString();
    expect(result).toContain("@variant hocus");
    expect(result).toContain("@variant group-hover");
  });
});

describe("addUtilities", () => {
  it("should add utilities to existing @layer utilities", () => {
    const css = `@layer utilities { .existing { color: red; } }`;
    const root = postcss.parse(css);
    const newRule = postcss.rule({ selector: ".new-util" });
    newRule.append(postcss.decl({ prop: "display", value: "flex" }));

    addUtilities(root, [newRule]);

    const result = root.toString();
    expect(result).toContain(".new-util");
    expect(result).toContain("display: flex");
    expect(result).toContain(".existing");
  });

  it("should create @layer utilities when none exists", () => {
    const css = `:root { --bg: #fff; }`;
    const root = postcss.parse(css);
    const newRule = postcss.rule({ selector: ".custom-util" });
    newRule.append(postcss.decl({ prop: "display", value: "grid" }));

    addUtilities(root, [newRule]);

    const result = root.toString();
    expect(result).toContain("@layer utilities");
    expect(result).toContain(".custom-util");
    expect(result).toContain("display: grid");
  });

  it("should not duplicate existing utilities", () => {
    const css = `@layer utilities { .existing { color: red; } }`;
    const root = postcss.parse(css);
    const newRule = postcss.rule({ selector: ".existing" });
    newRule.append(postcss.decl({ prop: "color", value: "blue" }));

    addUtilities(root, [newRule]);

    const result = root.toString();
    // Should keep original, not add duplicate
    expect(result.match(/\.existing/g)?.length).toBe(1);
    expect(result).toContain("color: red");
  });

  it("should add multiple utilities", () => {
    const css = `@layer utilities { }`;
    const root = postcss.parse(css);
    const util1 = postcss.rule({ selector: ".util-1" });
    util1.append(postcss.decl({ prop: "display", value: "flex" }));
    const util2 = postcss.rule({ selector: ".util-2" });
    util2.append(postcss.decl({ prop: "display", value: "grid" }));

    addUtilities(root, [util1, util2]);

    const result = root.toString();
    expect(result).toContain(".util-1");
    expect(result).toContain(".util-2");
  });
});

describe("addVariables edge cases", () => {
  it("should append at end when no @import or :root exists", () => {
    const css = `.something { color: red; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--background", "#fff"]]);

    addVariables(root, ":root", vars);

    const result = root.toString();
    expect(result).toContain(":root");
    expect(result).toContain("--background: #fff");
  });
});

describe("mergeTheme edge cases", () => {
  it("should prepend @theme when no @import exists", () => {
    const css = `:root { --bg: #fff; }`;
    const root = postcss.parse(css);
    const vars = new Map([["--color-bg", "var(--background)"]]);

    mergeTheme(root, vars);

    const result = root.toString();
    expect(result).toContain("@theme");
    // @theme should come before :root when no @import
    expect(result.indexOf("@theme")).toBeLessThan(result.indexOf(":root"));
  });
});
