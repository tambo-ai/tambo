import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Shared type guards for message components
 */

/**
 * Type guard to check if component has reasoning property
 * @returns true if component has a reasoning string property
 */
export function hasReasoningProperty(
  component: unknown,
): component is { reasoning: string } {
  return (
    typeof component === "object" &&
    component !== null &&
    "reasoning" in component &&
    typeof (component as { reasoning: unknown }).reasoning === "string"
  );
}

/**
 * Type guard to check if component has message property
 * @returns true if component has a message string property
 */
export function hasMessageProperty(
  component: unknown,
): component is { message: string } {
  return (
    typeof component === "object" &&
    component !== null &&
    "message" in component &&
    typeof (component as { message: unknown }).message === "string"
  );
}

/**
 * Type guard to check if component has toolCallRequest property
 * @returns true if component has a toolCallRequest property
 */
export function hasToolCallRequestProperty(
  component: unknown,
): component is { toolCallRequest: TamboAI.ToolCallRequest } {
  return (
    typeof component === "object" &&
    component !== null &&
    "toolCallRequest" in component
  );
}
