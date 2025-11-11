import type { TamboThreadMessage } from "../model/generate-component-response";

/**
 * Type guard to check if component has reasoning property
 * @returns true if component has a reasoning string property
 */
function hasReasoningProperty(
  component: unknown,
): component is { reasoning: string } {
  return (
    typeof component === "object" &&
    component !== null &&
    "reasoning" in component &&
    typeof (component as any).reasoning === "string"
  );
}

/**
 * Type guard to check if component has message property
 * @returns true if component has a message string property
 */
function hasMessageProperty(
  component: unknown,
): component is { message: string } {
  return (
    typeof component === "object" &&
    component !== null &&
    "message" in component &&
    typeof (component as any).message === "string"
  );
}

/**
 * Hook to extract reasoning or thinking text from a message.
 * Reasoning is typically generated when using reasoning models like OpenAI's o1 or o3-mini,
 * or when explicitly requesting reasoning output.
 * @param message - The thread message to extract reasoning from
 * @returns Object containing reasoning text and hasReasoning boolean
 * @example
 * ```tsx
 * const { reasoning, hasReasoning } = useTamboMessageReasoning(message);
 * if (hasReasoning) {
 *   console.log('AI reasoning:', reasoning);
 * }
 * ```
 */
export function useTamboMessageReasoning(message: TamboThreadMessage) {
  let reasoning: string | null = null;

  if (hasReasoningProperty(message.component)) {
    reasoning = message.component.reasoning;
  } else if (hasMessageProperty(message.component)) {
    reasoning = message.component.message;
  }

  return {
    reasoning,
    hasReasoning: !!reasoning,
  };
}
