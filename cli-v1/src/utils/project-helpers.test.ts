/**
 * Tests for project validation helpers.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { mockFs } from "../__fixtures__/test-utils.js";
import { out } from "./output.js";
import {
  requirePackageJson,
  requireValidPackageJson,
} from "./project-helpers.js";

describe("project helpers", () => {
  let jsonSpy: jest.SpiedFunction<typeof out.json>;
  let errorSpy: jest.SpiedFunction<typeof out.error>;
  let explanationSpy: jest.SpiedFunction<typeof out.explanation>;

  beforeEach(() => {
    jsonSpy = jest.spyOn(out, "json").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(out, "error").mockImplementation(() => undefined);
    explanationSpy = jest
      .spyOn(out, "explanation")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns true when package.json exists", () => {
    mockFs({ "package.json": "{}" });
    const result = { errors: [] as string[] };

    expect(requirePackageJson({ json: false }, result)).toBe(true);
  });

  it("returns false and outputs errors when package.json is missing", () => {
    mockFs({});
    const result = { errors: [] as string[] };

    expect(requirePackageJson({ json: false }, result)).toBe(false);
    expect(result.errors).toContain("No package.json found");
    expect(errorSpy).toHaveBeenCalledWith(
      "No package.json found. Run this command in your project root.",
    );
  });

  it("outputs json when package.json is missing in json mode", () => {
    mockFs({});
    const result = { errors: [] as string[] };

    expect(requirePackageJson({ json: true }, result)).toBe(false);
    expect(jsonSpy).toHaveBeenCalledWith(result);
  });

  it("returns true when package.json is valid JSON", () => {
    mockFs({ "package.json": '{"name":"demo"}' });
    const result = { errors: [] as string[] };

    expect(requireValidPackageJson({ json: false }, result)).toBe(true);
  });

  it("returns false when package.json is invalid JSON", () => {
    mockFs({ "package.json": "{" });
    const result = { errors: [] as string[] };

    expect(requireValidPackageJson({ json: false }, result)).toBe(false);
    expect(result.errors).toContain("Invalid project - no package.json found");
    expect(errorSpy).toHaveBeenCalledWith(
      "No valid package.json found in current directory",
    );
    expect(explanationSpy).toHaveBeenCalled();
  });

  it("uses custom explanation lines when provided", () => {
    mockFs({ "package.json": "{" });
    const result = { errors: [] as string[] };

    expect(
      requireValidPackageJson({ json: false }, result, ["Custom explanation"]),
    ).toBe(false);
    expect(explanationSpy).toHaveBeenCalledWith(["Custom explanation"]);
  });
});
