import type { TamboThreadMessage } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Get the tool call request from the message, or the component tool call request
 * @param message - The message to get the tool call request from
 * @returns The tool call request
 */
export function getToolCallRequest(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | undefined {
  return message.toolCallRequest ?? message.component?.toolCallRequest;
}
