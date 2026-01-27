import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { SafeExecFileSyncOptions } from "./interactive.js";

const mockSpawnSync = jest.fn();

jest.unstable_mockModule("cross-spawn", () => ({
  default: {
    sync: mockSpawnSync,
  },
}));

let interactive: {
  readonly execFileSync: (
    file: string,
    args: string[] | undefined,
    execOptions?: SafeExecFileSyncOptions,
  ) => string | Buffer;
  readonly isInteractive: (opts?: { stream?: NodeJS.WriteStream }) => boolean;
};

beforeAll(async () => {
  const module = await import("./interactive.js");
  interactive = {
    execFileSync: module.execFileSync,
    isInteractive: module.isInteractive,
  };
});

describe("isInteractive", () => {
  const stream = { isTTY: true } as unknown as NodeJS.WriteStream;

  let originalEnv: {
    TERM?: string;
    CI?: string;
    GITHUB_ACTIONS?: string;
    FORCE_INTERACTIVE?: string;
  };
  let originalStdinIsTTY: boolean | undefined;

  beforeEach(() => {
    originalEnv = {
      TERM: process.env.TERM,
      CI: process.env.CI,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
      FORCE_INTERACTIVE: process.env.FORCE_INTERACTIVE,
    };
    originalStdinIsTTY = process.stdin.isTTY;

    process.env.TERM = "xterm-256color";
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.FORCE_INTERACTIVE;

    // Mock stdin as TTY for tests (isInteractive checks both stdin and stdout)
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalEnv.TERM === undefined) delete process.env.TERM;
    else process.env.TERM = originalEnv.TERM;

    if (originalEnv.CI === undefined) delete process.env.CI;
    else process.env.CI = originalEnv.CI;

    if (originalEnv.GITHUB_ACTIONS === undefined)
      delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = originalEnv.GITHUB_ACTIONS;

    if (originalEnv.FORCE_INTERACTIVE === undefined)
      delete process.env.FORCE_INTERACTIVE;
    else process.env.FORCE_INTERACTIVE = originalEnv.FORCE_INTERACTIVE;

    // Restore stdin TTY status
    Object.defineProperty(process.stdin, "isTTY", {
      value: originalStdinIsTTY,
      writable: true,
      configurable: true,
    });
  });

  it("returns true for TTY streams with TERM set and no CI", () => {
    expect(interactive.isInteractive({ stream })).toBe(true);
  });

  it("treats CI=true as non-interactive by default", () => {
    process.env.CI = "true";
    expect(interactive.isInteractive({ stream })).toBe(false);
  });

  it("allows FORCE_INTERACTIVE=1 to override CI detection", () => {
    process.env.CI = "true";
    process.env.FORCE_INTERACTIVE = "1";
    expect(interactive.isInteractive({ stream })).toBe(true);
  });
});

describe("execFileSync", () => {
  beforeEach(() => {
    mockSpawnSync.mockReset();

    mockSpawnSync.mockReturnValue({
      status: 0,
      signal: null,
      stdout: Buffer.from("ok"),
      stderr: Buffer.alloc(0),
    });
  });

  describe("Windows allowlist normalization", () => {
    const originalPlatform = process.platform;

    beforeAll(() => {
      Object.defineProperty(process, "platform", { value: "win32" });
    });

    afterAll(() => {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
      });
    });

    it.each(["npm.cmd", "C:\\nodejs\\npm.cmd", "npx.exe", "YARN.BAT"])(
      "routes %s through cross-spawn",
      (binary) => {
        interactive.execFileSync(binary, ["--version"], {
          allowNonInteractive: true,
        });

        expect(mockSpawnSync).toHaveBeenCalledTimes(1);
      },
    );

    it("does not route unknown .cmd paths through cross-spawn", () => {
      try {
        interactive.execFileSync("C:\\tools\\custom.cmd", ["--version"], {
          allowNonInteractive: true,
        });
      } catch {
        // This path isn't expected to be runnable in unit tests; we only care that
        // it doesn't go through cross-spawn's package-manager allowlist.
      }

      expect(mockSpawnSync).not.toHaveBeenCalled();
    });

    it("throws when spawn returns an error", () => {
      const spawnError = new Error("spawn ENOENT");
      mockSpawnSync.mockReturnValue({
        status: null,
        signal: null,
        stdout: Buffer.from("partial output"),
        stderr: Buffer.from("error output"),
        error: spawnError,
      });

      expect(() =>
        interactive.execFileSync("npm.cmd", ["install"], {
          allowNonInteractive: true,
        }),
      ).toThrow("spawn ENOENT");
    });

    it("throws with stderr when command exits with non-zero status", () => {
      mockSpawnSync.mockReturnValue({
        status: 1,
        signal: null,
        stdout: Buffer.alloc(0),
        stderr: Buffer.from("npm ERR! code E404"),
      });

      expect(() =>
        interactive.execFileSync("npm.cmd", ["install", "nonexistent"], {
          allowNonInteractive: true,
        }),
      ).toThrow(
        /Command failed \(1\): npm\.cmd \["install","nonexistent"\][\s\S]*npm ERR!/,
      );
    });

    it("returns empty string when stdout is inherited", () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        signal: null,
        stdout: null,
        stderr: null,
      });

      const result = interactive.execFileSync("npm.cmd", ["--version"], {
        allowNonInteractive: true,
        stdio: "inherit",
        encoding: "utf-8",
      });

      expect(result).toBe("");
    });

    it("returns empty Buffer when stdout is inherited without encoding", () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        signal: null,
        stdout: null,
        stderr: null,
      });

      const result = interactive.execFileSync("npm.cmd", ["--version"], {
        allowNonInteractive: true,
        stdio: "inherit",
      });

      expect(Buffer.isBuffer(result)).toBe(true);
      expect((result as Buffer).length).toBe(0);
    });

    it("handles string encoding for stdout", () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        signal: null,
        stdout: "version output",
        stderr: null,
      });

      const result = interactive.execFileSync("npm.cmd", ["--version"], {
        allowNonInteractive: true,
        encoding: "utf-8",
      });

      expect(result).toBe("version output");
    });

    it("handles array stdio with pipe at index 1", () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        signal: null,
        stdout: Buffer.from("output"),
        stderr: null,
      });

      const result = interactive.execFileSync("npm.cmd", ["--version"], {
        allowNonInteractive: true,
        stdio: ["inherit", "pipe", "pipe"],
      });

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe("output");
    });

    it("handles array stdio with ignore at index 1", () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        signal: null,
        stdout: null,
        stderr: null,
      });

      const result = interactive.execFileSync("npm.cmd", ["--version"], {
        allowNonInteractive: true,
        stdio: ["inherit", "ignore", "pipe"],
      });

      expect(Buffer.isBuffer(result)).toBe(true);
      expect((result as Buffer).length).toBe(0);
    });
  });
});
