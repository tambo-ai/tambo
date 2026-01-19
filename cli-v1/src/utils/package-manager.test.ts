import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import path from "path";

const mockExistsSync = jest.fn<(p: string) => boolean>();
const mockExecFileSync = jest.fn();

jest.unstable_mockModule("fs", () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

jest.unstable_mockModule("child_process", () => ({
  execFileSync: mockExecFileSync,
}));

const {
  detectPackageManager,
  validatePackageManager,
  getInstallCommand,
  getDevFlag,
  getPackageRunnerArgs,
} = await import("./package-manager.js");

type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

describe("package-manager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectPackageManager", () => {
    it("detects pnpm from pnpm-lock.yaml", () => {
      mockExistsSync.mockImplementation((p) =>
        String(p).endsWith("pnpm-lock.yaml"),
      );

      expect(detectPackageManager("/project")).toBe("pnpm");
    });

    it("detects yarn from yarn.lock", () => {
      mockExistsSync.mockImplementation(
        (p) =>
          !String(p).endsWith("pnpm-lock.yaml") &&
          String(p).endsWith("yarn.lock"),
      );

      expect(detectPackageManager("/project")).toBe("yarn");
    });

    it("detects bun from bun.lockb", () => {
      mockExistsSync.mockImplementation(
        (p) =>
          !String(p).endsWith("pnpm-lock.yaml") &&
          !String(p).endsWith("yarn.lock") &&
          String(p).endsWith("bun.lockb"),
      );

      expect(detectPackageManager("/project")).toBe("bun");
    });

    it("defaults to npm when no lockfile found", () => {
      mockExistsSync.mockReturnValue(false);

      expect(detectPackageManager("/project")).toBe("npm");
    });

    it("defaults to npm when only package-lock.json exists", () => {
      mockExistsSync.mockImplementation(
        (p) =>
          !String(p).endsWith("pnpm-lock.yaml") &&
          !String(p).endsWith("yarn.lock") &&
          !String(p).endsWith("bun.lockb"),
      );

      expect(detectPackageManager("/project")).toBe("npm");
    });

    it("uses process.cwd() as default projectRoot", () => {
      mockExistsSync.mockReturnValue(false);
      const originalCwd = process.cwd();

      detectPackageManager();

      expect(mockExistsSync).toHaveBeenCalledWith(
        path.join(originalCwd, "pnpm-lock.yaml"),
      );
    });

    it("prioritizes pnpm over other lockfiles", () => {
      mockExistsSync.mockReturnValue(true);

      expect(detectPackageManager("/project")).toBe("pnpm");
    });
  });

  describe("validatePackageManager", () => {
    it("succeeds when package manager is installed", () => {
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));

      expect(() => validatePackageManager("npm")).not.toThrow();
      expect(mockExecFileSync).toHaveBeenCalledWith("npm", ["--version"], {
        stdio: "ignore",
      });
    });

    it("throws when package manager is not installed", () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error("command not found");
      });

      expect(() => validatePackageManager("pnpm")).toThrow(
        "Detected pnpm from lockfile but pnpm is not installed. Please install pnpm first.",
      );
    });

    it("validates each package manager type", () => {
      const managers: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

      for (const pm of managers) {
        mockExecFileSync.mockReturnValueOnce(Buffer.from("1.0.0"));
        expect(() => validatePackageManager(pm)).not.toThrow();
        expect(mockExecFileSync).toHaveBeenCalledWith(pm, ["--version"], {
          stdio: "ignore",
        });
      }
    });
  });

  describe("getInstallCommand", () => {
    it('returns "install" for npm', () => {
      expect(getInstallCommand("npm")).toBe("install");
    });

    it('returns "add" for pnpm', () => {
      expect(getInstallCommand("pnpm")).toBe("add");
    });

    it('returns "add" for yarn', () => {
      expect(getInstallCommand("yarn")).toBe("add");
    });

    it('returns "add" for bun', () => {
      expect(getInstallCommand("bun")).toBe("add");
    });
  });

  describe("getDevFlag", () => {
    it('returns "-D" for npm', () => {
      expect(getDevFlag("npm")).toBe("-D");
    });

    it('returns "-D" for pnpm', () => {
      expect(getDevFlag("pnpm")).toBe("-D");
    });

    it('returns "--dev" for yarn', () => {
      expect(getDevFlag("yarn")).toBe("--dev");
    });

    it('returns "-D" for bun', () => {
      expect(getDevFlag("bun")).toBe("-D");
    });
  });

  describe("getPackageRunnerArgs", () => {
    it('returns ["pnpm", ["dlx"]] for pnpm', () => {
      expect(getPackageRunnerArgs("pnpm")).toEqual(["pnpm", ["dlx"]]);
    });

    it('returns ["yarn", ["dlx"]] for yarn', () => {
      expect(getPackageRunnerArgs("yarn")).toEqual(["yarn", ["dlx"]]);
    });

    it('returns ["bunx", []] for bun', () => {
      expect(getPackageRunnerArgs("bun")).toEqual(["bunx", []]);
    });

    it('returns ["npx", []] for npm (default)', () => {
      expect(getPackageRunnerArgs("npm")).toEqual(["npx", []]);
    });
  });
});
