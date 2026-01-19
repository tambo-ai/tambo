/**
 * Tests for latest version check behavior.
 */

import fs from "fs";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { mockFs } from "../__fixtures__/test-utils.js";

const warningSpy = jest.fn();
const infoSpy = jest.fn();
const mockEnvPaths = jest.fn(() => ({ cache: "/tmp/tambov1-cache" }));
const mockIsTTY = jest.fn(() => true);

jest.unstable_mockModule("env-paths", () => ({
  default: mockEnvPaths,
}));

jest.unstable_mockModule("./output.js", () => ({
  out: {
    warning: warningSpy,
    info: infoSpy,
  },
}));

jest.unstable_mockModule("./tty.js", () => ({
  isTTY: mockIsTTY,
}));

const { checkLatestVersion } = await import("./version-check.js");

describe("checkLatestVersion", () => {
  const originalFetch = global.fetch;
  const originalArgv = process.argv;
  const packageJsonPath = new URL("../../package.json", import.meta.url);

  beforeEach(() => {
    warningSpy.mockClear();
    infoSpy.mockClear();
    mockIsTTY.mockReturnValue(true);
    process.argv = ["node", "tambov1"];
  });

  afterEach(() => {
    process.argv = originalArgv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("uses cached version within TTL without fetching", async () => {
    const cachePath = "/tmp/tambov1-cache/version-check.json";
    const now = new Date().toISOString();
    mockFs({
      [cachePath]: JSON.stringify({ checkedAt: now, latestVersion: "9.9.9" }),
      [String(packageJsonPath)]: JSON.stringify({ version: "0.1.0" }),
    });
    const mockFetch = jest.fn<typeof fetch>();
    global.fetch = mockFetch;

    await checkLatestVersion();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(warningSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
  });

  it("refreshes stale cache and writes latest version", async () => {
    const cachePath = "/tmp/tambov1-cache/version-check.json";
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const fsMocks = mockFs({
      [cachePath]: JSON.stringify({ checkedAt: stale, latestVersion: "0.0.1" }),
      [String(packageJsonPath)]: JSON.stringify({ version: "0.1.0" }),
    });
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    const mockFetch = jest.fn<typeof fetch>();
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ version: "0.2.0" })));
    global.fetch = mockFetch;

    await checkLatestVersion();

    expect(global.fetch).toHaveBeenCalled();
    expect(fsMocks.getFile(cachePath)).toContain("\"latestVersion\": \"0.2.0\"");
    expect(warningSpy).toHaveBeenCalled();
  });

  it("skips check when not in TTY", async () => {
    mockIsTTY.mockReturnValue(false);
    const mockFetch = jest.fn<typeof fetch>();
    global.fetch = mockFetch;

    await checkLatestVersion();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(warningSpy).not.toHaveBeenCalled();
  });
});
