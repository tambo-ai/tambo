import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown) => string>();

const mockOraStart = jest.fn();
const mockOraStop = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraFail = jest.fn();
const mockOraInfo = jest.fn();
const mockOra = jest.fn(() => ({
  start: mockOraStart.mockReturnThis(),
  stop: mockOraStop,
  succeed: mockOraSucceed,
  fail: mockOraFail,
  info: mockOraInfo,
  text: "",
}));

const mockExecFileSync =
  jest.fn<(cmd: string, args?: string[], opts?: unknown) => Buffer | string>();
const mockDetectPackageManager =
  jest.fn<() => "npm" | "pnpm" | "yarn" | "bun">();
const mockGetInstallCommand = jest.fn<() => string>();
const mockGetPackageRunnerArgs = jest.fn<() => [string, string[]]>();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

jest.unstable_mockModule("../../utils/interactive.js", () => ({
  execFileSync: mockExecFileSync,
}));

jest.unstable_mockModule("../../utils/package-manager.js", () => ({
  detectPackageManager: mockDetectPackageManager,
  getInstallCommand: mockGetInstallCommand,
  getPackageRunnerArgs: mockGetPackageRunnerArgs,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

const { upgradeNpmPackages } = await import("./npm-packages.js");

describe("upgrade/npm-packages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    mockDetectPackageManager.mockReturnValue("npm");
    mockGetInstallCommand.mockReturnValue("install");
    mockGetPackageRunnerArgs.mockReturnValue(["npx", []]);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("upgradeNpmPackages", () => {
    it("fails when package.json does not exist", async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      expect(result).toBe(false);
      expect(mockOraFail).toHaveBeenCalledWith(
        "No package.json found in the current directory",
      );
    });

    it("fails when package runner is not available", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      expect(result).toBe(false);
      expect(mockOraFail).toHaveBeenCalledWith(
        "npx is required but not available",
      );
    });

    it("skips when no safe packages are installed", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "some-other-package": "1.0.0",
          },
        }),
      );

      const result = await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      expect(result).toBe(true);
      expect(mockOraInfo).toHaveBeenCalledWith(
        "No packages found to update. Skipping package updates.",
      );
    });

    it("runs npm-check-updates for installed safe packages", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@tambo-ai/react": "1.0.0",
          },
        }),
      );

      const result = await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      expect(result).toBe(true);
      expect(mockExecFileSync).toHaveBeenCalled();
      expect(mockOraSucceed).toHaveBeenCalled();
    });

    it("uses interactive mode when not --yes", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@tambo-ai/react": "1.0.0",
          },
        }),
      );

      await upgradeNpmPackages({
        yes: false,
        prefix: "src",
      });

      // Verify interactive flag was included
      const ncuCall = mockExecFileSync.mock.calls.find((call) =>
        call[1]?.includes("npm-check-updates"),
      );
      expect(ncuCall?.[1]).toContain("--interactive");
    });

    it("adds --legacy-peer-deps for npm when option is set", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@tambo-ai/react": "1.0.0",
          },
        }),
      );

      await upgradeNpmPackages({
        yes: true,
        prefix: "src",
        legacyPeerDeps: true,
      });

      // Find the install call
      const installCall = mockExecFileSync.mock.calls.find(
        (call) => call[0] === "npm" && call[1]?.includes("install"),
      );
      expect(installCall?.[1]).toContain("--legacy-peer-deps");
    });

    it("handles errors gracefully", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync
        .mockReturnValueOnce(Buffer.from("1.0.0")) // version check
        .mockImplementationOnce(() => {
          throw new Error("NCU failed");
        });
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@tambo-ai/react": "1.0.0",
          },
        }),
      );

      const result = await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      expect(result).toBe(false);
      expect(mockOraFail).toHaveBeenCalled();
    });

    it("uses correct package manager", async () => {
      mockDetectPackageManager.mockReturnValue("pnpm");
      mockGetPackageRunnerArgs.mockReturnValue(["pnpm", ["dlx"]]);
      mockGetInstallCommand.mockReturnValue("add");
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@tambo-ai/react": "1.0.0",
          },
        }),
      );

      await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      // Verify pnpm was used
      expect(mockExecFileSync).toHaveBeenCalledWith(
        "pnpm",
        expect.arrayContaining(["dlx"]),
        expect.anything(),
      );
    });

    it("checks devDependencies as well", async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecFileSync.mockReturnValue(Buffer.from("1.0.0"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            "@tambo-ai/react": "1.0.0",
          },
        }),
      );

      const result = await upgradeNpmPackages({
        yes: true,
        prefix: "src",
      });

      expect(result).toBe(true);
      expect(mockExecFileSync).toHaveBeenCalled();
    });
  });
});
