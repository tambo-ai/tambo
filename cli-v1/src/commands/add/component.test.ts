import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();
const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockCopyFileSync = jest.fn();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
    copyFileSync: mockCopyFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  copyFileSync: mockCopyFileSync,
}));

const mockExecFileSync = jest.fn();
jest.unstable_mockModule("../../utils/interactive.js", () => ({
  execFileSync: mockExecFileSync,
  isInteractive: jest.fn(() => false),
}));

const mockDetectPackageManager = jest.fn<() => "npm" | "yarn" | "pnpm" | "bun">();
const mockGetInstallCommand = jest.fn<() => string>();
const mockGetDevFlag = jest.fn<() => string>();
jest.unstable_mockModule("../../utils/package-manager.js", () => ({
  detectPackageManager: mockDetectPackageManager,
  getInstallCommand: mockGetInstallCommand,
  getDevFlag: mockGetDevFlag,
}));

const mockGetComponentDirectoryPath = jest.fn<(projectRoot: string, installPath: string, isExplicit: boolean) => string>();
const mockGetLibDirectory = jest.fn<(projectRoot: string, installPath: string, isExplicit: boolean) => string>();
jest.unstable_mockModule("../../utils/path-utils.js", () => ({
  getComponentDirectoryPath: mockGetComponentDirectoryPath,
  getLibDirectory: mockGetLibDirectory,
}));

const mockUpdateImportPaths = jest.fn<(content: string, location: string) => string>();
jest.unstable_mockModule("../migrate-core.js", () => ({
  updateImportPaths: mockUpdateImportPaths,
}));

const mockInstallSkill = jest.fn<() => Promise<void>>();
jest.unstable_mockModule("../shared/skill-install.js", () => ({
  installSkill: mockInstallSkill,
}));

const mockComponentExists = jest.fn<() => boolean>();
const mockGetConfigPath = jest.fn<() => string>();
const mockGetRegistryPath = jest.fn<() => string>();
jest.unstable_mockModule("./utils.js", () => ({
  componentExists: mockComponentExists,
  getConfigPath: mockGetConfigPath,
  getRegistryPath: mockGetRegistryPath,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const { installComponents } = await import("./component.js");

describe("add/component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Default setup - reset execFileSync to not throw
    mockExecFileSync.mockReset();
    mockDetectPackageManager.mockReturnValue("npm");
    mockGetInstallCommand.mockReturnValue("install");
    mockGetDevFlag.mockReturnValue("-D");
    mockGetComponentDirectoryPath.mockReturnValue("/project/src/tambo");
    mockGetLibDirectory.mockReturnValue("/project/src/lib");
    mockComponentExists.mockReturnValue(true);
    mockGetConfigPath.mockReturnValue("/registry/button/config.json");
    mockGetRegistryPath.mockReturnValue("/registry/button");
    mockUpdateImportPaths.mockImplementation((content) => content);
    mockInstallSkill.mockResolvedValue(undefined);
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation((p) => {
      const path = String(p);
      if (path.includes("package.json")) {
        return JSON.stringify({ dependencies: {}, devDependencies: {} });
      }
      if (path.includes("config.json")) {
        return JSON.stringify({
          name: "button",
          dependencies: ["react"],
          devDependencies: [],
          files: [
            { name: "button.tsx", content: "export const Button = () => null;" },
          ],
        });
      }
      return "";
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("installComponents", () => {
    it("throws error when component not found in registry", async () => {
      mockComponentExists.mockReturnValue(false);

      await expect(installComponents(["nonexistent"])).rejects.toThrow(
        /not found in registry/,
      );
    });

    it("creates component directory if not exists", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("/project/src/lib")) return true;
        if (path.includes("/project/src/lib/utils.ts")) return true;
        if (path.includes("/project/src/tambo/button.tsx")) return false;
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], { silent: true, skipAgentDocs: true });

      expect(mockMkdirSync).toHaveBeenCalledWith("/project/src/tambo", {
        recursive: true,
      });
    });

    it("creates lib directory if not exists", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("/project/src/lib")) return false;
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], { silent: true, skipAgentDocs: true });

      expect(mockMkdirSync).toHaveBeenCalledWith("/project/src/lib", {
        recursive: true,
      });
    });

    it("creates utils.ts if not exists", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("utils.ts")) return false;
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], { silent: true, skipAgentDocs: true });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/project/src/lib/utils.ts",
        expect.stringContaining("cn("),
      );
    });

    it("installs production dependencies", async () => {
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: {}, devDependencies: {} });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: ["react", "framer-motion"],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "";
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      expect(mockExecFileSync).toHaveBeenCalledWith(
        "npm",
        ["install", "react", "framer-motion"],
        expect.any(Object),
      );
    });

    it("installs dev dependencies", async () => {
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: {}, devDependencies: {} });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: ["@types/react"],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "";
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      expect(mockExecFileSync).toHaveBeenCalledWith(
        "npm",
        expect.arrayContaining(["install", "-D"]),
        expect.any(Object),
      );
    });

    it("skips already installed dependencies", async () => {
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: ["react"],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "";
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      // Should not install react since it's already installed
      const prodDepCalls = mockExecFileSync.mock.calls.filter(
        (call) => Array.isArray(call[1]) && call[1].includes("react"),
      );
      expect(prodDepCalls.length).toBe(0);
    });

    it("copies component files", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx") && path.includes("/project")) return false;
        return true;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "export const Button = () => null;";
      });

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("button.tsx"),
        expect.any(String),
      );
    });

    it("skips existing component files without forceUpdate", async () => {
      // All files exist
      mockExistsSync.mockReturnValue(true);

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      // Should not write component file since it exists
      const componentWriteCalls = mockWriteFileSync.mock.calls.filter(
        (call) => String(call[0]).includes("button.tsx"),
      );
      expect(componentWriteCalls.length).toBe(0);
    });

    it("overwrites existing files with forceUpdate option", async () => {
      // Files exist
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "export const Button = () => null;";
      });

      await installComponents(["button"], { forceUpdate: true, silent: true, skipAgentDocs: true });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("button.tsx"),
        expect.any(String),
      );
    });

    it("updates import paths for tsx files", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx") && path.includes("/project")) return false;
        return true;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "export const Button = () => null;";
      });

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      expect(mockUpdateImportPaths).toHaveBeenCalled();
    });

    it("handles multiple components", async () => {
      mockComponentExists.mockReturnValue(true);
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        return JSON.stringify({
          name: path.includes("card") ? "card" : "button",
          dependencies: [],
          devDependencies: [],
          files: [{ name: path.includes("card") ? "card.tsx" : "button.tsx", content: "export default null;" }],
        });
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes(".tsx") && path.includes("/project")) return false;
        return true;
      });

      await installComponents(["button", "card"], { yes: true, silent: true, skipAgentDocs: true });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("button.tsx"),
        expect.any(String),
      );
    });

    it("logs installation message when not silent", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx") && path.includes("/project")) return false;
        return true;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "export const Button = () => null;" }],
          });
        }
        return "export const Button = () => null;";
      });

      await installComponents(["button"], { yes: true, skipAgentDocs: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Installed"),
      );
    });

    it("handles dependency installation failure", async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error("npm install failed");
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx")) return false;
        return true;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: {}, devDependencies: {} });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: ["new-dep"],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "" }],
          });
        }
        return "";
      });

      await expect(
        installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true }),
      ).rejects.toThrow(/Failed to install dependencies/);
    });

    it("uses custom install path", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx")) return false;
        return true;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "" }],
          });
        }
        return "";
      });

      await installComponents(["button"], {
        installPath: "custom/path",
        yes: true,
        silent: true,
        skipAgentDocs: true,
      });

      expect(mockGetComponentDirectoryPath).toHaveBeenCalledWith(
        expect.any(String),
        "custom/path",
        false,
      );
    });

    it("uses --legacy-peer-deps flag for npm", async () => {
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: {}, devDependencies: {} });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: ["some-dep"],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "" }],
          });
        }
        return "";
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx")) return false;
        return true;
      });

      await installComponents(["button"], {
        legacyPeerDeps: true,
        yes: true,
        silent: true,
        skipAgentDocs: true,
      });

      expect(mockExecFileSync).toHaveBeenCalledWith(
        "npm",
        expect.arrayContaining(["--legacy-peer-deps"]),
        expect.any(Object),
      );
    });

    it("handles lib files correctly", async () => {
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [
              { name: "button.tsx", content: "" },
              { name: "lib/helper.ts", content: "" },
            ],
          });
        }
        return "";
      });
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx") && path.includes("/project")) return false;
        if (path.includes("helper.ts") && path.includes("/project")) return false;
        return true;
      });

      await installComponents(["button"], { yes: true, silent: true, skipAgentDocs: true });

      // lib file should be written to lib directory
      const libFileCalls = mockWriteFileSync.mock.calls.filter(
        (call) => String(call[0]).includes("helper.ts"),
      );
      expect(libFileCalls.length).toBe(1);
    });

    it("calls installSkill when not skipped", async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("button.tsx") && path.includes("/project")) return false;
        return true;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("package.json")) {
          return JSON.stringify({ dependencies: { react: "^18" }, devDependencies: { tailwindcss: "^3" } });
        }
        if (path.includes("config.json")) {
          return JSON.stringify({
            name: "button",
            dependencies: [],
            devDependencies: [],
            files: [{ name: "button.tsx", content: "" }],
          });
        }
        return "";
      });

      await installComponents(["button"], { yes: true });

      expect(mockInstallSkill).toHaveBeenCalled();
    });
  });
});
