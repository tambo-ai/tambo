import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

/**
 * Checks if an API content part (ChatCompletionContentPart) has meaningful data.
 * @param item - A content part object with type field
 * @returns True if the item has content, false otherwise.
 */
function hasContentInApiPart(item: {
  type?: string;
  text?: string;
  image_url?: { url?: string };
  input_audio?: { data?: string };
  resource?: unknown;
}): boolean {
  switch (item.type) {
    case "text": {
      return !!item.text?.trim();
    }

    case "image_url": {
      return !!item.image_url?.url;
    }

    case "input_audio": {
      return !!item.input_audio?.data;
    }

    case "resource": {
      return item.resource != null;
    }

    case "tool_use":
    case "component": {
      return true;
    }

    default: {
      return false;
    }
  }
}

/**
 * Checks if an array item has meaningful content.
 * Handles both API content parts (objects with type field) and ReactNode items.
 * @param item - An item from the content array
 * @returns True if the item has content, false otherwise.
 */
function hasContentInArrayItem(item: unknown): boolean {
  // Handle null/undefined
  if (item == null) return false;

  // Handle strings (non-empty after trimming)
  if (typeof item === "string") return item.trim().length > 0;

  // Handle numbers (always truthy except NaN)
  if (typeof item === "number") return !Number.isNaN(item);

  // Handle React elements (assume they have content)
  if (React.isValidElement(item)) return true;

  // Handle objects (API content parts with type field)
  if (typeof item === "object") {
    const typedItem = item as {
      type?: string;
      text?: string;
      image_url?: { url?: string };
      input_audio?: { data?: string };
      resource?: unknown;
    };

    // Check if it's an API content part (has type field)
    if (typedItem.type !== undefined) {
      return hasContentInApiPart(typedItem);
    }
  }

  // Booleans and other primitives are not considered content
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
  if (content == null) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (typeof content === "number") return !Number.isNaN(content);
  if (React.isValidElement(content)) return true; // Assume elements have content
  if (Array.isArray(content)) {
    return content.some(hasContentInArrayItem);
  }
  return false; // Default for unknown types (booleans, etc.)
}
