/**
 * Plan presenter utilities for converting InstallationPlan to checklist items
 *
 * These functions handle the conversion between InstallationPlan and the
 * interactive checklist format used in the confirmation flow.
 */

import chalk from "chalk";
import type { InstallationPlan } from "../plan-generation/types.js";
import type { PlanItem } from "./types.js";

/**
 * Convert InstallationPlan to checklist items for interactive selection
 *
 * @param plan - The installation plan to convert
 * @returns Array of PlanItem checklist items
 */
export function planToCheckboxItems(plan: InstallationPlan): PlanItem[] {
  const items: PlanItem[] = [];

  // Provider setup (always required and checked)
  items.push({
    id: "provider-setup",
    type: "provider",
    label: `Add TamboProvider to ${plan.providerSetup.filePath}`,
    confidence: plan.providerSetup.confidence,
    checked: true,
    disabled: "(required)",
  });

  // Component recommendations
  for (const [idx, component] of plan.componentRecommendations.entries()) {
    const confidencePercent = Math.round(component.confidence * 100);
    items.push({
      id: `component-${idx}`,
      type: "component",
      label: `Register ${component.name} component (${confidencePercent}%)`,
      confidence: component.confidence,
      checked: component.confidence >= 0.8,
    });
  }

  // Tool recommendations
  for (const [idx, tool] of plan.toolRecommendations.entries()) {
    const confidencePercent = Math.round(tool.confidence * 100);
    items.push({
      id: `tool-${idx}`,
      type: "tool",
      label: `Create ${tool.name} tool from ${tool.type} (${confidencePercent}%)`,
      confidence: tool.confidence,
      checked: tool.confidence >= 0.8,
    });
  }

  // Interactable recommendations
  for (const [
    idx,
    interactable,
  ] of plan.interactableRecommendations.entries()) {
    const confidencePercent = Math.round(interactable.confidence * 100);
    items.push({
      id: `interactable-${idx}`,
      type: "interactable",
      label: `Add interactability to ${interactable.componentName} (${confidencePercent}%)`,
      confidence: interactable.confidence,
      checked: interactable.confidence >= 0.8,
    });
  }

  // Chat widget setup
  const chatConfidencePercent = Math.round(
    plan.chatWidgetSetup.confidence * 100,
  );
  items.push({
    id: "chat-widget",
    type: "chat-widget",
    label: `Add chat widget to ${plan.chatWidgetSetup.filePath} (${chatConfidencePercent}%)`,
    confidence: plan.chatWidgetSetup.confidence,
    checked: plan.chatWidgetSetup.confidence >= 0.8,
  });

  return items;
}

/**
 * Display a summary of the installation plan
 *
 * @param plan - The installation plan to summarize
 */
export function displayPlanSummary(plan: InstallationPlan): void {
  console.log();
  console.log(chalk.bold("Installation Plan Summary"));
  console.log();

  // Count items by category
  const componentCount = plan.componentRecommendations.length;
  const toolCount = plan.toolRecommendations.length;
  const interactableCount = plan.interactableRecommendations.length;

  console.log(chalk.dim(`  Provider setup:   1 item`));
  console.log(chalk.dim(`  Components:       ${componentCount} items`));
  console.log(chalk.dim(`  Tools:            ${toolCount} items`));
  console.log(chalk.dim(`  Interactables:    ${interactableCount} items`));
  console.log(chalk.dim(`  Chat widget:      1 item`));

  // Calculate average confidence
  const allConfidences = [
    plan.providerSetup.confidence,
    ...plan.componentRecommendations.map((c) => c.confidence),
    ...plan.toolRecommendations.map((t) => t.confidence),
    ...plan.interactableRecommendations.map((i) => i.confidence),
    plan.chatWidgetSetup.confidence,
  ];

  const avgConfidence =
    allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length;
  const avgConfidencePercent = Math.round(avgConfidence * 100);

  console.log();
  console.log(chalk.dim(`  Average confidence: ${avgConfidencePercent}%`));
  console.log();
}

/**
 * Filter an InstallationPlan to only include selected items
 *
 * @param plan - The original installation plan
 * @param selectedIds - Array of selected item IDs
 * @returns Filtered installation plan
 */
export function filterPlanBySelection(
  plan: InstallationPlan,
  selectedIds: string[],
): InstallationPlan {
  const selectedSet = new Set(selectedIds);

  // Filter component recommendations
  const filteredComponents = plan.componentRecommendations.filter(
    (_component, idx) => selectedSet.has(`component-${idx}`),
  );

  // Filter tool recommendations
  const filteredTools = plan.toolRecommendations.filter((_tool, idx) =>
    selectedSet.has(`tool-${idx}`),
  );

  // Filter interactable recommendations
  const filteredInteractables = plan.interactableRecommendations.filter(
    (_interactable, idx) => selectedSet.has(`interactable-${idx}`),
  );

  // Chat widget: include if selected, otherwise return empty placeholder
  const chatWidgetSetup = selectedSet.has("chat-widget")
    ? plan.chatWidgetSetup
    : {
        filePath: "",
        position: "bottom-right" as const,
        rationale: "",
        confidence: 0,
      };

  return {
    providerSetup: plan.providerSetup, // Always included
    componentRecommendations: filteredComponents,
    toolRecommendations: filteredTools,
    interactableRecommendations: filteredInteractables,
    chatWidgetSetup,
  };
}
