import { parse } from "partial-json";

export function extractMessageContent(
  content: string | null,
  log: boolean = true,
) {
  // BUG: Sometimes the llm returns a json object representing a LegacyComponentDecision with a message field, rather than a string. Here we check for that case and extract the message field.
  if (!content) return "";

  try {
    const parsed = parse(content); // parse partial json
    if (log) {
      console.warn(
        "noComponentResponse message is a json object, extracting message",
      );
    }
    if (parsed && typeof parsed === "object") {
      if ("message" in parsed) {
        return parsed.message;
      }
      if (isPartialLegacyComponentDecision(parsed)) {
        return "";
      }
    }
  } catch {
    // json parse failed, treat it as a regular string message
    return content;
  }
  return content;
}

// Check if the object is a partial LegacyComponentDecision
function isPartialLegacyComponentDecision(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;

  return [
    "reasoning",
    "componentName",
    "props",
    "componentState",
    "suggestedActions",
  ].some((prop) => prop in obj);
}
