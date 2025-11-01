import type { TamboThreadMessage } from "../model/generate-component-response";
import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Hook to extract tool call request from a message.
 * @param message - The message to extract tool call from
 * @returns The tool call request if present, null otherwise
 */
export function useTamboMessageToolCall(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | null {
  return message.toolCallRequest ?? message.component?.toolCallRequest ?? null;
}
