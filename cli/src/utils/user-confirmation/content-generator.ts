/**
 * Utilities for generating change summaries from recommendations
 *
 * These functions produce human-readable summaries of what the
 * agentic execution loop will do for each selected plan item.
 */

import type { InstallationPlan } from "../plan-generation/types.js";

/**
 * Generate a human-readable summary of what will change for a plan item
 *
 * @param itemId - The plan item ID
 * @param plan - The full installation plan
 * @returns Summary string describing the planned change
 */
export function generateChangeSummary(
  itemId: string,
  plan: InstallationPlan,
): string {
  if (itemId === "provider-setup") {
    return `Will set up TamboProvider in ${plan.providerSetup.filePath}`;
  }

  if (itemId.startsWith("component-")) {
    const idx = Number.parseInt(itemId.split("-")[1], 10);
    const component = plan.componentRecommendations[idx];
    if (!component) {
      return "Unknown component";
    }
    return `Will register ${component.name} from ${component.filePath} as an AI-controllable component`;
  }

  if (itemId.startsWith("tool-")) {
    const idx = Number.parseInt(itemId.split("-")[1], 10);
    const tool = plan.toolRecommendations[idx];
    if (!tool) {
      return "Unknown tool";
    }
    return `Will create a Tambo tool definition for ${tool.name} (${tool.type})`;
  }

  if (itemId.startsWith("interactable-")) {
    const idx = Number.parseInt(itemId.split("-")[1], 10);
    const interactable = plan.interactableRecommendations[idx];
    if (!interactable) {
      return "Unknown interactable";
    }
    return `Will make ${interactable.componentName} interactable via withTamboInteractable`;
  }

  if (itemId === "chat-widget") {
    return `Will add chat widget to ${plan.chatWidgetSetup.filePath} (${plan.chatWidgetSetup.position})`;
  }

  return "Unknown change";
}
