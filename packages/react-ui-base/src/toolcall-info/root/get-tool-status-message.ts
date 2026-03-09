import type { TamboToolUseContent } from "@tambo-ai/react";

/**
 * Gets the status message for a single tool call request.
 * Returns the custom `statusMessage` if available, otherwise generates a default one.
 *
 * @param toolCallRequest - The tool_use block for the tool call.
 * @param isLoading - Whether the tool call is still in progress.
 * @returns The status message string, or null if `toolCallRequest` is not provided.
 */
export function getToolStatusMessage(
  toolCallRequest: TamboToolUseContent | null | undefined,
  isLoading: boolean | undefined,
): string | null {
  if (!toolCallRequest) {
    return null;
  }

  const toolCallMessage = isLoading
    ? `Calling ${toolCallRequest.name ?? "tool"}`
    : `Called ${toolCallRequest.name ?? "tool"}`;
  const toolStatusMessage = isLoading
    ? toolCallRequest.statusMessage
    : undefined;
  return toolStatusMessage ?? toolCallMessage;
}
