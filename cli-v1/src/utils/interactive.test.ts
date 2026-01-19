import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockNodeExecFileSync = jest.fn();
const mockNodeExecSync = jest.fn();
const mockInquirerPrompt = jest.fn();

jest.unstable_mockModule("child_process", () => ({
  execFileSync: mockNodeExecFileSync,
  execSync: mockNodeExecSync,
}));

jest.unstable_mockModule("inquirer", () => ({
  default: { prompt: mockInquirerPrompt },
}));

const {
  isInteractive,
  NonInteractiveError,
  interactivePrompt,
  execFileSync,
  execSync,
} = await import("./interactive.js");

describe("interactive", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isInteractive", () => {
    it("returns false when stream is not TTY", () => {
      const stream = { isTTY: false } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(false);
    });

    it("returns false when TERM is dumb", () => {
      process.env.TERM = "dumb";
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(false);
    });

    it("returns false when CI=true", () => {
      process.env.CI = "true";
      delete process.env.TERM;
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(false);
    });

    it("returns false when CI=1", () => {
      process.env.CI = "1";
      delete process.env.TERM;
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(false);
    });

    it("returns true when CI=0", () => {
      process.env.CI = "0";
      delete process.env.TERM;
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(true);
    });

    it("returns false when GITHUB_ACTIONS=true", () => {
      process.env.GITHUB_ACTIONS = "true";
      delete process.env.CI;
      delete process.env.TERM;
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(false);
    });

    it("returns true when FORCE_INTERACTIVE=1 even in CI", () => {
      process.env.CI = "true";
      process.env.FORCE_INTERACTIVE = "1";
      delete process.env.TERM;
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(true);
    });

    it("returns false when FORCE_INTERACTIVE=1 but not TTY", () => {
      process.env.FORCE_INTERACTIVE = "1";
      const stream = { isTTY: false } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(false);
    });

    it("returns true in normal TTY environment", () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.TERM;
      const stream = { isTTY: true } as NodeJS.WriteStream;
      expect(isInteractive({ stream })).toBe(true);
    });
  });

  describe("NonInteractiveError", () => {
    it("is an Error", () => {
      const error = new NonInteractiveError("test message");
      expect(error).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
      const error = new NonInteractiveError("test message");
      expect(error.name).toBe("NonInteractiveError");
    });

    it("has correct message", () => {
      const error = new NonInteractiveError("test message");
      expect(error.message).toBe("test message");
    });
  });

  describe("interactivePrompt", () => {
    it("throws NonInteractiveError when not interactive", async () => {
      process.env.CI = "true";

      await expect(
        interactivePrompt({ type: "input", name: "test", message: "Test?" }),
      ).rejects.toThrow(NonInteractiveError);
    });

    it("includes help message in error when provided", async () => {
      process.env.CI = "true";

      await expect(
        interactivePrompt(
          { type: "input", name: "test", message: "Test?" },
          "Custom help",
        ),
      ).rejects.toThrow(/Custom help/);
    });
  });

  describe("execFileSync", () => {
    it("throws NonInteractiveError when not interactive and not allowed", () => {
      process.env.CI = "true";

      expect(() => execFileSync("npm", ["install"])).toThrow(
        NonInteractiveError,
      );
    });

    it("includes command in error message", () => {
      process.env.CI = "true";

      expect(() => execFileSync("npm", ["install", "package"])).toThrow(
        /npm install package/,
      );
    });

    it("executes when allowNonInteractive is true", () => {
      process.env.CI = "true";
      mockNodeExecFileSync.mockReturnValue(Buffer.from("success"));

      const result = execFileSync("npm", ["--version"], {
        allowNonInteractive: true,
      });

      expect(mockNodeExecFileSync).toHaveBeenCalledWith(
        "npm",
        ["--version"],
        {},
      );
      expect(result).toEqual(Buffer.from("success"));
    });

    it("passes options through to node execFileSync", () => {
      process.env.CI = "true";
      mockNodeExecFileSync.mockReturnValue(Buffer.from("success"));

      execFileSync("npm", ["--version"], {
        allowNonInteractive: true,
        cwd: "/project",
        encoding: "utf-8",
      });

      expect(mockNodeExecFileSync).toHaveBeenCalledWith("npm", ["--version"], {
        cwd: "/project",
        encoding: "utf-8",
      });
    });

    it("handles no args", () => {
      process.env.CI = "true";

      expect(() => execFileSync("command")).toThrow(/command/);
    });
  });

  describe("execSync", () => {
    it("throws NonInteractiveError when not interactive and not allowed", () => {
      process.env.CI = "true";

      expect(() => execSync("npm install")).toThrow(NonInteractiveError);
    });

    it("includes command in error message", () => {
      process.env.CI = "true";

      expect(() => execSync("npm install | grep something")).toThrow(
        /npm install \| grep something/,
      );
    });

    it("executes when allowNonInteractive is true", () => {
      process.env.CI = "true";
      mockNodeExecSync.mockReturnValue(Buffer.from("success"));

      const result = execSync("npm --version", {
        allowNonInteractive: true,
      });

      expect(mockNodeExecSync).toHaveBeenCalledWith("npm --version", {});
      expect(result).toEqual(Buffer.from("success"));
    });

    it("passes options through to node execSync", () => {
      process.env.CI = "true";
      mockNodeExecSync.mockReturnValue(Buffer.from("success"));

      execSync("npm --version", {
        allowNonInteractive: true,
        cwd: "/project",
        encoding: "utf-8",
      });

      expect(mockNodeExecSync).toHaveBeenCalledWith("npm --version", {
        cwd: "/project",
        encoding: "utf-8",
      });
    });
  });
});
