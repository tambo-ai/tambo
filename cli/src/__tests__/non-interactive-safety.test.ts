import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// Mock inquirer - we want to verify it's NOT called in non-interactive mode
const mockPrompt = jest.fn();
jest.unstable_mockModule("inquirer", () => ({
  default: { prompt: mockPrompt },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GuidanceError: any;
let isInteractive: (opts?: { stream?: NodeJS.WriteStream }) => boolean;

describe("non-interactive mode safety", () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(async () => {
    // Reset mocks
    mockPrompt.mockReset();

    // Set up non-interactive environment
    process.env.CI = "true";
    process.env.TERM = "xterm-256color";
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      writable: true,
    });

    // Clear FORCE_INTERACTIVE to ensure non-interactive mode
    delete process.env.FORCE_INTERACTIVE;

    // Import modules after mocks are set up
    const interactiveModule = await import("../utils/interactive.js");
    GuidanceError = interactiveModule.GuidanceError;
    isInteractive = interactiveModule.isInteractive;
  });

  afterEach(() => {
    // Restore environment
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      writable: true,
    });

    jest.resetModules();
  });

  describe("isInteractive detection", () => {
    it("returns false when stdout is not a TTY", () => {
      Object.defineProperty(process.stdout, "isTTY", {
        value: false,
        writable: true,
      });
      expect(isInteractive()).toBe(false);
    });

    it("returns false when CI env var is set", () => {
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      process.env.CI = "true";
      delete process.env.FORCE_INTERACTIVE;
      expect(isInteractive()).toBe(false);
    });

    it("returns false when GITHUB_ACTIONS is true", () => {
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      delete process.env.CI;
      process.env.GITHUB_ACTIONS = "true";
      delete process.env.FORCE_INTERACTIVE;
      expect(isInteractive()).toBe(false);
    });

    it("returns true when FORCE_INTERACTIVE=1 overrides CI", () => {
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      process.env.CI = "true";
      process.env.FORCE_INTERACTIVE = "1";
      expect(isInteractive()).toBe(true);
    });

    it("returns false when TERM=dumb", () => {
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      process.env.TERM = "dumb";
      expect(isInteractive()).toBe(false);
    });

    it("returns true for normal TTY with no CI vars", () => {
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      process.env.TERM = "xterm-256color";
      delete process.env.FORCE_INTERACTIVE;
      expect(isInteractive()).toBe(true);
    });
  });

  describe("GuidanceError", () => {
    it("stores message and guidance array", () => {
      const error = new GuidanceError("Project name required", [
        "tambo init --project-name=myapp    # Create new project",
        "tambo init --project-id=abc123     # Use existing project",
      ]);

      expect(error.message).toBe("Project name required");
      expect(error.guidance).toHaveLength(2);
      expect(error.guidance[0]).toContain("--project-name");
      expect(error.guidance[1]).toContain("--project-id");
    });

    it("has correct error name", () => {
      const error = new GuidanceError("Test", ["hint"]);
      expect(error.name).toBe("GuidanceError");
    });

    it("is instanceof Error", () => {
      const error = new GuidanceError("Test", ["hint"]);
      expect(error).toBeInstanceOf(Error);
    });

    it("guidance array is readonly", () => {
      const error = new GuidanceError("Test", ["hint1", "hint2"]);
      // TypeScript enforces readonly, but verify the array is preserved
      expect(error.guidance).toEqual(["hint1", "hint2"]);
    });
  });

  describe("exit code contract", () => {
    it("exit code 2 is used for user action required (guidance errors)", () => {
      // This test documents the exit code contract:
      // 0 = success
      // 1 = error
      // 2 = user action required (GuidanceError)
      // The actual exit code handling is in cli.ts main()
      const error = new GuidanceError("User action needed", [
        "run this command instead",
      ]);
      expect(error.name).toBe("GuidanceError");
      // CLI entry point uses exit code 2 for GuidanceError
    });
  });
});
