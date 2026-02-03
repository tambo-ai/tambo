/**
 * Utility functions for tool display in V1 smoketest.
 * Extracted for testability.
 */

// Keys for special Tambo display properties that should be shown as status messages
export const TAMBO_DISPLAY_KEYS = [
  "_tambo_displayMessage",
  "_tambo_statusMessage",
  "_tambo_completionStatusMessage",
] as const;

export type TamboDisplayKey = (typeof TAMBO_DISPLAY_KEYS)[number];

export interface TamboDisplayProps {
  _tambo_displayMessage?: string;
  _tambo_statusMessage?: string;
  _tambo_completionStatusMessage?: string;
}

/**
 * Extracts Tambo display properties from tool input.
 * These are special properties that should be shown as status messages.
 */
export function extractTamboDisplayProps(
  input: Record<string, unknown>,
): TamboDisplayProps {
  const props: TamboDisplayProps = {};
  for (const key of TAMBO_DISPLAY_KEYS) {
    if (key in input && typeof input[key] === "string") {
      props[key] = input[key];
    }
  }
  return props;
}

/**
 * Filters out Tambo display properties from tool input for parameter display.
 * Returns the input with _tambo_* properties removed.
 */
export function filterTamboProps(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!TAMBO_DISPLAY_KEYS.includes(key as TamboDisplayKey)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

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
