import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

/**
 * Checks if a content item has meaningful data.
 * @param item - A content item from the message
 * @returns True if the item has content, false otherwise.
 */
function hasContentInItem(item: unknown): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const typedItem = item as {
    type?: string;
    text?: string;
    image_url?: { url?: string };
  };

  // Check for text content
  if (typedItem.type === "text") {
    return !!typedItem.text?.trim();
  }

  // Check for image content
  if (typedItem.type === "image_url") {
    return !!typedItem.image_url?.url;
  }

  return false;
}

/**
 * Checks if message content contains meaningful, non-empty text or images.
 * @param content - The message content (string, element, array, etc.)
 * @returns True if there is content, false otherwise.
 */
export function checkHasContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): boolean {
  if (!content) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (React.isValidElement(content)) return true; // Assume elements have content
  if (Array.isArray(content)) {
    return content.some(hasContentInItem);
  }
  return false; // Default for unknown types
}
