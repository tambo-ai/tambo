/**
 * Utility functions for tool display in V1 smoketest.
 */

type ToolResultContent =
  | string
  | Array<{ type: string; text?: string }>
  | unknown;

/**
 * Formats tool result content for display.
 * - Parses JSON strings and pretty-prints them
 * - Extracts text from array content parts
 * - Falls back to JSON.stringify for unknown formats
 */
export function formatToolResultContent(
  resultContent: ToolResultContent,
): string {
  if (typeof resultContent === "string") {
    try {
      return JSON.stringify(JSON.parse(resultContent), null, 2);
    } catch {
      return resultContent;
    }
  }
  if (Array.isArray(resultContent)) {
    const textParts = resultContent
      .filter(
        (item): item is { type: "text"; text: string } =>
          item.type === "text" && typeof item.text === "string",
      )
      .map((item) => item.text);
    const combined = textParts.join("");
    try {
      return JSON.stringify(JSON.parse(combined), null, 2);
    } catch {
      return combined;
    }
  }
  return JSON.stringify(resultContent, null, 2);
}
