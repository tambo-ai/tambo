import type { TamboThreadMessage } from "@tambo-ai/react";
import { getToolCallRequest } from "./get-tool-call-request";

/**
 * Gets the status message for a tool call.
 * Returns the custom status message if available, otherwise generates a default one.
 * @param message - The thread message containing the tool call
 * @param isLoading - Whether the tool call is still in progress
 * @returns The status message string, or null if not a tool call message
 */
export function getToolStatusMessage(
  message: TamboThreadMessage,
  isLoading: boolean | undefined,
): string | null {
  const toolCall = getToolCallRequest(message);
  if (message.role !== "assistant" || !toolCall) {
    return null;
  }

  const toolCallMessage = isLoading
    ? `Calling ${toolCall.name ?? "tool"}`
    : `Called ${toolCall.name ?? "tool"}`;
  const toolStatusMessage = isLoading ? toolCall.statusMessage : undefined;
  return toolStatusMessage ?? toolCallMessage;
}
