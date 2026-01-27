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

  beforeEach(() => {
    originalEnv = {
      TERM: process.env.TERM,
      CI: process.env.CI,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
      FORCE_INTERACTIVE: process.env.FORCE_INTERACTIVE,
    };

    process.env.TERM = "xterm-256color";
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.FORCE_INTERACTIVE;
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
  });
});
