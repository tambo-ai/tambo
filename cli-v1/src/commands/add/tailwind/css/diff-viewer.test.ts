import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { showCssDiff, showChangesSummary } from "./diff-viewer.js";

// Suppress console output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

describe("tailwind/css/diff-viewer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("showCssDiff", () => {
    it("shows no changes message when content is identical", () => {
      const content = `:root { color: red; }`;

      showCssDiff(content, content);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No changes needed"),
      );
    });

    it("shows diff header with custom filename", () => {
      const original = `:root { color: red; }`;
      const modified = `:root { color: blue; }`;

      showCssDiff(original, modified, "styles.css");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("styles.css"),
      );
    });

    it("shows added lines in green", () => {
      const original = `:root { color: red; }`;
      const modified = `:root { color: red; }\n.new { display: flex; }`;

      showCssDiff(original, modified);

      // Check that additions were logged (green + prefix)
      const addedCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("+"),
      );
      expect(addedCall).toBeDefined();
    });

    it("shows removed lines in red", () => {
      const original = `:root { color: red; }\n.old { display: block; }`;
      const modified = `:root { color: red; }`;

      showCssDiff(original, modified);

      // Check that removals were logged (red - prefix)
      const removedCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("-"),
      );
      expect(removedCall).toBeDefined();
    });

    it("shows summary of additions and deletions", () => {
      const original = `:root { color: red; }`;
      const modified = `:root { color: blue; }`;

      showCssDiff(original, modified);

      const summaryCall = mockConsoleLog.mock.calls.find(
        (call) =>
          String(call[0]).includes("additions") ||
          String(call[0]).includes("deletions"),
      );
      expect(summaryCall).toBeDefined();
    });

    it("shows context lines for unchanged content", () => {
      const original = `.context { padding: 1rem; }\n.old { color: red; }`;
      const modified = `.context { padding: 1rem; }\n.new { color: blue; }`;

      showCssDiff(original, modified);

      // Context lines are shown in gray without +/-
      const contextCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("context"),
      );
      expect(contextCall).toBeDefined();
    });

    it("uses default filename when not provided", () => {
      const original = `:root { color: red; }`;
      const modified = `:root { color: blue; }`;

      showCssDiff(original, modified);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("globals.css"),
      );
    });
  });

  describe("showChangesSummary", () => {
    it("shows no changes message when content is identical", () => {
      const content = `:root { color: red; }`;

      showChangesSummary(content, content, false);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No changes needed"),
      );
    });

    it("counts CSS variables being added", () => {
      const original = ``;
      const modified = `:root { --color-primary: blue; --color-secondary: red; }`;

      showChangesSummary(original, modified, false);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("2 CSS variables"),
      );
    });

    it("counts custom variants for v4", () => {
      const original = ``;
      const modified = `@custom-variant dark (&:is(.dark *));\n@custom-variant print (@media print);`;

      showChangesSummary(original, modified, true);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("2 custom variants"),
      );
    });

    it("counts theme blocks for v4", () => {
      const original = ``;
      const modified = `@theme { --color: blue; }\n@theme { --size: 16px; }`;

      showChangesSummary(original, modified, true);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("2 theme blocks"),
      );
    });

    it("counts layer blocks for v3", () => {
      const original = ``;
      const modified = `@layer base { :root { color: red; } }`;

      showChangesSummary(original, modified, false);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("1 layer blocks"),
      );
    });

    it("counts utility layers for v3", () => {
      const original = ``;
      const modified = `@layer utilities { .custom { display: flex; } }`;

      showChangesSummary(original, modified, false);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("1 utility layers"),
      );
    });

    it("shows summary header", () => {
      const original = ``;
      const modified = `:root { --color: blue; }`;

      showChangesSummary(original, modified, false);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Summary of changes"),
      );
    });

    it("only counts v4 features when isV4 is true", () => {
      const original = ``;
      const modified = `@custom-variant dark (&:is(.dark *));\n@layer base { color: red; }`;

      showChangesSummary(original, modified, true);

      // Should show custom variants, not layer blocks
      const customVariantCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("custom variants"),
      );
      const layerBlockCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("layer blocks"),
      );

      expect(customVariantCall).toBeDefined();
      expect(layerBlockCall).toBeUndefined();
    });

    it("only counts v3 features when isV4 is false", () => {
      const original = ``;
      const modified = `@custom-variant dark (&:is(.dark *));\n@layer base { color: red; }`;

      showChangesSummary(original, modified, false);

      // Should show layer blocks, not custom variants
      const layerBlockCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("layer blocks"),
      );
      const customVariantCall = mockConsoleLog.mock.calls.find((call) =>
        String(call[0]).includes("custom variants"),
      );

      expect(layerBlockCall).toBeDefined();
      expect(customVariantCall).toBeUndefined();
    });
  });
});
