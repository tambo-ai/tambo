/**
 * Tests for guidance builders.
 */

import { describe, expect, it } from "@jest/globals";

import { buildCreateAppGuidance, buildInitGuidance } from "./guidance.js";

describe("buildInitGuidance", () => {
  it("filters commands based on status", () => {
    const guidance = buildInitGuidance({
      hasPackageJson: true,
      packageManager: "npm",
      hasTamboReact: false,
      authenticated: false,
      hasApiKey: false,
      hasTamboTs: false,
      hasAgentDocs: false,
    });

    expect(guidance.commands.length).toBeGreaterThan(0);
    expect(guidance.allInOne?.command).toContain("tambov1 init --yes");
  });
});

describe("buildCreateAppGuidance", () => {
  it("returns template guidance", () => {
    const guidance = buildCreateAppGuidance();

    expect(guidance.templates.length).toBeGreaterThan(0);
    expect(guidance.commands[0].command).toContain("create-app");
  });
});
