import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

const execFileSyncCalls: { args: string[]; file: string }[] = [];
const mockRmSync = jest.fn((...args: Parameters<typeof memfsFs.rmSync>) =>
  memfsFs.rmSync(...args),
);

const mockExecFileSync = (file: string, args: readonly string[] = []) => {
  const commandArgs = [...args];
  execFileSyncCalls.push({ args: commandArgs, file });

  if (file === "git" && commandArgs[0] === "clone") {
    const targetDir = commandArgs.at(-1);
    if (!targetDir) {
      throw new Error("Expected git clone target directory");
    }

    memfsFs.mkdirSync(`${targetDir}/.git`, { recursive: true });
    memfsFs.writeFileSync(`${targetDir}/.git/HEAD`, "ref: refs/heads/main");
    memfsFs.writeFileSync(`${targetDir}/package.json`, "{}");
  }

  return Buffer.alloc(0);
};

jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: { ...memfsFs, rmSync: mockRmSync },
  rmSync: mockRmSync,
}));

jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: () => ({
      fail: () => {},
      succeed: () => {},
    }),
  }),
}));

jest.unstable_mockModule("../utils/interactive.js", () => ({
  execFileSync: mockExecFileSync,
  GuidanceError: class GuidanceError extends Error {},
  interactivePrompt: async () => ({}),
  isInteractive: () => false,
}));

jest.unstable_mockModule("../utils/package-manager.js", () => ({
  detectPackageManager: () => "npm",
  getInstallCommand: () => ["install"],
  validatePackageManager: () => {},
}));

const { handleCreateApp, safeRemoveGitFolder } =
  await import("./create-app.js");

describe("handleCreateApp", () => {
  let originalChdir: typeof process.chdir;
  let originalCwd: typeof process.cwd;
  let workingDirectory: string;

  beforeEach(() => {
    vol.reset();
    execFileSyncCalls.length = 0;
    mockRmSync.mockClear();
    workingDirectory = "/workspace";
    memfsFs.mkdirSync(workingDirectory, { recursive: true });

    originalChdir = process.chdir;
    originalCwd = process.cwd;
    process.chdir = (directory: string) => {
      workingDirectory = directory;
    };
    process.cwd = () => workingDirectory;
  });

  afterEach(() => {
    process.chdir = originalChdir;
    process.cwd = originalCwd;
    vol.reset();
  });

  it("passes project setup commands as separate argument values", async () => {
    await handleCreateApp({ name: "safe-app", template: "standard" });

    expect(execFileSyncCalls).toEqual([
      {
        args: [
          "clone",
          "--depth",
          "1",
          "https://github.com/tambo-ai/tambo-template.git",
          "/workspace/safe-app",
        ],
        file: "git",
      },
      { args: ["init", "--initial-branch=main"], file: "git" },
      { args: ["add", "."], file: "git" },
      {
        args: ["commit", "-m", "Initial commit from Tambo standard template"],
        file: "git",
      },
      { args: ["install"], file: "npm" },
    ]);
    expect(mockRmSync).toHaveBeenCalledWith("/workspace/safe-app/.git", {
      force: true,
      maxRetries: 3,
      recursive: true,
      retryDelay: 100,
    });
  });

  it("refuses to remove a directory that is not named .git", () => {
    memfsFs.mkdirSync("/workspace/not-a-git", { recursive: true });

    safeRemoveGitFolder("/workspace/not-a-git");

    expect(mockRmSync).not.toHaveBeenCalled();
    expect(memfsFs.existsSync("/workspace/not-a-git")).toBe(true);
  });
});
