import { beforeEach, afterEach, describe, expect, it } from "@jest/globals";

import { isInteractive } from "./interactive.js";

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
    expect(isInteractive({ stream })).toBe(true);
  });

  it("treats CI=true as non-interactive by default", () => {
    process.env.CI = "true";
    expect(isInteractive({ stream })).toBe(false);
  });

  it("allows FORCE_INTERACTIVE=1 to override CI detection", () => {
    process.env.CI = "true";
    process.env.FORCE_INTERACTIVE = "1";
    expect(isInteractive({ stream })).toBe(true);
  });
});
