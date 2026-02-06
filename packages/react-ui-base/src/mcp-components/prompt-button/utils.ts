import type { PromptMessage } from "./root/mcp-prompt-button-context";

/**
 * Validates that prompt data has a valid messages array structure.
 * @param promptData - The prompt data to validate
 * @returns true if the prompt data has valid messages, false otherwise
 */
export function isValidPromptData(
  promptData: unknown,
): promptData is { messages: PromptMessage[] } {
  if (!promptData || typeof promptData !== "object") {
    return false;
  }

  const data = promptData as { messages?: unknown };
  if (!Array.isArray(data.messages)) {
    return false;
  }

  return true;
}

/**
 * Safely extracts text content from prompt messages.
 * Handles malformed or missing content gracefully.
 * @param messages - Array of prompt messages
 * @returns Extracted text content joined by newlines
 */
export function extractPromptText(messages: PromptMessage[]): string {
  return messages
    .map((msg) => {
      // Safely access nested properties
      if (
        msg?.content?.type === "text" &&
        typeof msg.content.text === "string"
      ) {
        return msg.content.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}
