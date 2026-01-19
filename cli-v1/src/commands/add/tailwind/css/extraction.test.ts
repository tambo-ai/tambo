import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import postcss from "postcss";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

// Suppress console output
const mockConsoleWarn = jest.fn();
const originalConsoleWarn = console.warn;

const {
  extractVariablesFromCSS,
  extractUtilitiesFromLayer,
  extractThemeBlocks,
  extractVariants,
  extractUtilities,
  extractCustomVariants,
  extractV4Configuration,
} = await import("./extraction.js");

describe("tailwind/css/extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = mockConsoleWarn;
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  describe("extractVariablesFromCSS", () => {
    it("returns empty map when file does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      const result = extractVariablesFromCSS("/path/to/file.css", ":root");

      expect(result.size).toBe(0);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("not found"),
      );
    });

    it("extracts CSS variables from :root selector", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        :root {
          --primary: #3b82f6;
          --secondary: #64748b;
        }
      `);

      const result = extractVariablesFromCSS("/path/to/file.css", ":root");

      expect(result.get("--primary")).toBe("#3b82f6");
      expect(result.get("--secondary")).toBe("#64748b");
    });

    it("extracts CSS variables from .dark selector", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        .dark {
          --primary: #60a5fa;
          --background: #0f172a;
        }
      `);

      const result = extractVariablesFromCSS("/path/to/file.css", ".dark");

      expect(result.get("--primary")).toBe("#60a5fa");
      expect(result.get("--background")).toBe("#0f172a");
    });

    it("extracts variables from @layer base", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        @layer base {
          :root {
            --color-primary: blue;
          }
        }
      `);

      const result = extractVariablesFromCSS("/path/to/file.css", ":root");

      expect(result.get("--color-primary")).toBe("blue");
    });

    it("ignores non-variable declarations", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        :root {
          --variable: value;
          color: red;
          background: white;
        }
      `);

      const result = extractVariablesFromCSS("/path/to/file.css", ":root");

      expect(result.size).toBe(1);
      expect(result.get("--variable")).toBe("value");
    });

    it("handles CSS parse errors gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid { css");

      const result = extractVariablesFromCSS("/path/to/file.css", ":root");

      expect(result.size).toBe(0);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Could not parse"),
      );
    });
  });

  describe("extractUtilitiesFromLayer", () => {
    it("returns empty array when file does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      const result = extractUtilitiesFromLayer("/path/to/file.css");

      expect(result).toEqual([]);
    });

    it("extracts utility rules from @layer utilities", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        @layer utilities {
          .custom-util {
            display: flex;
          }
          .another-util {
            position: relative;
          }
        }
      `);

      const result = extractUtilitiesFromLayer("/path/to/file.css");

      expect(result.length).toBe(2);
      expect(result[0].selector).toBe(".custom-util");
      expect(result[1].selector).toBe(".another-util");
    });

    it("ignores other @layer rules", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        @layer base {
          .base-rule {
            color: red;
          }
        }
        @layer utilities {
          .util-rule {
            display: block;
          }
        }
      `);

      const result = extractUtilitiesFromLayer("/path/to/file.css");

      expect(result.length).toBe(1);
      expect(result[0].selector).toBe(".util-rule");
    });

    it("handles parse errors gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid css {");

      const result = extractUtilitiesFromLayer("/path/to/file.css");

      expect(result).toEqual([]);
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe("extractThemeBlocks", () => {
    it("extracts variables from @theme block", () => {
      const root = postcss.parse(`
        @theme {
          --color-primary: blue;
          --color-secondary: green;
        }
      `);

      const result = extractThemeBlocks(root);

      expect(result.get("--color-primary")).toBe("blue");
      expect(result.get("--color-secondary")).toBe("green");
    });

    it("returns empty map when no @theme block", () => {
      const root = postcss.parse(`
        :root {
          --color: red;
        }
      `);

      const result = extractThemeBlocks(root);

      expect(result.size).toBe(0);
    });

    it("ignores non-variable declarations in @theme", () => {
      const root = postcss.parse(`
        @theme {
          --variable: value;
          font-size: 16px;
        }
      `);

      const result = extractThemeBlocks(root);

      expect(result.size).toBe(1);
      expect(result.get("--variable")).toBe("value");
    });
  });

  describe("extractVariants", () => {
    it("extracts @variant definitions", () => {
      const root = postcss.parse(`
        @variant hocus (&:hover, &:focus);
        @variant group-hover (&:hover);
      `);

      const result = extractVariants(root);

      expect(result.get("hocus")).toBe("(&:hover, &:focus)");
      expect(result.get("group-hover")).toBe("(&:hover)");
    });

    it("returns empty map when no variants", () => {
      const root = postcss.parse(`
        :root { color: red; }
      `);

      const result = extractVariants(root);

      expect(result.size).toBe(0);
    });
  });

  describe("extractUtilities", () => {
    it("extracts @utility definitions", () => {
      const root = postcss.parse(`
        @utility custom-grid {
          display: grid;
        }
        @utility custom-flex {
          display: flex;
        }
      `);

      const result = extractUtilities(root);

      expect(result.has("custom-grid")).toBe(true);
      expect(result.has("custom-flex")).toBe(true);
    });

    it("returns empty map when no utilities", () => {
      const root = postcss.parse(`
        .class { color: red; }
      `);

      const result = extractUtilities(root);

      expect(result.size).toBe(0);
    });
  });

  describe("extractCustomVariants", () => {
    it("extracts @custom-variant definitions", () => {
      const root = postcss.parse(`
        @custom-variant dark (&:is(.dark *));
        @custom-variant print (@media print);
      `);

      const result = extractCustomVariants(root);

      expect(result.get("dark")).toBe("(&:is(.dark *))");
      expect(result.get("print")).toBe("(@media print)");
    });

    it("returns empty map when no custom variants", () => {
      const root = postcss.parse(`
        .class { color: red; }
      `);

      const result = extractCustomVariants(root);

      expect(result.size).toBe(0);
    });
  });

  describe("extractV4Configuration", () => {
    it("extracts all v4 configuration from file", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        :root {
          --primary: blue;
        }
        .dark {
          --primary: lightblue;
        }
        @theme {
          --color: red;
        }
        @variant hocus (&:hover);
        @custom-variant dark (&:is(.dark *));
        @utility custom-util {
          display: block;
        }
      `);

      const result = extractV4Configuration("/path/to/file.css");

      expect(result.variables.get("--primary")).toBe("blue");
      expect(result.darkVariables.get("--primary")).toBe("lightblue");
      expect(result.themeVars.get("--color")).toBe("red");
      expect(result.variants.has("hocus")).toBe(true);
      expect(result.customVariants.has("dark")).toBe(true);
      expect(result.utilities.has("custom-util")).toBe(true);
    });
  });
});
