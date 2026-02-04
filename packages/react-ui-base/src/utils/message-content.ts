import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

/**
 * Escapes special characters in markdown link text to prevent syntax breaking.
 * Escapes brackets and replaces newlines with spaces.
 *
 * @param text - The text to escape
 * @returns The escaped text safe for use in markdown link text
 */
function escapeMarkdownLinkText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/[\r\n]+/g, " ");
}

/**
 * Converts message content to markdown format for rendering with streamdown.
 * Handles text and resource content parts, converting resources to markdown links
 * with a custom URL scheme that will be rendered as Mention components.
 *
 * @param content - The message content (string, element, array, etc.)
 * @returns A markdown string ready for streamdown rendering
 */
export function convertContentToMarkdown(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (React.isValidElement(content)) {
    // React elements cannot be converted to markdown. This typically indicates
    // the content was already rendered or is being used incorrectly.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "convertContentToMarkdown: Received a React element instead of message content. " +
          "This usually means the content was already rendered. Returning empty string.",
      );
    }
    return "";
  }
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const item of content) {
      if (item?.type === "text") {
        parts.push(item.text ?? "");
      } else if (item?.type === "resource") {
        const resource = item.resource;
        const uri = resource?.uri;
        if (uri) {
          // Use resource name for display, fallback to URI if no name
          const displayName = resource?.name ?? uri;
          // Escape special characters in display name to prevent markdown syntax breaking
          const escapedDisplayName = escapeMarkdownLinkText(displayName);
          // Use a custom protocol that looks more standard to avoid blocking
          // Format: tambo-resource://<encoded-uri>
          // We'll detect this in the link component and decode the URI
          const encodedUri = encodeURIComponent(uri);
          parts.push(`[${escapedDisplayName}](tambo-resource://${encodedUri})`);
        }
      }
    }
    return parts.join(" ");
  }
  return "";
}

/**
 * Extracts image URLs from message content array.
 * @param content - Array of content items
 * @returns Array of image URLs
 */
export function getMessageImages(
  content: { type?: string; image_url?: { url?: string } }[] | undefined | null,
): string[] {
  if (!content) return [];

  return content
    .filter((item) => item?.type === "image_url" && item.image_url?.url)
    .map((item) => item.image_url!.url!);
}
