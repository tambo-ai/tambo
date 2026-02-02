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
  findFileInAncestors,
  formatPackageArgs,
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

  describe("findFileInAncestors", () => {
    it("should find file in current directory", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join("/project/subdir", "rush.json");
      });

      expect(findFileInAncestors("rush.json", "/project/subdir")).toBe(
        path.join("/project/subdir", "rush.json"),
      );
    });

    it("should find file in parent directory", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join("/project", "rush.json");
      });

      expect(findFileInAncestors("rush.json", "/project/subdir")).toBe(
        path.join("/project", "rush.json"),
      );
    });

    it("should find file in grandparent directory", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join("/project", "rush.json");
      });

      expect(findFileInAncestors("rush.json", "/project/packages/myapp")).toBe(
        path.join("/project", "rush.json"),
      );
    });

    it("should return null when file not found", () => {
      mockExistsSync.mockReturnValue(false);

      expect(findFileInAncestors("rush.json", "/project/subdir")).toBeNull();
    });
  });

  describe("detectPackageManager", () => {
    it("should detect rush when rush.json exists in current directory", () => {
      mockExistsSync.mockImplementation((filePath) => {
        return filePath === path.join(process.cwd(), "rush.json");
      });

      expect(detectPackageManager()).toBe("rush");
    });

    it("should detect rush when rush.json exists in ancestor directory", () => {
      const projectRoot = "/monorepo/packages/myapp";
      mockExistsSync.mockImplementation((filePath) => {
        // rush.json only exists at monorepo root
        return filePath === "/monorepo/rush.json";
      });

      expect(detectPackageManager(projectRoot)).toBe("rush");
    });

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

    it("should prioritize rush over all other package managers", () => {
      mockExistsSync.mockReturnValue(true);

      expect(detectPackageManager()).toBe("rush");
    });

    it("should prioritize pnpm over yarn and npm when rush.json does not exist", () => {
      mockExistsSync.mockImplementation((filePath) => {
        const fileName = path.basename(filePath as string);
        return (
          fileName === "pnpm-lock.yaml" ||
          fileName === "yarn.lock" ||
          fileName === "package-lock.json"
        );
      });

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
    it("should return ['update'] for rush", () => {
      expect(getInstallCommand("rush")).toEqual(["update"]);
    });

    it("should return ['add'] for pnpm", () => {
      expect(getInstallCommand("pnpm")).toEqual(["add"]);
    });

    it("should return ['install'] for npm", () => {
      expect(getInstallCommand("npm")).toEqual(["install"]);
    });

    it("should return ['add'] for yarn", () => {
      expect(getInstallCommand("yarn")).toEqual(["add"]);
    });
  });

  describe("formatPackageArgs", () => {
    it("should prepend -p to each package for rush", () => {
      expect(formatPackageArgs("rush", ["pkg1", "pkg2", "pkg3"])).toEqual([
        "-p",
        "pkg1",
        "-p",
        "pkg2",
        "-p",
        "pkg3",
      ]);
    });

    it("should return packages as-is for npm", () => {
      expect(formatPackageArgs("npm", ["pkg1", "pkg2"])).toEqual([
        "pkg1",
        "pkg2",
      ]);
    });

    it("should return packages as-is for pnpm", () => {
      expect(formatPackageArgs("pnpm", ["pkg1", "pkg2"])).toEqual([
        "pkg1",
        "pkg2",
      ]);
    });

    it("should return packages as-is for yarn", () => {
      expect(formatPackageArgs("yarn", ["pkg1", "pkg2"])).toEqual([
        "pkg1",
        "pkg2",
      ]);
    });

    it("should handle empty package array", () => {
      expect(formatPackageArgs("rush", [])).toEqual([]);
      expect(formatPackageArgs("npm", [])).toEqual([]);
    });

    it("should handle single package for rush", () => {
      expect(formatPackageArgs("rush", ["pkg1"])).toEqual(["-p", "pkg1"]);
    });
  });

  describe("getDevFlag", () => {
    it("should return '--dev' for rush", () => {
      expect(getDevFlag("rush")).toBe("--dev");
    });

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
    it("should return ['rushx', []] for rush", () => {
      expect(getPackageRunnerArgs("rush")).toEqual(["rushx", []]);
    });

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
