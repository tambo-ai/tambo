import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { vol } from "memfs";
import { isGitAvailable, hasGitRepo } from "./git-utils.js";

// Mock fs module
jest.mock("fs");

// Mock interactive utils
jest.mock("./interactive.js", () => ({
  execSync: jest.fn(),
  interactivePrompt: jest.fn(),
}));

describe("git-utils", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });

  describe("isGitAvailable", () => {
    it("returns true when git is available", async () => {
      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from("git version 2.39.0"));

      const result = isGitAvailable();
      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith("git --version", {
        stdio: "ignore",
        allowNonInteractive: true,
      });
    });

    it("returns false when git is not available", async () => {
      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = isGitAvailable();
      expect(result).toBe(false);
    });
  });

  describe("hasGitRepo", () => {
    it("returns true when .git directory exists", () => {
      vol.fromJSON({
        "/project/.git/HEAD": "ref: refs/heads/main",
        "/project/.git/config": "[core]\n\trepositoryformatversion = 0",
      });

      const result = hasGitRepo("/project");
      expect(result).toBe(true);
    });

    it("returns false when .git directory does not exist", () => {
      vol.fromJSON({
        "/project/package.json": "{}",
      });

      const result = hasGitRepo("/project");
      expect(result).toBe(false);
    });

    it("returns false when .git is a file, not a directory", () => {
      vol.fromJSON({
        "/project/.git": "gitdir: ../.git/modules/project",
      });

      const result = hasGitRepo("/project");
      expect(result).toBe(false);
    });
  });
});
