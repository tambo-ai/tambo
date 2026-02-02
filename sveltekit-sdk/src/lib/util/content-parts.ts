import type { ContentPart, TextContentPart } from "../types.js";

/**
 * Convert content to text string
 * @param content - Content to convert (string, ContentPart[], or unknown)
 * @returns Text representation of the content
 */
export function toText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (content === null || content === undefined) {
    return "";
  }

  if (Array.isArray(content)) {
    return content
      .filter(isTextContentPart)
      .map((part) => part.text)
      .join("");
  }

  return JSON.stringify(content);
}

/**
 * Type guard for TextContentPart
 */
export function isTextContentPart(part: unknown): part is TextContentPart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as ContentPart).type === "text" &&
    "text" in part
  );
}

/**
 * Extract text from message content
 * @param content - Message content (string or ContentPart[])
 * @returns Extracted text string
 */
export function extractTextFromContent(
  content: string | ContentPart[] | null | undefined,
): string {
  if (!content) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  return toText(content);
}

/**
 * Check if content has images
 * @param content - Message content
 * @returns True if content contains images
 */
export function hasImages(
  content: string | ContentPart[] | null | undefined,
): boolean {
  if (!content || typeof content === "string") {
    return false;
  }
  return content.some((part) => part.type === "image_url");
}
