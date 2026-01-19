/**
 * Tests for project command behavior and JSON output.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  captureStdout,
  getSubcommand,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockRequireAuthentication = jest.fn<
  (args: { json: boolean }, result: { errors: string[]; authenticated?: boolean }) => Promise<boolean>
>();
const mockWriteApiKeyToEnv = jest.fn<
  (apiKey: string, options: { jsonMode: boolean }) => { envFile: string }
>();

const mockApi = {
  project: {
    getUserProjects: {
      query: jest.fn<() => Promise<Array<{ id: string; name: string; createdAt: Date }>>>(),
    },
    createProject2: {
      mutate: jest.fn<() => Promise<{ id: string; name: string }>>(),
    },
    generateApiKey: {
      mutate: jest.fn<() => Promise<{ apiKey: string }>>(),
    },
  },
};

jest.unstable_mockModule("../utils/auth-helpers.js", () => ({
  requireAuthentication: mockRequireAuthentication,
}));

jest.unstable_mockModule("../utils/env-helpers.js", () => ({
  writeApiKeyToEnv: mockWriteApiKeyToEnv,
}));

jest.unstable_mockModule("../lib/api-client.js", () => ({
  api: mockApi,
}));

jest.unstable_mockModule("ora", () => ({
  default: jest.fn(() => ({
    start: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn(), stop: jest.fn() })),
  })),
}));

const { project } = await import("./project.js");

describe("project command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockRequireAuthentication.mockResolvedValue(true);
    mockApi.project.getUserProjects.query.mockResolvedValue([]);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.clearAllMocks();
  });

  it("exits when not authenticated", async () => {
    mockRequireAuthentication.mockResolvedValue(false);

    await expect(
      Promise.resolve(
        getSubcommand(project, "list")?.run?.({ args: withArgs({ json: true }) })
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("lists projects in json mode", async () => {
    mockApi.project.getUserProjects.query.mockResolvedValue([
      { id: "p1", name: "Project 1", createdAt: new Date("2024-01-01") },
    ]);

    const output = await captureStdout(async () => {
      await getSubcommand(project, "list")?.run?.({ args: withArgs({ json: true }) });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.projects[0].id).toBe("p1");
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);
    mockApi.project.getUserProjects.query.mockResolvedValue([]);

    const output = await captureStdout(async () => {
      await getSubcommand(project, "list")?.run?.({ args: withArgs({ json: true }) });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);
    mockApi.project.getUserProjects.query.mockResolvedValue([]);

    const output = await captureStdout(async () => {
      await getSubcommand(project, "list")?.run?.({ args: withArgs({ json: true }) });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("creates project with provided name", async () => {
    mockApi.project.createProject2.mutate.mockResolvedValue({
      id: "p1",
      name: "My Project",
    });

    const output = await captureStdout(async () => {
      await getSubcommand(project, "create")?.run?.({
        args: withArgs({ json: true, name: "My Project" }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.project.name).toBe("My Project");
  });

  it("creates project with cwd name by default", async () => {
    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("/tmp/sample-project");
    mockApi.project.createProject2.mutate.mockResolvedValue({
      id: "p2",
      name: "sample-project",
    });

    const output = await captureStdout(async () => {
      await getSubcommand(project, "create")?.run?.({ args: withArgs({ json: true }) });
    });
    const result = JSON.parse(output);

    expect(result.project.name).toBe("sample-project");
    cwdSpy.mockRestore();
  });

  it("generates API key and does not include key in json output", async () => {
    mockApi.project.generateApiKey.mutate.mockResolvedValue({ apiKey: "secret" });
    mockWriteApiKeyToEnv.mockReturnValue({ envFile: ".env.local" });

    const output = await captureStdout(async () => {
      await getSubcommand(project, "api-key")?.run?.({
        args: withArgs({ json: true, projectId: "p1", "no-save": false }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.envFile).toBe(".env.local");
    expect(result.apiKey).toBeUndefined();
  });

  it("respects --no-save for api-key generation", async () => {
    mockApi.project.generateApiKey.mutate.mockResolvedValue({ apiKey: "secret" });

    const output = await captureStdout(async () => {
      await getSubcommand(project, "api-key")?.run?.({
        args: withArgs({ json: true, projectId: "p1", "no-save": true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(mockWriteApiKeyToEnv).not.toHaveBeenCalled();
    expect(result.apiKeySet).toBe(true);
  });

  // Non-JSON output tests - lightweight, verify commands run without crashing
  describe("non-JSON output", () => {
    it("runs list with no projects", async () => {
      mockApi.project.getUserProjects.query.mockResolvedValue([]);

      await captureStdout(async () => {
        await getSubcommand(project, "list")?.run?.({ args: withArgs({ json: false }) });
      });
    });

    it("runs list with projects", async () => {
      mockApi.project.getUserProjects.query.mockResolvedValue([
        { id: "p1", name: "Project 1", createdAt: new Date("2024-01-01") },
        { id: "p2", name: "Project 2", createdAt: new Date("2024-02-01") },
      ]);

      await captureStdout(async () => {
        await getSubcommand(project, "list")?.run?.({ args: withArgs({ json: false }) });
      });
    });

    it("handles list error in non-JSON mode", async () => {
      mockApi.project.getUserProjects.query.mockRejectedValue(new Error("Network error"));

      await expect(
        Promise.resolve(
          getSubcommand(project, "list")?.run?.({ args: withArgs({ json: false }) })
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("runs create in non-JSON mode", async () => {
      mockApi.project.createProject2.mutate.mockResolvedValue({
        id: "p1",
        name: "My Project",
      });

      await captureStdout(async () => {
        await getSubcommand(project, "create")?.run?.({
          args: withArgs({ json: false, name: "My Project" }),
        });
      });
    });

    it("handles create error in non-JSON mode", async () => {
      mockApi.project.createProject2.mutate.mockRejectedValue(new Error("Create failed"));

      await expect(
        Promise.resolve(
          getSubcommand(project, "create")?.run?.({
            args: withArgs({ json: false, name: "My Project" }),
          })
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("runs api-key with save in non-JSON mode", async () => {
      mockApi.project.generateApiKey.mutate.mockResolvedValue({ apiKey: "secret123" });
      mockWriteApiKeyToEnv.mockReturnValue({ envFile: ".env.local" });

      await captureStdout(async () => {
        await getSubcommand(project, "api-key")?.run?.({
          args: withArgs({ json: false, projectId: "p1", "no-save": false }),
        });
      });
    });

    it("runs api-key with --no-save in non-JSON mode", async () => {
      mockApi.project.generateApiKey.mutate.mockResolvedValue({ apiKey: "secret123" });

      await captureStdout(async () => {
        await getSubcommand(project, "api-key")?.run?.({
          args: withArgs({ json: false, projectId: "p1", "no-save": true }),
        });
      });
    });

    it("handles api-key error in non-JSON mode", async () => {
      mockApi.project.generateApiKey.mutate.mockRejectedValue(new Error("Key gen failed"));

      await expect(
        Promise.resolve(
          getSubcommand(project, "api-key")?.run?.({
            args: withArgs({ json: false, projectId: "p1", "no-save": false }),
          })
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });
  });
});
