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
  if (message.role !== "assistant" || !getToolCallRequest(message)) {
    return null;
  }

  const toolCallMessage = isLoading
    ? `Calling ${getToolCallRequest(message)?.toolName ?? "tool"}`
    : `Called ${getToolCallRequest(message)?.toolName ?? "tool"}`;
  const toolStatusMessage = isLoading
    ? message.component?.statusMessage
    : message.component?.completionStatusMessage;
  return toolStatusMessage ?? toolCallMessage;
}
