import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import path from "path";

// Mock fs module before importing the module under test
jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: jest.fn(),
  },
  existsSync: jest.fn(),
}));

// Import after mocking
const { default: fs } = await import("fs");
const {
  detectPackageManager,
  getDevFlag,
  getInstallCommand,
  getPackageRunnerArgs,
} = await import("./package-manager.js");

const mockExistsSync = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
>;

describe("package-manager", () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  describe("detectPackageManager", () => {
    it("should detect pnpm when pnpm-lock.yaml exists", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join(process.cwd(), "pnpm-lock.yaml");
      });

      expect(detectPackageManager()).toBe("pnpm");
    });

    it("should detect yarn when yarn.lock exists", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join(process.cwd(), "yarn.lock");
      });

      expect(detectPackageManager()).toBe("yarn");
    });

    it("should detect npm when package-lock.json exists", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join(process.cwd(), "package-lock.json");
      });

      expect(detectPackageManager()).toBe("npm");
    });

    it("should default to npm when no lockfile exists", () => {
      mockExistsSync.mockReturnValue(false);

      expect(detectPackageManager()).toBe("npm");
    });

    it("should prioritize pnpm over yarn and npm", () => {
      mockExistsSync.mockReturnValue(true);

      expect(detectPackageManager()).toBe("pnpm");
    });

    it("should prioritize yarn over npm when pnpm-lock.yaml does not exist", () => {
      mockExistsSync.mockImplementation((filePath) => {
        const fileName = path.basename(filePath as string);
        return fileName === "yarn.lock" || fileName === "package-lock.json";
      });

      expect(detectPackageManager()).toBe("yarn");
    });

    it("should use custom project root when provided", () => {
      const customRoot = "/custom/project";
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join(customRoot, "pnpm-lock.yaml");
      });

      expect(detectPackageManager(customRoot)).toBe("pnpm");
    });
  });

  describe("getInstallCommand", () => {
    it("should return 'add' for pnpm", () => {
      expect(getInstallCommand("pnpm")).toBe("add");
    });

    it("should return 'install' for npm", () => {
      expect(getInstallCommand("npm")).toBe("install");
    });

    it("should return 'add' for yarn", () => {
      expect(getInstallCommand("yarn")).toBe("add");
    });
  });

  describe("getDevFlag", () => {
    it("should return '-D' for pnpm", () => {
      expect(getDevFlag("pnpm")).toBe("-D");
    });

    it("should return '-D' for npm", () => {
      expect(getDevFlag("npm")).toBe("-D");
    });

    it("should return '--dev' for yarn", () => {
      expect(getDevFlag("yarn")).toBe("--dev");
    });
  });

  describe("getPackageRunnerArgs", () => {
    it("should return ['pnpm', ['dlx']] for pnpm", () => {
      expect(getPackageRunnerArgs("pnpm")).toEqual(["pnpm", ["dlx"]]);
    });

    it("should return ['npx', []] for npm", () => {
      expect(getPackageRunnerArgs("npm")).toEqual(["npx", []]);
    });

    it("should return ['yarn', ['dlx']] for yarn", () => {
      expect(getPackageRunnerArgs("yarn")).toEqual(["yarn", ["dlx"]]);
    });
  });
});
