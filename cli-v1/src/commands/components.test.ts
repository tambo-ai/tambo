/**
 * Tests for components command behavior and JSON output.
 */

import fs from "fs";
import path from "path";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  captureStdout,
  getSubcommand,
  mockFs,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockGetKnownComponentNames = jest.fn<() => Set<string>>();
const mockGetComponentList =
  jest.fn<() => Array<{ name: string; description: string }>>();
const mockResolveComponentDependencies =
  jest.fn<(name: string) => Promise<string[]>>();

jest.unstable_mockModule("../constants/paths.js", () => ({
  COMPONENT_SUBDIR: "tambo",
  LEGACY_COMPONENT_SUBDIR: "ui",
}));

jest.unstable_mockModule("./add/utils.js", () => ({
  getKnownComponentNames: mockGetKnownComponentNames,
  getComponentList: mockGetComponentList,
}));

jest.unstable_mockModule("../utils/dependency-resolution.js", () => ({
  resolveComponentDependencies: mockResolveComponentDependencies,
}));

const { components } = await import("./components.js");

describe("components command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockGetKnownComponentNames.mockReturnValue(
      new Set(["message-thread-full"]),
    );
    mockGetComponentList.mockReturnValue([
      { name: "message-thread-full", description: "Thread UI" },
      { name: "message-input", description: "Input UI" },
    ]);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.restoreAllMocks();
  });

  it("returns installed components in json mode", async () => {
    const base = path.join(process.cwd(), "src/components");
    mockFs({
      [path.join(base, "tambo", "message-thread-full.tsx")]: "",
      [path.join(base, "tambo", "custom.tsx")]: "",
    });
    jest.spyOn(fs, "existsSync").mockImplementation((filePath) => {
      return String(filePath).includes(path.join("src", "components", "tambo"));
    });
    jest
      .spyOn(fs, "readdirSync")
      .mockImplementation(((_dir) => [
        "message-thread-full.tsx",
        "custom.tsx",
      ]) as typeof fs.readdirSync);

    const output = await captureStdout(async () => {
      await getSubcommand(components, "installed")?.run?.({
        args: withArgs({ json: true, prefix: "src/components" }),
      });
    });
    const result = JSON.parse(output);

    expect(result.tamboComponents).toHaveLength(1);
    expect(result.customComponents).toHaveLength(1);
  });

  it("returns available components with installed flags", async () => {
    const base = path.join(process.cwd(), "src/components");
    mockFs({
      [path.join(base, "tambo", "message-thread-full.tsx")]: "",
    });
    jest.spyOn(fs, "existsSync").mockImplementation((filePath) => {
      return String(filePath).includes(path.join("src", "components", "tambo"));
    });
    jest
      .spyOn(fs, "readdirSync")
      .mockImplementation(((_dir) => [
        "message-thread-full.tsx",
      ]) as typeof fs.readdirSync);

    const output = await captureStdout(async () => {
      await getSubcommand(components, "available")?.run?.({
        args: withArgs({ json: true, prefix: "src/components" }),
      });
    });
    const result = JSON.parse(output);

    const installed = result.components.find(
      (c: { name: string }) => c.name === "message-thread-full",
    );
    expect(installed.installed).toBe(true);
  });

  it("exits when deps component is invalid", async () => {
    mockGetComponentList.mockReturnValue([{ name: "known", description: "" }]);

    await expect(
      Promise.resolve(
        getSubcommand(components, "deps")?.run?.({
          args: withArgs({ json: true, component: "nope" }),
        }),
      ),
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("returns dependencies list in json mode", async () => {
    mockResolveComponentDependencies.mockResolvedValue([
      "message-thread-full",
      "message-input",
    ]);

    const output = await captureStdout(async () => {
      await getSubcommand(components, "deps")?.run?.({
        args: withArgs({ json: true, component: "message-thread-full" }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.dependencies).toEqual([
      "message-thread-full",
      "message-input",
    ]);
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);
    mockFs({});

    const output = await captureStdout(async () => {
      await getSubcommand(components, "available")?.run?.({
        args: withArgs({ json: true, prefix: "src/components" }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);
    mockFs({});

    const output = await captureStdout(async () => {
      await getSubcommand(components, "available")?.run?.({
        args: withArgs({ json: true, prefix: "src/components" }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  // Non-JSON mode tests
  describe("non-JSON output", () => {
    it("displays installed components in non-JSON mode", async () => {
      const base = path.join(process.cwd(), "src/components");
      mockFs({
        [path.join(base, "tambo", "message-thread-full.tsx")]: "",
        [path.join(base, "tambo", "custom.tsx")]: "",
      });
      jest.spyOn(fs, "existsSync").mockImplementation((filePath) => {
        return String(filePath).includes(
          path.join("src", "components", "tambo"),
        );
      });
      jest
        .spyOn(fs, "readdirSync")
        .mockImplementation(((_dir) => [
          "message-thread-full.tsx",
          "custom.tsx",
        ]) as typeof fs.readdirSync);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "installed")?.run?.({
          args: withArgs({ json: false, prefix: "src/components" }),
        });
      });

      expect(output).toContain("INSTALLED");
      expect(output).toContain("message-thread-full");
    });

    it("displays legacy components in non-JSON mode", async () => {
      jest.spyOn(fs, "existsSync").mockImplementation((filePath) => {
        return String(filePath).includes(path.join("src", "components", "ui"));
      });
      jest
        .spyOn(fs, "readdirSync")
        .mockImplementation(((_dir) => [
          "message-thread-full.tsx",
        ]) as typeof fs.readdirSync);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "installed")?.run?.({
          args: withArgs({ json: false, prefix: "src/components" }),
        });
      });

      expect(output).toContain("message-thread-full");
    });

    it("displays available components in non-JSON mode", async () => {
      jest.spyOn(fs, "existsSync").mockReturnValue(false);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "available")?.run?.({
          args: withArgs({ json: false, prefix: "src/components" }),
        });
      });

      expect(output).toContain("AVAILABLE");
      expect(output).toContain("message-thread-full");
      expect(output).toContain("message-input");
    });

    it("displays already installed components in available command", async () => {
      jest.spyOn(fs, "existsSync").mockImplementation((filePath) => {
        return String(filePath).includes(
          path.join("src", "components", "tambo"),
        );
      });
      jest
        .spyOn(fs, "readdirSync")
        .mockImplementation(((_dir) => [
          "message-thread-full.tsx",
        ]) as typeof fs.readdirSync);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "available")?.run?.({
          args: withArgs({ json: false, prefix: "src/components" }),
        });
      });

      expect(output).toContain("ALREADY INSTALLED");
    });

    it("displays deps in non-JSON mode with standalone component", async () => {
      mockResolveComponentDependencies.mockResolvedValue([
        "message-thread-full",
      ]);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "deps")?.run?.({
          args: withArgs({ json: false, component: "message-thread-full" }),
        });
      });

      expect(output).toContain("DEPENDENCIES");
      expect(output).toContain("standalone");
    });

    it("displays deps in non-JSON mode with multiple dependencies", async () => {
      mockResolveComponentDependencies.mockResolvedValue([
        "message-thread-full",
        "message-input",
      ]);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "deps")?.run?.({
          args: withArgs({ json: false, component: "message-thread-full" }),
        });
      });

      expect(output).toContain("DEPENDENCIES");
      expect(output).toContain("WILL INSTALL");
    });

    it("displays error for unknown component in deps non-JSON mode", async () => {
      mockGetComponentList.mockReturnValue([
        { name: "known", description: "" },
      ]);

      await expect(
        Promise.resolve(
          getSubcommand(components, "deps")?.run?.({
            args: withArgs({ json: false, component: "nope" }),
          }),
        ),
      ).rejects.toBeInstanceOf(ProcessExitError);

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("handles error during dependency resolution in non-JSON mode", async () => {
      mockResolveComponentDependencies.mockRejectedValue(
        new Error("Resolution failed"),
      );

      await expect(
        Promise.resolve(
          getSubcommand(components, "deps")?.run?.({
            args: withArgs({ json: false, component: "message-thread-full" }),
          }),
        ),
      ).rejects.toBeInstanceOf(ProcessExitError);

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("displays no components message when none installed", async () => {
      jest.spyOn(fs, "existsSync").mockReturnValue(false);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "installed")?.run?.({
          args: withArgs({ json: false, prefix: "src/components" }),
        });
      });

      expect(output).toContain("No Tambo components installed");
    });

    it("shows component paths when using custom prefix", async () => {
      mockGetKnownComponentNames.mockReturnValue(
        new Set(["message-thread-full"]),
      );
      jest.spyOn(fs, "existsSync").mockImplementation((filePath) => {
        return String(filePath).includes(path.join("custom", "path", "tambo"));
      });
      jest
        .spyOn(fs, "readdirSync")
        .mockImplementation(((_dir) => [
          "message-thread-full.tsx",
        ]) as typeof fs.readdirSync);

      const output = await captureStdout(async () => {
        await getSubcommand(components, "installed")?.run?.({
          args: withArgs({ json: false, prefix: "custom/path" }),
        });
      });

      expect(output).toContain("message-thread-full.tsx");
    });
  });
});
