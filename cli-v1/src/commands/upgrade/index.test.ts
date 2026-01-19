import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();

const mockIsInteractive = jest.fn<() => boolean>();
const mockUpgradeComponents = jest.fn<(options: unknown) => Promise<boolean>>();
const mockUpgradeSkill = jest.fn<(options: unknown) => Promise<boolean>>();
const mockUpgradeNpmPackages =
  jest.fn<(options: unknown) => Promise<boolean>>();
const mockDetectTemplate = jest.fn<() => Promise<string | null>>();
const mockGenerateAiUpgradePrompts = jest.fn<() => string[]>();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

jest.unstable_mockModule("../../utils/interactive.js", () => ({
  isInteractive: mockIsInteractive,
}));

jest.unstable_mockModule("./components.js", () => ({
  upgradeComponents: mockUpgradeComponents,
}));

jest.unstable_mockModule("./skill.js", () => ({
  upgradeSkill: mockUpgradeSkill,
}));

jest.unstable_mockModule("./npm-packages.js", () => ({
  upgradeNpmPackages: mockUpgradeNpmPackages,
}));

jest.unstable_mockModule("./utils.js", () => ({
  detectTemplate: mockDetectTemplate,
  generateAiUpgradePrompts: mockGenerateAiUpgradePrompts,
}));

// Suppress console output and mock process.exit
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock process.exit
const mockProcessExit = jest.fn<(code?: number) => never>();
const originalProcessExit = process.exit;

const { handleUpgrade } = await import("./index.js");

describe("upgrade/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exit = mockProcessExit as typeof process.exit;
    mockIsInteractive.mockReturnValue(true);
    mockDetectTemplate.mockResolvedValue(null);
    mockGenerateAiUpgradePrompts.mockReturnValue(["Prompt 1", "Prompt 2"]);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe("handleUpgrade", () => {
    it("throws error in non-interactive mode without --yes", async () => {
      mockIsInteractive.mockReturnValue(false);

      await expect(handleUpgrade({ yes: false })).rejects.toThrow(
        /non-interactive mode/,
      );
    });

    it("works in non-interactive mode with --yes", async () => {
      mockIsInteractive.mockReturnValue(false);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(true);
      mockUpgradeComponents.mockResolvedValue(true);

      await handleUpgrade({ yes: true });

      expect(mockUpgradeNpmPackages).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("upgrade complete"),
      );
    });

    it("exits when no package.json exists", async () => {
      mockExistsSync.mockReturnValue(false);

      await handleUpgrade({ yes: true });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("No package.json found"),
      );
    });

    it("warns when not a tambo project", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ dependencies: {} }));
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(true);
      mockUpgradeComponents.mockResolvedValue(true);

      await handleUpgrade({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("doesn't appear to be a tambo project"),
      );
    });

    it("shows detected template", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockDetectTemplate.mockResolvedValue("standard");
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(true);
      mockUpgradeComponents.mockResolvedValue(true);

      await handleUpgrade({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("standard"),
      );
    });

    it("exits when npm upgrade fails", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockUpgradeNpmPackages.mockResolvedValue(false);

      await handleUpgrade({ yes: true });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("NPM package upgrade failed"),
      );
    });

    it("exits when skill upgrade fails", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(false);

      await handleUpgrade({ yes: true });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Skill"),
      );
    });

    it("exits when component upgrade fails", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(true);
      mockUpgradeComponents.mockResolvedValue(false);

      await handleUpgrade({ yes: true });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Component upgrade failed"),
      );
    });

    it("shows AI upgrade prompts", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(true);
      mockUpgradeComponents.mockResolvedValue(true);
      mockGenerateAiUpgradePrompts.mockReturnValue(["Test prompt 1"]);

      await handleUpgrade({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("AI Upgrade Prompts"),
      );
      expect(mockGenerateAiUpgradePrompts).toHaveBeenCalled();
    });

    it("passes options to sub-upgraders", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "1.0.0" } }),
      );
      mockUpgradeNpmPackages.mockResolvedValue(true);
      mockUpgradeSkill.mockResolvedValue(true);
      mockUpgradeComponents.mockResolvedValue(true);

      const options = {
        yes: true,
        legacyPeerDeps: true,
        prefix: "custom/path",
        skipAgentDocs: true,
      };

      await handleUpgrade(options);

      expect(mockUpgradeNpmPackages).toHaveBeenCalledWith(
        expect.objectContaining(options),
      );
      expect(mockUpgradeSkill).toHaveBeenCalledWith(
        expect.objectContaining(options),
      );
      expect(mockUpgradeComponents).toHaveBeenCalledWith(
        expect.objectContaining(options),
      );
    });
  });
});
