import type { Content, TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

/**
 * Checks if a content part (Content) has meaningful data.
 * @param item - A content part object with type field. Assuming it's a partial type since this is a runtime check.
 * @returns True if the item has content, false otherwise.
 */
function hasMeaningfulContent(item: Partial<Content>): boolean {
  switch (item.type) {
    case "text": {
      return !!item.text?.trim();
    }

    case "resource": {
      return item.resource != null;
    }

    // `'tool_use'` and `'component'` types are considered to always have content, as
    // they have their own rendering logic
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
 * This is a runtime check as well, so we're not assuming the item is strictly
 * the correct type.
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
    // Since this is a runtime check, we can't be sure of the type, but if it
    // has a "type" field, we'll treat it as a Content part 🦆
    const typedItem = item as Content;

    // If it doesn't have a type field, it's not a valid content part
    if (!typedItem.type) {
      return false;
    }

    return hasMeaningfulContent(typedItem);
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
