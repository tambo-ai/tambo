import type TamboAI from "@tambo-ai/typescript-sdk";
import type { TamboThreadMessage } from "../model/generate-component-response";
import { hasToolCallRequestProperty } from "../util/type-guards";

/**
 * Hook to extract tool call information from a message.
 * Tool calls occur when the AI invokes registered tools to gather additional context or perform actions.
 * @param message - The thread message to extract tool call from
 * @returns Object containing toolCall data and hasToolCall boolean
 * @example
 * ```tsx
 * const { toolCall, hasToolCall } = useTamboMessageToolCall(message);
 * if (hasToolCall) {
 *   console.log('Calling tool:', toolCall.toolName);
 * }
 * ```
 */
export function useTamboMessageToolCall(message: TamboThreadMessage) {
  let toolCall: TamboAI.ToolCallRequest | null = null;

  if (message.toolCallRequest) {
    toolCall = message.toolCallRequest;
  } else if (hasToolCallRequestProperty(message.component)) {
    toolCall = message.component.toolCallRequest;
  }

  return {
    toolCall,
    hasToolCall: !!toolCall,
  };
}
