import { ReactElement, isValidElement } from "react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { isContentPart, toText } from "./content-parts";

/**
 * Map of file extensions to MIME types for image attachments
 */
const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/**
 * Helper function to process a content part and extract attachment information
 */
function processContentPart(
  item: unknown,
  attachments: TamboMessageAttachment[],
): void {
  const part = item as TamboAI.Beta.Threads.ChatCompletionContentPart;

  // Handle image attachments
  if (part.type === "image_url" && part.image_url?.url) {
    // Try to infer MIME type from data URL or file extension
    let mimeType: string | undefined;
    const url = part.image_url.url;

    if (url.startsWith("data:")) {
      const match = /^data:([^;]+);/.exec(url);
      if (match) {
        mimeType = match[1];
      }
    } else {
      // Try to infer from file extension
      // Strip query string and fragment before extracting extension
      const cleanUrl = url.split("?")[0].split("#")[0];
      const ext = cleanUrl.split(".").pop()?.toLowerCase();
      if (ext) {
        mimeType = EXTENSION_MIME_MAP[ext];
      }
    }

    attachments.push({
      kind: "image",
      type: mimeType,
      url: part.image_url.url,
      mimeType,
      raw: part,
    });
  }

  // Handle audio attachments
  if (part.type === "input_audio" && part.input_audio) {
    const format = part.input_audio.format;
    const mimeType =
      format === "wav"
        ? "audio/wav"
        : format === "mp3"
          ? "audio/mpeg"
          : undefined;

    attachments.push({
      kind: "audio",
      type: mimeType,
      url: undefined, // Audio data is embedded, not a URL
      mimeType,
      raw: part,
    });
  }
}

/**
 * Safely extracts displayable content from unknown message content.
 * Returns either a string for text content or a ReactElement for structured content.
 * @param content - The content to extract, can be string, content part, or unknown
 * @returns A safe string or ReactElement representation of the content
 * @example
 * ```tsx
 * const content = getSafeContent(message.content);
 * // Returns string or ReactElement that can be safely rendered
 * ```
 */
export function getSafeContent(content: unknown): string | ReactElement {
  // Handle null/undefined
  if (content == null) {
    return "";
  }

  // Handle string directly
  if (typeof content === "string") {
    return content;
  }

  // Handle ReactElement (already safe to render)
  if (isValidElement(content)) {
    return content;
  }

  // Handle array of content parts
  if (Array.isArray(content)) {
    const textParts: string[] = [];

    for (const item of content) {
      if (isContentPart(item)) {
        const part = item as TamboAI.Beta.Threads.ChatCompletionContentPart;
        if (part.type === "text" && part.text) {
          textParts.push(part.text);
        } else if (part.type === "image_url" && part.image_url?.url) {
          textParts.push(`[Image: ${part.image_url.url}]`);
        } else if (part.type === "input_audio") {
          textParts.push("[Audio input]");
        }
      } else if (typeof item === "string") {
        textParts.push(item);
      } else {
        textParts.push(toText(item));
      }
    }

    return textParts.join("\n");
  }

  // Handle single content part
  if (isContentPart(content)) {
    const part = content as TamboAI.Beta.Threads.ChatCompletionContentPart;
    if (part.type === "text" && part.text) {
      return part.text;
    } else if (part.type === "image_url" && part.image_url?.url) {
      return `[Image: ${part.image_url.url}]`;
    } else if (part.type === "input_audio") {
      return "[Audio input]";
    }
  }

  // Fallback: convert to string
  return toText(content);
}

/**
 * Checks if the content has any meaningful data.
 * Returns false for empty strings, null, undefined, empty arrays, or whitespace-only strings.
 * @param content - The content to check
 * @returns true if content exists and is non-empty, false otherwise
 * @example
 * ```tsx
 * if (checkHasContent(message.content)) {
 *   // Render message
 * }
 * ```
 */
export function checkHasContent(content: unknown): boolean {
  // Null/undefined check
  if (content == null) {
    return false;
  }

  // String check
  if (typeof content === "string") {
    return content.trim().length > 0;
  }

  // ReactElement is always considered as having content
  if (isValidElement(content)) {
    return true;
  }

  // Array check
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return false;
    }

    // Check if array has any non-empty content parts
    return content.some((item) => {
      if (isContentPart(item)) {
        const part = item as TamboAI.Beta.Threads.ChatCompletionContentPart;
        if (part.type === "text") {
          return part.text != null && part.text.trim().length > 0;
        }
        // Non-text parts (images, audio) are considered as having content
        return true;
      }
      return checkHasContent(item);
    });
  }

  // Single content part check
  if (isContentPart(content)) {
    const part = content as TamboAI.Beta.Threads.ChatCompletionContentPart;
    if (part.type === "text") {
      return part.text != null && part.text.trim().length > 0;
    }
    // Non-text parts are considered as having content
    return true;
  }

  // Object with potential content
  if (typeof content === "object") {
    return true;
  }

  // Numbers, booleans are considered as having content
  return content !== "";
}

/**
 * Type representing different kinds of attachments in a message
 */
export type TamboAttachmentKind = "image" | "document" | "video" | "audio";

/**
 * Interface representing a message attachment with metadata
 */
export interface TamboMessageAttachment {
  /** The kind of attachment (image, document, video, audio, or other) */
  kind: TamboAttachmentKind | "other";
  /** MIME type of the attachment (e.g., "image/png") */
  type?: string;
  /** URL to the attachment resource */
  url?: string;
  /** MIME type (alias for type, for compatibility) */
  mimeType?: string;
  /** Raw content part data */
  raw: unknown;
}

/**
 * Extracts all image URLs from message content.
 * Handles both single content parts and arrays of content parts.
 * @param content - Content part or array of content parts to search for images
 * @returns Array of image URLs found in the content
 * @example
 * ```tsx
 * const imageUrls = getMessageImages(message.content);
 * imageUrls.forEach(url => {
 *   console.log('Image URL:', url);
 * });
 * ```
 */
export function getMessageImages(content: unknown): string[] {
  const images: string[] = [];

  // Handle single content part
  if (!Array.isArray(content)) {
    if (isContentPart(content)) {
      const part = content as TamboAI.Beta.Threads.ChatCompletionContentPart;
      if (part.type === "image_url" && part.image_url?.url) {
        images.push(part.image_url.url);
      }
    }
    return images;
  }

  // Handle array of content parts
  for (const item of content) {
    if (isContentPart(item)) {
      const part = item as TamboAI.Beta.Threads.ChatCompletionContentPart;
      if (part.type === "image_url" && part.image_url?.url) {
        images.push(part.image_url.url);
      }
    }
  }

  return images;
}

/**
 * Extracts all attachments from message content with metadata.
 * Returns structured attachment information including kind, type, and URL.
 * @param content - Content part or array of content parts to search for attachments
 * @returns Array of attachment objects with metadata
 * @example
 * ```tsx
 * const attachments = getMessageAttachments(message.content);
 * attachments.forEach(attachment => {
 *   console.log('Attachment kind:', attachment.kind);
 *   console.log('URL:', attachment.url);
 *   console.log('MIME type:', attachment.mimeType);
 * });
 * ```
 */
export function getMessageAttachments(
  content: unknown,
): TamboMessageAttachment[] {
  const attachments: TamboMessageAttachment[] = [];

  // Handle single content part
  if (!Array.isArray(content)) {
    if (isContentPart(content)) {
      processContentPart(content, attachments);
    }
    return attachments;
  }

  for (const item of content) {
    if (isContentPart(item)) {
      processContentPart(item, attachments);
    }
  }

  return attachments;
}
