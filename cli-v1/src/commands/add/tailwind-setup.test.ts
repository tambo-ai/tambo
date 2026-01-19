import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();
const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockCopyFileSync = jest.fn();
const mockUnlinkSync = jest.fn();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
    copyFileSync: mockCopyFileSync,
    unlinkSync: mockUnlinkSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  copyFileSync: mockCopyFileSync,
  unlinkSync: mockUnlinkSync,
}));

const mockDetectTailwindVersion = jest.fn<(projectRoot: string) => string | null>();
jest.unstable_mockModule("./tailwind/version/detection.js", () => ({
  detectTailwindVersion: mockDetectTailwindVersion,
}));

const mockDetectFramework = jest.fn<() => { displayName: string } | null>();
const mockFindOrGetGlobalsCssPath = jest.fn<() => string>();
jest.unstable_mockModule("../../utils/framework-detection.js", () => ({
  detectFramework: mockDetectFramework,
  findOrGetGlobalsCssPath: mockFindOrGetGlobalsCssPath,
}));

const mockIsInteractive = jest.fn<() => boolean>();
const mockInteractivePrompt = jest.fn<() => Promise<Record<string, boolean>>>();
jest.unstable_mockModule("../../utils/interactive.js", () => ({
  isInteractive: mockIsInteractive,
  interactivePrompt: mockInteractivePrompt,
}));

const mockParseConfigObject = jest.fn<(config: string, source: string) => Record<string, unknown>>();
jest.unstable_mockModule("./tailwind/config/parsing.js", () => ({
  parseConfigObject: mockParseConfigObject,
}));

const mockShowChangesSummary = jest.fn();
const mockShowCssDiff = jest.fn();
jest.unstable_mockModule("./tailwind/css/diff-viewer.js", () => ({
  showChangesSummary: mockShowChangesSummary,
  showCssDiff: mockShowCssDiff,
}));

const mockExtractUtilitiesFromLayer = jest.fn<() => Array<unknown>>();
const mockExtractV4Configuration = jest.fn<() => {
  variables: Map<string, string>;
  darkVariables: Map<string, string>;
  themeVars: Map<string, string>;
  variants: Map<string, string>;
  customVariants: Map<string, string>;
  utilities: Map<string, string>;
}>();
const mockGetTailwindVariables = jest.fn<() => {
  rootVars: Map<string, string>;
  darkVars: Map<string, string>;
}>();
jest.unstable_mockModule("./tailwind/css/extraction.js", () => ({
  extractUtilitiesFromLayer: mockExtractUtilitiesFromLayer,
  extractV4Configuration: mockExtractV4Configuration,
  getTailwindVariables: mockGetTailwindVariables,
}));

const mockAddVariables = jest.fn();
const mockAddVariants = jest.fn();
const mockAddCustomVariants = jest.fn();
const mockAddUtilities = jest.fn();
const mockAddVariablesToLayer = jest.fn();
const mockCssVariableExists = jest.fn<() => boolean>();
const mockMergeTheme = jest.fn();
jest.unstable_mockModule("./tailwind/css/modification.js", () => ({
  addVariables: mockAddVariables,
  addVariants: mockAddVariants,
  addCustomVariants: mockAddCustomVariants,
  addUtilities: mockAddUtilities,
  addVariablesToLayer: mockAddVariablesToLayer,
  cssVariableExists: mockCssVariableExists,
  mergeTheme: mockMergeTheme,
}));

const mockHandleInlineTheme = jest.fn();
const mockPreserveConfigDirectives = jest.fn();
jest.unstable_mockModule("./tailwind/v4/handlers.js", () => ({
  handleInlineTheme: mockHandleInlineTheme,
  preserveConfigDirectives: mockPreserveConfigDirectives,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

const { setupTailwindAndGlobals } = await import("./tailwind-setup.js");

describe("tailwind-setup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    mockIsInteractive.mockReturnValue(false);
    mockDetectTailwindVersion.mockReturnValue("3.4.0");
    mockDetectFramework.mockReturnValue({ displayName: "Next.js" });
    mockFindOrGetGlobalsCssPath.mockReturnValue("src/styles/globals.css");
    mockInteractivePrompt.mockResolvedValue({ proceedWithCss: true, showDetailedDiff: false, proceedWithWrite: true });
    mockGetTailwindVariables.mockReturnValue({
      rootVars: new Map([["--primary", "blue"]]),
      darkVars: new Map([["--primary", "lightblue"]]),
    });
    mockExtractV4Configuration.mockReturnValue({
      variables: new Map([["--primary", "blue"]]),
      darkVariables: new Map([["--primary", "lightblue"]]),
      themeVars: new Map(),
      variants: new Map(),
      customVariants: new Map(),
      utilities: new Map(),
    });
    mockExtractUtilitiesFromLayer.mockReturnValue([]);
    mockCssVariableExists.mockReturnValue(false);
    mockParseConfigObject.mockImplementation(() => ({
      content: ["./src/**/*.tsx"],
    }));
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("setupTailwindAndGlobals", () => {
    it("detects and logs Tailwind version", async () => {
      mockExistsSync.mockReturnValue(false);
      mockDetectTailwindVersion.mockReturnValue("3.4.0");

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("v3.4.0"),
      );
    });

    it("warns when Tailwind version cannot be detected", async () => {
      mockExistsSync.mockReturnValue(false);
      mockDetectTailwindVersion.mockReturnValue(null);

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Could not detect"),
      );
    });

    it("detects and logs framework", async () => {
      mockExistsSync.mockReturnValue(false);
      mockDetectFramework.mockReturnValue({ displayName: "Next.js" });

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Next.js"),
      );
    });

    it("creates parent directory for globals.css if needed", async () => {
      mockExistsSync.mockReturnValue(false);

      await setupTailwindAndGlobals("/project");

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true },
      );
    });

    it("creates globals.css from template if not exists", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("globals.css") && path.includes("/project")) return false;
        return true;
      });

      await setupTailwindAndGlobals("/project");

      expect(mockCopyFileSync).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Created globals.css"),
      );
    });

    it("uses v4 globals template for Tailwind v4", async () => {
      mockDetectTailwindVersion.mockReturnValue("4.0.0");
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("globals.css") && path.includes("/project")) return false;
        return true;
      });

      await setupTailwindAndGlobals("/project");

      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expect.stringContaining("globals-v4.css"),
        expect.any(String),
      );
    });

    it("uses v3 globals template for Tailwind v3", async () => {
      mockDetectTailwindVersion.mockReturnValue("3.4.0");
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("globals.css") && path.includes("/project")) return false;
        return true;
      });

      await setupTailwindAndGlobals("/project");

      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expect.stringContaining("globals-v3.css"),
        expect.any(String),
      );
    });

    it("creates tailwind.config.ts if not exists for v3", async () => {
      mockDetectTailwindVersion.mockReturnValue("3.4.0");
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("tailwind.config")) return false;
        if (path.includes("globals.css") && path.includes("/project")) return false;
        return true;
      });

      await setupTailwindAndGlobals("/project");

      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expect.stringContaining("tailwind.config.ts"),
        expect.any(String),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Created tailwind.config.ts"),
      );
    });

    it("skips tailwind.config.ts for v4", async () => {
      mockDetectTailwindVersion.mockReturnValue("4.0.0");
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("tailwind.config")) return false;
        if (path.includes("globals.css") && path.includes("/project")) return false;
        return true;
      });

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("CSS-first configuration"),
      );
    });

    it("prompts user before modifying existing globals.css in interactive mode", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockInteractivePrompt.mockResolvedValue({ proceedWithCss: false });

      await setupTailwindAndGlobals("/project");

      expect(mockInteractivePrompt).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("skipped"),
      );
    });

    it("automatically applies CSS changes in non-interactive mode", async () => {
      mockIsInteractive.mockReturnValue(false);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);

      await setupTailwindAndGlobals("/project");

      // Should log automatic application message
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Non-interactive"),
      );
    });

    it("shows missing variables when user declines CSS modifications", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { }`);
      mockInteractivePrompt.mockResolvedValue({ proceedWithCss: false });
      mockCssVariableExists.mockReturnValue(false);

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Missing CSS variables"),
      );
    });

    it("shows message when all required variables are present", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { --primary: blue; }`);
      mockInteractivePrompt.mockResolvedValue({ proceedWithCss: false });
      mockCssVariableExists.mockReturnValue(true);

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("All required CSS variables are already present"),
      );
    });

    it("creates backup before modifying globals.css", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockInteractivePrompt.mockResolvedValue({
        proceedWithCss: true,
        showDetailedDiff: false,
        proceedWithWrite: true
      });
      mockCssVariableExists.mockReturnValue(false);

      await setupTailwindAndGlobals("/project");

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".backup"),
        expect.any(String),
      );
    });

    it("removes backup after successful modification", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockInteractivePrompt.mockResolvedValue({
        proceedWithCss: true,
        showDetailedDiff: false,
        proceedWithWrite: true
      });
      mockCssVariableExists.mockReturnValue(false);

      await setupTailwindAndGlobals("/project");

      expect(mockUnlinkSync).toHaveBeenCalledWith(
        expect.stringContaining(".backup"),
      );
    });

    it("cancels when user declines final write confirmation", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockCssVariableExists.mockReturnValue(false);
      mockInteractivePrompt
        .mockResolvedValueOnce({ proceedWithCss: true })
        .mockResolvedValueOnce({ showDetailedDiff: false })
        .mockResolvedValueOnce({ proceedWithWrite: false });

      await setupTailwindAndGlobals("/project");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Changes cancelled"),
      );
    });

    it("shows detailed diff when user requests it", async () => {
      mockIsInteractive.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockCssVariableExists.mockReturnValue(false);
      mockInteractivePrompt
        .mockResolvedValueOnce({ proceedWithCss: true })
        .mockResolvedValueOnce({ showDetailedDiff: true })
        .mockResolvedValueOnce({ proceedWithWrite: true });

      await setupTailwindAndGlobals("/project");

      expect(mockShowCssDiff).toHaveBeenCalled();
    });

    it("merges existing tailwind config with defaults for v3", async () => {
      mockDetectTailwindVersion.mockReturnValue("3.4.0");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("tailwind.config")) {
          return `const config = { content: ["./src/**/*.tsx"], theme: {} }; export default config;`;
        }
        return `:root { color: red; }`;
      });
      mockParseConfigObject.mockReturnValue({
        content: ["./src/**/*.tsx"],
        theme: {},
      });
      mockInteractivePrompt.mockResolvedValue({ proceedWithCss: false });

      await setupTailwindAndGlobals("/project");

      expect(mockParseConfigObject).toHaveBeenCalled();
    });

    it("handles v4 CSS configuration", async () => {
      mockDetectTailwindVersion.mockReturnValue("4.0.0");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockCssVariableExists.mockReturnValue(false);
      mockInteractivePrompt.mockResolvedValue({
        proceedWithCss: true,
        showDetailedDiff: false,
        proceedWithWrite: true
      });

      await setupTailwindAndGlobals("/project");

      expect(mockHandleInlineTheme).toHaveBeenCalled();
      expect(mockPreserveConfigDirectives).toHaveBeenCalled();
      expect(mockMergeTheme).toHaveBeenCalled();
      expect(mockAddCustomVariants).toHaveBeenCalled();
    });

    it("handles v3 layer-based CSS configuration", async () => {
      mockDetectTailwindVersion.mockReturnValue("3.4.0");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => `:root { color: red; }`);
      mockCssVariableExists.mockReturnValue(false);
      mockInteractivePrompt.mockResolvedValue({
        proceedWithCss: true,
        showDetailedDiff: false,
        proceedWithWrite: true
      });

      await setupTailwindAndGlobals("/project");

      expect(mockAddVariablesToLayer).toHaveBeenCalled();
      expect(mockAddUtilities).toHaveBeenCalled();
    });
  });
});
