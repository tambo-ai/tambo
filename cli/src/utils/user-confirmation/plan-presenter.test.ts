/**
 * Tests for plan presenter utilities
 */

import { describe, expect, it } from "@jest/globals";
import type { InstallationPlan } from "../plan-generation/types.js";
import {
  planToCheckboxItems,
  filterPlanBySelection,
  displayPlanSummary,
} from "./plan-presenter.js";

/**
 * Create a mock InstallationPlan for testing
 * - 2 components (one 0.9 confidence, one 0.5)
 * - 1 tool (0.85)
 * - 1 interactable (0.6)
 * - provider (0.95)
 * - chat widget (0.9)
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
      },
      {
        name: "Sidebar",
        filePath: "/components/sidebar.tsx",
        reason: "Navigation component",
        confidence: 0.5,
      },
    ],
    toolRecommendations: [
      {
        name: "getUserData",
        type: "server-action" as const,
        filePath: "/actions/user.ts",
        reason: "Fetch user information",
        confidence: 0.85,
      },
    ],
    interactableRecommendations: [
      {
        componentName: "ProductCard",
        filePath: "/components/product-card.tsx",
        reason: "Allow AI to interact with products",
        confidence: 0.6,
      },
    ],
    chatWidgetSetup: {
      filePath: "/app/layout.tsx",
      position: "bottom-right" as const,
      rationale: "Standard chat position",
      confidence: 0.9,
    },
  };
}

describe("planToCheckboxItems", () => {
  it("converts InstallationPlan to PlanItem array", () => {
    const plan = createMockPlan();
    const items = planToCheckboxItems(plan);

    // Should have 6 total items (1 provider + 2 components + 1 tool + 1 interactable + 1 chat widget)
    expect(items).toHaveLength(6);

    // Provider setup
    expect(items[0]).toMatchObject({
      id: "provider-setup",
      type: "provider",
      label: "Add TamboProvider to /app/layout.tsx",
      confidence: 0.95,
      checked: true,
      disabled: "(required)",
    });
  });

  it("pre-checks high-confidence items (>= 0.8)", () => {
    const plan = createMockPlan();
    const items = planToCheckboxItems(plan);

    // High-confidence items should be checked
    const userProfileComponent = items.find(
      (item) => item.id === "component-0",
    );
    expect(userProfileComponent?.checked).toBe(true);
    expect(userProfileComponent?.confidence).toBe(0.9);

    const getUserDataTool = items.find((item) => item.id === "tool-0");
    expect(getUserDataTool?.checked).toBe(true);
    expect(getUserDataTool?.confidence).toBe(0.85);

    const chatWidget = items.find((item) => item.id === "chat-widget");
    expect(chatWidget?.checked).toBe(true);
    expect(chatWidget?.confidence).toBe(0.9);
  });

  it("does not pre-check low-confidence items (< 0.8)", () => {
    const plan = createMockPlan();
    const items = planToCheckboxItems(plan);

    // Low-confidence items should not be checked
    const sidebarComponent = items.find((item) => item.id === "component-1");
    expect(sidebarComponent?.checked).toBe(false);
    expect(sidebarComponent?.confidence).toBe(0.5);

    const productCardInteractable = items.find(
      (item) => item.id === "interactable-0",
    );
    expect(productCardInteractable?.checked).toBe(false);
    expect(productCardInteractable?.confidence).toBe(0.6);
  });

  it("includes confidence percentage in labels", () => {
    const plan = createMockPlan();
    const items = planToCheckboxItems(plan);

    const userProfileComponent = items.find(
      (item) => item.id === "component-0",
    );
    expect(userProfileComponent?.label).toContain("(90%)");

    const sidebarComponent = items.find((item) => item.id === "component-1");
    expect(sidebarComponent?.label).toContain("(50%)");
  });
});

describe("filterPlanBySelection", () => {
  it("returns filtered plan with only selected items", () => {
    const plan = createMockPlan();
    const selectedIds = ["provider-setup", "component-0", "tool-0"];

    const filtered = filterPlanBySelection(plan, selectedIds);

    // Provider always included
    expect(filtered.providerSetup).toEqual(plan.providerSetup);

    // Only first component included
    expect(filtered.componentRecommendations).toHaveLength(1);
    expect(filtered.componentRecommendations[0]?.name).toBe("UserProfile");

    // Tool included
    expect(filtered.toolRecommendations).toHaveLength(1);
    expect(filtered.toolRecommendations[0]?.name).toBe("getUserData");

    // Interactable not included
    expect(filtered.interactableRecommendations).toHaveLength(0);

    // Chat widget not included (should be empty placeholder)
    expect(filtered.chatWidgetSetup.filePath).toBe("");
    expect(filtered.chatWidgetSetup.confidence).toBe(0);
  });

  it("always includes provider setup regardless of selection", () => {
    const plan = createMockPlan();
    const selectedIds = ["component-0"]; // Provider not explicitly selected

    const filtered = filterPlanBySelection(plan, selectedIds);

    // Provider always included
    expect(filtered.providerSetup).toEqual(plan.providerSetup);
  });

  it("filters chat widget based on selection", () => {
    const plan = createMockPlan();

    // Without chat-widget in selection
    const filteredWithout = filterPlanBySelection(plan, ["provider-setup"]);
    expect(filteredWithout.chatWidgetSetup.filePath).toBe("");
    expect(filteredWithout.chatWidgetSetup.confidence).toBe(0);

    // With chat-widget in selection
    const filteredWith = filterPlanBySelection(plan, [
      "provider-setup",
      "chat-widget",
    ]);
    expect(filteredWith.chatWidgetSetup).toEqual(plan.chatWidgetSetup);
  });
});

describe("displayPlanSummary", () => {
  it("displays plan summary without throwing", () => {
    const plan = createMockPlan();

    // Should not throw
    expect(() => displayPlanSummary(plan)).not.toThrow();
  });
});
