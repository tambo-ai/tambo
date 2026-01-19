/**
 * Tests for error sanitization helpers.
 */

import { describe, expect, it } from "@jest/globals";

import { getSafeErrorMessage } from "./error-helpers.js";

describe("getSafeErrorMessage", () => {
  it("returns error message for Error instances", () => {
    const message = getSafeErrorMessage(new Error("Boom"));

    expect(message).toBe("Boom");
  });

  it("redacts unix-style paths in error messages", () => {
    const message = getSafeErrorMessage(
      new Error("Failed at /Users/test/project/src/index.ts:12:3")
    );

    expect(message).toBe("Failed at [path]/index.ts:12:3");
  });

  it("redacts windows-style paths in error messages", () => {
    const message = getSafeErrorMessage(
      new Error("Failed at C:\\Users\\test\\project\\src\\index.ts:12:3")
    );

    expect(message).toBe("Failed at [path]/index.ts:12:3");
  });

  it("returns generic message for non-errors", () => {
    expect(getSafeErrorMessage("nope")).toBe("An unexpected error occurred");
  });

  it("returns generic message for nullish values", () => {
    expect(getSafeErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getSafeErrorMessage(undefined)).toBe("An unexpected error occurred");
  });
});
