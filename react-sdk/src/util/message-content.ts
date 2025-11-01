import type { TamboThreadMessage } from "../model/generate-component-response";
import * as React from "react";
import type { TamboAttachmentKind } from "../hooks/use-message-images";

export interface TamboMessageAttachment {
  kind: TamboAttachmentKind | "other";
  type?: string;
  url?: string;
  mimeType?: string;
  raw: unknown;
}

/**
 * Converts message content into a safely renderable format.
 * Primarily joins text blocks from arrays into a single string.
 * @returns A string or React element that can be safely rendered
 */
export function getSafeContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string | React.ReactElement {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (React.isValidElement(content)) return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => (item?.type === "text" ? (item.text ?? "") : ""))
      .join("");
  }
  return "Invalid content format";
}

/**
 * Checks if message content contains meaningful, non-empty text or images.
 * @returns True if content has meaningful text or images, false otherwise
 */
export function checkHasContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): boolean {
  if (!content) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (React.isValidElement(content)) return true;
  if (Array.isArray(content)) {
    return content.some((item) => {
      if (!item || typeof item !== "object") return false;
      const typedItem = item as {
        type?: string;
        text?: string;
        image_url?: { url?: string };
      };
      if (typedItem.type === "text") return !!typedItem.text?.trim();
      if (typedItem.type === "image_url") return !!typedItem.image_url?.url;
      return false;
    });
  }
  return false;
}

/**
 * Extracts image URLs from message content array.
 * @returns An array of image URLs from the content
 */
export function getMessageImages(
  content: { type?: string; image_url?: { url?: string } }[] | undefined | null,
): string[] {
  return getMessageAttachments(content)
    .filter((attachment) => attachment.kind === "image" && attachment.url)
    .map((attachment) => attachment.url!) as string[];
}

/**
 * Extracts structured attachment data from message content array.
 * Non-text content parts are returned with inferred attachment metadata.
 * @returns Array of attachment metadata for non-text content.
 */
export function getMessageAttachments(
  content:
    | {
        type?: string;
        image_url?: { url?: string; mime_type?: string };
      }[]
    | undefined
    | null,
): TamboMessageAttachment[] {
  if (!Array.isArray(content)) return [];

  const attachments: TamboMessageAttachment[] = [];

  for (const part of content) {
    if (!part || typeof part !== "object") {
      continue;
    }

    const type = part.type ?? "unknown";

    if (type === "text") {
      continue;
    }

    if (type === "image_url") {
      const imageUrl = part.image_url?.url;
      if (imageUrl) {
        attachments.push({
          kind: "image",
          type,
          url: imageUrl,
          mimeType: part.image_url?.mime_type,
          raw: part,
        });
      }
      continue;
    }

    attachments.push({
      // Preserve unknown content parts so renderers can handle them when support lands.
      kind: "other",
      type,
      raw: part,
    });
  }

  return attachments;
}
