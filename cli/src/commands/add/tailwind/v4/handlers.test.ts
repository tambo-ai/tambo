import { describe, expect, it, jest } from "@jest/globals";
import postcss from "postcss";

// Mock chalk to avoid snapshot issues with ANSI codes
jest.unstable_mockModule("chalk", () => ({
  default: { blue: (s: string) => s },
}));

const { handleInlineTheme, preserveConfigDirectives } =
  await import("./handlers.js");

describe("handleInlineTheme", () => {
  it("creates @theme inline block when none exists", () => {
    const root = postcss.parse("/* empty */");
    handleInlineTheme(root);

    const themeRule = root.nodes.find(
      (n): n is postcss.AtRule =>
        n.type === "atrule" && n.name === "theme" && n.params === "inline",
    );
    expect(themeRule).toBeDefined();
    expect(themeRule!.nodes!.length).toBeGreaterThan(0);
  });

  it("adds color mappings as declarations", () => {
    const root = postcss.parse("/* empty */");
    handleInlineTheme(root);

    const themeRule = root.nodes.find(
      (n): n is postcss.AtRule =>
        n.type === "atrule" && n.name === "theme" && n.params === "inline",
    )!;

    const decls = themeRule
      .nodes!.filter((n): n is postcss.Declaration => n.type === "decl")
      .map((d) => d.prop);

    expect(decls).toContain("--color-background");
    expect(decls).toContain("--color-foreground");
    expect(decls).toContain("--color-primary");
    expect(decls).toContain("--color-backdrop");
  });

  it("maps colors to CSS custom properties", () => {
    const root = postcss.parse("/* empty */");
    handleInlineTheme(root);

    const themeRule = root.nodes.find(
      (n): n is postcss.AtRule =>
        n.type === "atrule" && n.name === "theme" && n.params === "inline",
    )!;

    const bgDecl = themeRule.nodes!.find(
      (n): n is postcss.Declaration =>
        n.type === "decl" && n.prop === "--color-background",
    )!;
    expect(bgDecl.value).toBe("var(--background)");
  });

  it("does not duplicate existing color mappings", () => {
    const root = postcss.parse(
      "@theme inline { --color-background: var(--background); }",
    );
    handleInlineTheme(root);

    const themeRule = root.nodes.find(
      (n): n is postcss.AtRule =>
        n.type === "atrule" && n.name === "theme" && n.params === "inline",
    )!;

    const bgDecls = themeRule.nodes!.filter(
      (n): n is postcss.Declaration =>
        n.type === "decl" && n.prop === "--color-background",
    );
    expect(bgDecls).toHaveLength(1);
  });

  it("appends missing mappings to existing @theme inline block", () => {
    const root = postcss.parse(
      "@theme inline { --color-background: var(--background); }",
    );
    handleInlineTheme(root);

    const themeRule = root.nodes.find(
      (n): n is postcss.AtRule =>
        n.type === "atrule" && n.name === "theme" && n.params === "inline",
    )!;

    const decls = themeRule
      .nodes!.filter((n): n is postcss.Declaration => n.type === "decl")
      .map((d) => d.prop);

    expect(decls).toContain("--color-foreground");
    expect(decls).toContain("--color-primary");
  });
});

describe("preserveConfigDirectives", () => {
  it("does not remove @config directives", () => {
    const root = postcss.parse('@config "../../tailwind.config.js";');
    preserveConfigDirectives(root);

    const configRule = root.nodes.find(
      (n): n is postcss.AtRule => n.type === "atrule" && n.name === "config",
    );
    expect(configRule).toBeDefined();
    expect(configRule!.params).toBe('"../../tailwind.config.js"');
  });

  it("logs found @config directives", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const root = postcss.parse('@config "./tailwind.config.ts";');
    preserveConfigDirectives(root);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("./tailwind.config.ts"),
    );
    consoleSpy.mockRestore();
  });

  it("handles CSS with no @config directives", () => {
    const root = postcss.parse("@tailwind base;");
    preserveConfigDirectives(root);
    expect(root.toString()).toBe("@tailwind base;");
  });
});
