/**
 * Tests for TTY detection logic.
 */

import { afterEach, describe, expect, it } from "@jest/globals";

import { isTTY } from "./tty.js";

const originalIsTTY = process.stdout.isTTY;
const originalCI = process.env.CI;
const originalTerm = process.env.TERM;

const restoreEnv = () => {
  if (typeof originalCI === "undefined") {
    delete process.env.CI;
  } else {
    process.env.CI = originalCI;
  }

  if (typeof originalTerm === "undefined") {
    delete process.env.TERM;
  } else {
    process.env.TERM = originalTerm;
  }
};

const setIsTTY = (value: boolean) => {
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true,
  });
};

afterEach(() => {
  setIsTTY(originalIsTTY);
  restoreEnv();
});

describe("isTTY", () => {
  it("returns false when stdout is not a TTY", () => {
    setIsTTY(false);

    expect(isTTY()).toBe(false);
  });

  it("returns false when CI is set", () => {
    setIsTTY(true);
    process.env.CI = "true";

    expect(isTTY()).toBe(false);
  });

  it("returns false when TERM is dumb", () => {
    setIsTTY(true);
    process.env.TERM = "dumb";

    expect(isTTY()).toBe(false);
  });

  it("returns true when TTY and no CI or dumb terminal", () => {
    setIsTTY(true);
    delete process.env.CI;
    delete process.env.TERM;

    expect(isTTY()).toBe(true);
  });
});
