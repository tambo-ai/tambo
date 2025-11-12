import type { TamboThreadMessage } from "../model/generate-component-response";
import {
  hasReasoningProperty,
  hasMessageProperty,
} from "../util/type-guards";

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
