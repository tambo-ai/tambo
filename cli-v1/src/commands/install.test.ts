/**
 * Tests for install command behavior and JSON output.
 */

import fs from "fs";
import path from "path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  captureStdout,
  makeContext,
  mockFs,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockRequirePackageJson = jest.fn<
  (args: { json: boolean }, result: { errors: string[] }) => boolean
>();
const mockResolveComponentDependencies = jest.fn<(name: string) => Promise<string[]>>();
const mockGetComponentDirectoryPath = jest.fn<
  (root: string, prefix: string, isExplicitPrefix: boolean) => string
>();
const mockGetLegacyComponentDirectoryPath = jest.fn<
  (root: string, prefix: string) => string
>();
const mockResolveComponentPaths = jest.fn<
  (
    root: string,
    installPath: string,
    componentName: string,
    isExplicitPrefix: boolean
  ) => { newPath: string; legacyPath?: string }
>();
const mockInstallComponents = jest.fn<
  (components: string[], options: Record<string, unknown>) => Promise<void>
>();
const mockSetupTailwind = jest.fn<(root: string) => Promise<void>>();
const mockGetKnownComponentNames = jest.fn<() => Set<string>>();
const mockGetComponentList = jest.fn<() => Array<{ name: string; description: string }>>();

jest.unstable_mockModule("../utils/project-helpers.js", () => ({
  requirePackageJson: mockRequirePackageJson,
}));

jest.unstable_mockModule("../constants/paths.js", () => ({
  COMPONENT_SUBDIR: "tambo",
  LEGACY_COMPONENT_SUBDIR: "ui",
}));

jest.unstable_mockModule("../utils/dependency-resolution.js", () => ({
  resolveComponentDependencies: mockResolveComponentDependencies,
}));

jest.unstable_mockModule("../utils/path-utils.js", () => ({
  getComponentDirectoryPath: mockGetComponentDirectoryPath,
  getLegacyComponentDirectoryPath: mockGetLegacyComponentDirectoryPath,
  resolveComponentPaths: mockResolveComponentPaths,
}));

jest.unstable_mockModule("./add/component.js", () => ({
  installComponents: mockInstallComponents,
}));

jest.unstable_mockModule("./add/tailwind-setup.js", () => ({
  setupTailwindAndGlobals: mockSetupTailwind,
}));

jest.unstable_mockModule("./add/utils.js", () => ({
  getKnownComponentNames: mockGetKnownComponentNames,
  getComponentList: mockGetComponentList,
}));

const { install } = await import("./install.js");

describe("install command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = mockProcessExit();
    mockRequirePackageJson.mockReturnValue(true);
    mockGetComponentList.mockReturnValue([
      { name: "message-thread-full", description: "Thread UI" },
      { name: "message-input", description: "Input UI" },
    ]);
    mockGetKnownComponentNames.mockReturnValue(new Set(["message-thread-full"]));
    mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);
    mockGetComponentDirectoryPath.mockReturnValue("/tmp/components/tambo");
    mockGetLegacyComponentDirectoryPath.mockReturnValue("/tmp/components/ui");
    mockResolveComponentPaths.mockImplementation(
      (_root: string, _installPath: string, comp: string) => ({
        newPath: `/tmp/components/tambo/${comp}.tsx`,
        legacyPath: undefined,
      })
    );
    jest
      .spyOn(fs, "readdirSync")
      .mockReturnValue([] as ReturnType<typeof fs.readdirSync>);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.restoreAllMocks();
  });

  it("exits when no package.json", async () => {
    mockRequirePackageJson.mockReturnValue(false);

    await expect(
      Promise.resolve(
        install.run?.(
          makeContext(
            withArgs({
              json: true,
              components: "message-thread-full",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits for invalid component names", async () => {
    mockGetComponentList.mockReturnValue([{ name: "known", description: "" }]);

    await expect(
      Promise.resolve(
        install.run?.(
          makeContext(
            withArgs({
              json: true,
              components: "invalid",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("returns dry-run plan without installing", async () => {
    mockFs({});
    mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

    const output = await captureStdout(async () => {
      await install.run?.(
        makeContext(
          withArgs({
            json: true,
            components: "message-thread-full",
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": false,
            "dry-run": true,
            "skip-tailwind": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.wouldInstall).toEqual(["message-thread-full"]);
    expect(mockInstallComponents).not.toHaveBeenCalled();
  });

  it("skips already installed components", async () => {
    mockFs({ "/tmp/components/tambo/message-thread-full.tsx": "" });

    const output = await captureStdout(async () => {
      await install.run?.(
        makeContext(
          withArgs({
            json: true,
            components: "message-thread-full",
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": false,
            "dry-run": false,
            "skip-tailwind": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.componentsSkipped).toEqual(["message-thread-full"]);
    expect(result.componentsInstalled).toEqual([]);
  });

  it("installs components and configures tailwind", async () => {
    mockFs({});
    mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

    const output = await captureStdout(async () => {
      await install.run?.(
        makeContext(
          withArgs({
            json: true,
            components: "message-thread-full",
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": false,
            "dry-run": false,
            "skip-tailwind": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.componentsInstalled).toEqual(["message-thread-full"]);
    expect(result.filesCreated).toEqual([
      path.join("/tmp/components/tambo", "message-thread-full.tsx"),
    ]);
    expect(mockInstallComponents).toHaveBeenCalled();
    expect(mockSetupTailwind).toHaveBeenCalled();
  });

  it("uses legacy install path when legacy components exist", async () => {
    mockFs({
      "/tmp/components/ui": "",
      "/tmp/components/ui/message-thread-full.tsx": "",
    });
    mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);
    mockResolveComponentPaths.mockImplementation(
      (_root: string, installPath: string, comp: string) => ({
        newPath: `/tmp/components/${installPath}/${comp}.tsx`,
        legacyPath: undefined,
      })
    );
    jest
      .spyOn(fs, "readdirSync")
      .mockImplementation(
        ((dir) => {
          if (String(dir).includes("/tmp/components/ui")) {
            return ["message-thread-full.tsx"];
          }
          return [];
        }) as typeof fs.readdirSync
      );

    await install.run?.(
      makeContext(
        withArgs({
          json: true,
          components: "message-thread-full",
          prefix: "src/components",
          "legacy-peer-deps": false,
          "skip-agent-docs": false,
          "dry-run": false,
          "skip-tailwind": false,
        })
      )
    );

    expect(mockInstallComponents).toHaveBeenCalledWith(
      ["message-thread-full"],
      expect.objectContaining({
        baseInstallPath: "src/components",
        installPath: path.join("src/components", "ui"),
      })
    );
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);
    mockFs({});
    mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

    const output = await captureStdout(async () => {
      await install.run?.(
        makeContext(
          withArgs({
            json: true,
            components: "message-thread-full",
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": false,
            "dry-run": false,
            "skip-tailwind": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);
    mockFs({});
    mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

    const output = await captureStdout(async () => {
      await install.run?.(
        makeContext(
          withArgs({
            json: true,
            components: "message-thread-full",
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": false,
            "dry-run": false,
            "skip-tailwind": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  // Non-JSON output tests - lightweight, verify commands run without crashing
  describe("non-JSON output", () => {
    it("runs with invalid components", async () => {
      mockGetComponentList.mockReturnValue([{ name: "known", description: "" }]);

      await expect(
        Promise.resolve(
          install.run?.(
            makeContext(
              withArgs({
                json: false,
                components: "invalid",
                prefix: "src/components",
                "legacy-peer-deps": false,
                "skip-agent-docs": false,
                "dry-run": false,
                "skip-tailwind": false,
              })
            )
          )
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("runs dry-run in non-JSON mode", async () => {
      mockFs({});
      mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-thread-full",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": true,
              "skip-tailwind": false,
            })
          )
        );
      });
    });

    it("runs with already installed components in non-JSON mode", async () => {
      mockFs({ "/tmp/components/tambo/message-thread-full.tsx": "" });

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-thread-full",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": false,
            })
          )
        );
      });
    });

    it("runs successful install in non-JSON mode", async () => {
      setIsTTY(true);
      mockFs({});
      mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-thread-full",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": false,
            })
          )
        );
      });
    });

    it("runs with skip-tailwind in non-JSON mode", async () => {
      mockFs({});
      mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-thread-full",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": true,
            })
          )
        );
      });
    });

    it("handles install failure in non-JSON mode", async () => {
      mockFs({});
      mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);
      mockInstallComponents.mockRejectedValue(new Error("Install failed"));

      await expect(
        Promise.resolve(
          install.run?.(
            makeContext(
              withArgs({
                json: false,
                components: "message-thread-full",
                prefix: "src/components",
                "legacy-peer-deps": false,
                "skip-agent-docs": false,
                "dry-run": false,
                "skip-tailwind": false,
              })
            )
          )
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("handles tailwind setup error in non-JSON mode", async () => {
      mockFs({});
      mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);
      mockSetupTailwind.mockRejectedValue(new Error("Tailwind error"));

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-thread-full",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": false,
            })
          )
        );
      });
    });

    it("handles dependency resolution failure in non-JSON mode", async () => {
      mockFs({});
      mockResolveComponentDependencies.mockRejectedValue(new Error("Dep resolution failed"));

      await expect(
        Promise.resolve(
          install.run?.(
            makeContext(
              withArgs({
                json: false,
                components: "message-thread-full",
                prefix: "src/components",
                "legacy-peer-deps": false,
                "skip-agent-docs": false,
                "dry-run": false,
                "skip-tailwind": false,
              })
            )
          )
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("runs with legacy components and new components both present", async () => {
      mockFs({
        "/tmp/components/ui/message-thread-full.tsx": "",
        "/tmp/components/tambo/other.tsx": "",
      });
      mockResolveComponentDependencies.mockResolvedValue(["message-input"]);
      jest
        .spyOn(fs, "readdirSync")
        .mockImplementation(
          ((dir) => {
            if (String(dir).includes("/tmp/components/ui")) {
              return ["message-thread-full.tsx"];
            }
            if (String(dir).includes("/tmp/components/tambo")) {
              return ["other.tsx"];
            }
            return [];
          }) as typeof fs.readdirSync
        );

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-input",
              prefix: "src/components",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": true,
            })
          )
        );
      });
    });

    it("runs with explicit prefix in non-JSON mode", async () => {
      mockFs({});
      mockResolveComponentDependencies.mockResolvedValue(["message-thread-full"]);
      mockGetComponentDirectoryPath.mockReturnValue("/tmp/custom/path");

      await captureStdout(async () => {
        await install.run?.(
          makeContext(
            withArgs({
              json: false,
              components: "message-thread-full",
              prefix: "custom/path",
              "legacy-peer-deps": false,
              "skip-agent-docs": false,
              "dry-run": false,
              "skip-tailwind": true,
            })
          )
        );
      });
    });
  });
});
