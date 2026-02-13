/**
 * Tests for confirmPlan orchestrator
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { InstallationPlan } from "../plan-generation/types.js";

/**
 * Create a mock InstallationPlan for testing
 */
function createMockPlan(): InstallationPlan {
  return {
    providerSetup: {
      filePath: "/app/layout.tsx",
      nestingLevel: 0,
      rationale: "Root layout file",
      confidence: 0.95,
    },
    componentRecommendations: [
      {
        name: "UserProfile",
        filePath: "/components/user-profile.tsx",
        reason: "User data display",
        confidence: 0.9,
        suggestedRegistration: "registerComponent('UserProfile', UserProfile);",
      },
      {
        name: "Sidebar",
        filePath: "/components/sidebar.tsx",
        reason: "Navigation component",
        confidence: 0.5,
        suggestedRegistration: "registerComponent('Sidebar', Sidebar);",
      },
    ],
    toolRecommendations: [
      {
        name: "getUserData",
        type: "server-action" as const,
        filePath: "/actions/user.ts",
        reason: "Fetch user information",
        confidence: 0.85,
        suggestedSchema: "z.object({ userId: z.string() })",
      },
    ],
    interactableRecommendations: [],
    chatWidgetSetup: {
      filePath: "/app/layout.tsx",
      position: "bottom-right" as const,
      rationale: "Standard chat position",
      confidence: 0.9,
    },
  };
}

describe("confirmPlan - non-interactive mode", () => {
  beforeEach(() => {
    // Mock isInteractive before importing confirmPlan
    jest.unstable_mockModule("../interactive.js", () => ({
      isInteractive: jest.fn(() => false),
      NonInteractiveError: class NonInteractiveError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "NonInteractiveError";
        }
      },
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("throws NonInteractiveError when not interactive and --yes not provided", async () => {
    const { confirmPlan } = await import("./index.js");
    const plan = createMockPlan();

    // Should throw NonInteractiveError
    await expect(confirmPlan(plan, {})).rejects.toThrow(
      expect.objectContaining({
        name: "NonInteractiveError",
      }),
    );
  });

  it("auto-approves high-confidence items when --yes flag provided", async () => {
    const { confirmPlan } = await import("./index.js");
    const plan = createMockPlan();

    const result = await confirmPlan(plan, { yes: true });

    expect(result.approved).toBe(true);

    // Should include provider-setup (always)
    expect(result.selectedItems).toContain("provider-setup");

    // Should include high-confidence items (>= 0.8)
    expect(result.selectedItems).toContain("component-0"); // UserProfile: 0.9
    expect(result.selectedItems).toContain("tool-0"); // getUserData: 0.85
    expect(result.selectedItems).toContain("chat-widget"); // 0.9

    // Should NOT include low-confidence items (< 0.8)
    expect(result.selectedItems).not.toContain("component-1"); // Sidebar: 0.5

    // Filtered plan should only have selected items
    expect(result.plan.componentRecommendations).toHaveLength(1);
    expect(result.plan.componentRecommendations[0]?.name).toBe("UserProfile");
  });

  it("always includes provider-setup in --yes mode", async () => {
    const { confirmPlan } = await import("./index.js");
    const plan = createMockPlan();

    const result = await confirmPlan(plan, { yes: true });

    expect(result.approved).toBe(true);
    expect(result.selectedItems).toContain("provider-setup");
    expect(result.plan.providerSetup).toEqual(plan.providerSetup);
  });
});
