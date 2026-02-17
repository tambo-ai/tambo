/**
 * Tests for InstallationPlan Zod schemas
 *
 * These tests verify that:
 * - Valid plans parse successfully
 * - Invalid data is rejected with appropriate errors
 * - Schema constraints (min length, ranges, enums) are enforced
 */

import { describe, it, expect } from "@jest/globals";
import {
  installationPlanSchema,
  providerSetupRecommendationSchema,
  componentRecommendationSchema,
  toolRecommendationSchema,
  interactableRecommendationSchema,
  chatWidgetSetupSchema,
} from "./schemas.js";

describe("providerSetupRecommendationSchema", () => {
  it("parses valid provider setup", () => {
    const valid = {
      filePath: "/app/layout.tsx",
      nestingLevel: 0,
      rationale: "Root layout is the ideal location for providers",
      confidence: 0.95,
    };
    expect(() => providerSetupRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("rejects negative nesting level", () => {
    const invalid = {
      filePath: "/app/layout.tsx",
      nestingLevel: -1,
      rationale: "Root layout is the ideal location for providers",
      confidence: 0.95,
    };
    expect(() => providerSetupRecommendationSchema.parse(invalid)).toThrow();
  });

  it("rejects rationale shorter than 10 characters", () => {
    const invalid = {
      filePath: "/app/layout.tsx",
      nestingLevel: 0,
      rationale: "Short",
      confidence: 0.95,
    };
    expect(() => providerSetupRecommendationSchema.parse(invalid)).toThrow();
  });

  it("rejects confidence below 0", () => {
    const invalid = {
      filePath: "/app/layout.tsx",
      nestingLevel: 0,
      rationale: "Root layout is the ideal location for providers",
      confidence: -0.1,
    };
    expect(() => providerSetupRecommendationSchema.parse(invalid)).toThrow();
  });

  it("rejects confidence above 1", () => {
    const invalid = {
      filePath: "/app/layout.tsx",
      nestingLevel: 0,
      rationale: "Root layout is the ideal location for providers",
      confidence: 1.5,
    };
    expect(() => providerSetupRecommendationSchema.parse(invalid)).toThrow();
  });
});

describe("componentRecommendationSchema", () => {
  it("parses valid component recommendation", () => {
    const valid = {
      name: "UserProfile",
      filePath: "/components/UserProfile.tsx",
      reason: "User-facing component that displays profile data",
      confidence: 0.85,
    };
    expect(() => componentRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("rejects reason shorter than 10 characters", () => {
    const invalid = {
      name: "UserProfile",
      filePath: "/components/UserProfile.tsx",
      reason: "Profile",
      confidence: 0.85,
    };
    expect(() => componentRecommendationSchema.parse(invalid)).toThrow();
  });

  it("rejects confidence out of range", () => {
    const invalid = {
      name: "UserProfile",
      filePath: "/components/UserProfile.tsx",
      reason: "User-facing component that displays profile data",
      confidence: 2.0,
    };
    expect(() => componentRecommendationSchema.parse(invalid)).toThrow();
  });
});

describe("toolRecommendationSchema", () => {
  it("parses valid server-action tool", () => {
    const valid = {
      name: "createUser",
      type: "server-action" as const,
      filePath: "/actions/user.ts",
      reason: "Server action for creating user records in database",
      confidence: 0.9,
    };
    expect(() => toolRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("parses valid fetch tool", () => {
    const valid = {
      name: "fetchProducts",
      type: "fetch" as const,
      filePath: "/api/products.ts",
      reason: "Fetches product data from external API",
      confidence: 0.8,
    };
    expect(() => toolRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("parses valid axios tool", () => {
    const valid = {
      name: "getOrders",
      type: "axios" as const,
      filePath: "/lib/api.ts",
      reason: "Uses axios to fetch order data",
      confidence: 0.75,
    };
    expect(() => toolRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("parses valid exported-function tool", () => {
    const valid = {
      name: "calculateTotal",
      type: "exported-function" as const,
      filePath: "/utils/cart.ts",
      reason: "Calculates shopping cart total with tax",
      confidence: 0.7,
    };
    expect(() => toolRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid tool type enum", () => {
    const invalid = {
      name: "someFunction",
      type: "invalid-type",
      filePath: "/lib/utils.ts",
      reason: "Some function that should be a tool",
      confidence: 0.8,
    };
    expect(() => toolRecommendationSchema.parse(invalid)).toThrow();
  });

  it("rejects reason shorter than 10 characters", () => {
    const invalid = {
      name: "createUser",
      type: "server-action" as const,
      filePath: "/actions/user.ts",
      reason: "Creates",
      confidence: 0.9,
    };
    expect(() => toolRecommendationSchema.parse(invalid)).toThrow();
  });
});

describe("interactableRecommendationSchema", () => {
  it("parses valid interactable recommendation", () => {
    const valid = {
      componentName: "SearchBar",
      filePath: "/components/SearchBar.tsx",
      reason: "Interactive search input that users engage with frequently",
      confidence: 0.88,
    };
    expect(() => interactableRecommendationSchema.parse(valid)).not.toThrow();
  });

  it("rejects reason shorter than 10 characters", () => {
    const invalid = {
      componentName: "SearchBar",
      filePath: "/components/SearchBar.tsx",
      reason: "Search",
      confidence: 0.88,
    };
    expect(() => interactableRecommendationSchema.parse(invalid)).toThrow();
  });
});

describe("chatWidgetSetupSchema", () => {
  it("parses valid bottom-right position", () => {
    const valid = {
      filePath: "/app/layout.tsx",
      position: "bottom-right" as const,
      rationale:
        "Standard position for chat widgets, doesn't obstruct main content",
      confidence: 0.95,
    };
    expect(() => chatWidgetSetupSchema.parse(valid)).not.toThrow();
  });

  it("parses valid bottom-left position", () => {
    const valid = {
      filePath: "/app/layout.tsx",
      position: "bottom-left" as const,
      rationale: "Left side matches existing UI pattern in this project",
      confidence: 0.9,
    };
    expect(() => chatWidgetSetupSchema.parse(valid)).not.toThrow();
  });

  it("parses valid top-right position", () => {
    const valid = {
      filePath: "/app/layout.tsx",
      position: "top-right" as const,
      rationale: "Top position avoids conflict with footer elements",
      confidence: 0.85,
    };
    expect(() => chatWidgetSetupSchema.parse(valid)).not.toThrow();
  });

  it("parses valid sidebar position", () => {
    const valid = {
      filePath: "/app/layout.tsx",
      position: "sidebar" as const,
      rationale: "Sidebar layout matches existing navigation pattern",
      confidence: 0.8,
    };
    expect(() => chatWidgetSetupSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid position enum", () => {
    const invalid = {
      filePath: "/app/layout.tsx",
      position: "center",
      rationale: "Center position for maximum visibility",
      confidence: 0.9,
    };
    expect(() => chatWidgetSetupSchema.parse(invalid)).toThrow();
  });

  it("rejects rationale shorter than 10 characters", () => {
    const invalid = {
      filePath: "/app/layout.tsx",
      position: "bottom-right" as const,
      rationale: "Good",
      confidence: 0.95,
    };
    expect(() => chatWidgetSetupSchema.parse(invalid)).toThrow();
  });
});

describe("installationPlanSchema", () => {
  it("parses valid complete plan", () => {
    const validPlan = {
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Root layout is the ideal location for providers",
        confidence: 0.95,
      },
      componentRecommendations: [
        {
          name: "UserProfile",
          filePath: "/components/UserProfile.tsx",
          reason: "User-facing component that displays profile data",
          confidence: 0.85,
        },
      ],
      toolRecommendations: [
        {
          name: "createUser",
          type: "server-action" as const,
          filePath: "/actions/user.ts",
          reason: "Server action for creating user records in database",
          confidence: 0.9,
        },
      ],
      interactableRecommendations: [
        {
          componentName: "SearchBar",
          filePath: "/components/SearchBar.tsx",
          reason: "Interactive search input that users engage with frequently",
          confidence: 0.88,
        },
      ],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right" as const,
        rationale:
          "Standard position for chat widgets, doesn't obstruct main content",
        confidence: 0.95,
      },
    };

    const result = installationPlanSchema.parse(validPlan);
    expect(result).toEqual(validPlan);
  });

  it("parses plan with empty recommendation arrays", () => {
    const planWithEmptyArrays = {
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Root layout is the ideal location for providers",
        confidence: 0.95,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right" as const,
        rationale:
          "Standard position for chat widgets, doesn't obstruct main content",
        confidence: 0.95,
      },
    };

    expect(() =>
      installationPlanSchema.parse(planWithEmptyArrays),
    ).not.toThrow();
  });

  it("rejects plan missing providerSetup", () => {
    const invalid = {
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right" as const,
        rationale:
          "Standard position for chat widgets, doesn't obstruct main content",
        confidence: 0.95,
      },
    };

    expect(() => installationPlanSchema.parse(invalid)).toThrow();
  });

  it("rejects plan missing chatWidgetSetup", () => {
    const invalid = {
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Root layout is the ideal location for providers",
        confidence: 0.95,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
    };

    expect(() => installationPlanSchema.parse(invalid)).toThrow();
  });

  it("strips extra fields from plan", () => {
    const withExtraFields = {
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Root layout is the ideal location for providers",
        confidence: 0.95,
        extraField: "should be removed",
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right" as const,
        rationale:
          "Standard position for chat widgets, doesn't obstruct main content",
        confidence: 0.95,
      },
      unknownTopLevel: "should also be removed",
    };

    const result = installationPlanSchema.parse(withExtraFields);
    expect(result).not.toHaveProperty("unknownTopLevel");
    expect(result.providerSetup).not.toHaveProperty("extraField");
  });
});
