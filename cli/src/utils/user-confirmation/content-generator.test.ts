/**
 * Tests for change summary generation
 */

import { describe, expect, it } from "@jest/globals";
import { generateChangeSummary } from "./content-generator.js";
import type { InstallationPlan } from "../plan-generation/types.js";

function createMockPlan(): InstallationPlan {
  return {
    providerSetup: {
      filePath: "app/layout.tsx",
      nestingLevel: 0,
      rationale: "Root layout file",
      confidence: 0.95,
    },
    componentRecommendations: [
      {
        name: "UserProfile",
        filePath: "components/user-profile.tsx",
        reason: "User data display",
        confidence: 0.9,
      },
    ],
    toolRecommendations: [
      {
        name: "getUserData",
        type: "server-action",
        filePath: "actions/user.ts",
        reason: "Fetch user information",
        confidence: 0.85,
      },
    ],
    interactableRecommendations: [
      {
        componentName: "ProductCard",
        filePath: "components/product-card.tsx",
        reason: "Allow AI interaction",
        confidence: 0.7,
      },
    ],
    chatWidgetSetup: {
      filePath: "app/layout.tsx",
      position: "bottom-right",
      rationale: "Standard position",
      confidence: 0.9,
    },
  };
}

describe("generateChangeSummary", () => {
  const plan = createMockPlan();

  it("generates summary for provider-setup", () => {
    const summary = generateChangeSummary("provider-setup", plan);
    expect(summary).toContain("TamboProvider");
    expect(summary).toContain("app/layout.tsx");
  });

  it("generates summary for component items", () => {
    const summary = generateChangeSummary("component-0", plan);
    expect(summary).toContain("UserProfile");
    expect(summary).toContain("AI-controllable");
  });

  it("generates summary for tool items", () => {
    const summary = generateChangeSummary("tool-0", plan);
    expect(summary).toContain("getUserData");
    expect(summary).toContain("server-action");
  });

  it("generates summary for interactable items", () => {
    const summary = generateChangeSummary("interactable-0", plan);
    expect(summary).toContain("ProductCard");
    expect(summary).toContain("withTamboInteractable");
  });

  it("generates summary for chat-widget", () => {
    const summary = generateChangeSummary("chat-widget", plan);
    expect(summary).toContain("chat widget");
    expect(summary).toContain("bottom-right");
  });

  it("returns unknown for invalid item IDs", () => {
    const summary = generateChangeSummary("invalid-id", plan);
    expect(summary).toBe("Unknown change");
  });
});
