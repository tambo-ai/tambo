import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useEffect, useState } from "react";

/**
 * Custom hook to merge multiple refs into one callback ref
 * @param refs - Array of refs to merge
 * @returns A callback ref that updates all provided refs
 */
export function useMergedRef<T>(...refs: React.Ref<T>[]) {
  return React.useCallback(
    (element: T) => {
      for (const ref of refs) {
        if (!ref) continue;

        if (typeof ref === "function") {
          ref(element);
        } else {
          // This cast is safe because we're just updating the .current property
          (ref as React.MutableRefObject<T>).current = element;
        }
      }
    },
    [refs],
  );
}

/**
 * Custom hook to detect canvas space presence and position
 * @param elementRef - Reference to the component to compare position with
 * @returns Object containing hasCanvasSpace and canvasIsOnLeft
 */
export function useCanvasDetection(
  elementRef: React.RefObject<HTMLElement | null>,
) {
  const [hasCanvasSpace, setHasCanvasSpace] = useState(false);
  const [canvasIsOnLeft, setCanvasIsOnLeft] = useState(false);

  useEffect(() => {
    const checkCanvas = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setHasCanvasSpace(!!canvas);

      if (canvas && elementRef.current) {
        // Check if canvas appears before this component in the DOM
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elementRef.current.getBoundingClientRect();
        setCanvasIsOnLeft(canvasRect.left < elemRect.left);
      }
    };

    // Check on mount and after a short delay to ensure DOM is fully rendered
    checkCanvas();
    const timeoutId = setTimeout(checkCanvas, 100);

    // Re-check on window resize
    window.addEventListener("resize", checkCanvas);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCanvas);
    };
  }, [elementRef]);

  return { hasCanvasSpace, canvasIsOnLeft };
}

/**
 * Utility to check if a className string contains the "right" class
 * @param className - The className string to check
 * @returns true if the className contains "right", false otherwise
 */
export function hasRightClass(className?: string): boolean {
  return className ? /(?:^|\s)right(?:\s|$)/i.test(className) : false;
}

/**
 * Hook to calculate sidebar and history positions based on className and canvas position
 * @param className - Component's className string
 * @param canvasIsOnLeft - Whether the canvas is on the left
 * @returns Object with isLeftPanel and historyPosition values
 */
export function usePositioning(
  className?: string,
  canvasIsOnLeft = false,
  hasCanvasSpace = false,
) {
  const isRightClass = hasRightClass(className);
  const isLeftPanel = !isRightClass;

  // Determine history position
  // If panel has right class, history should be on right
  // If canvas is on left, history should be on right
  // Otherwise, history should be on left
  const historyPosition: "left" | "right" = isRightClass
    ? "right"
    : hasCanvasSpace && canvasIsOnLeft
      ? "right"
      : "left";

  return { isLeftPanel, historyPosition };
}

/**
 * Converts message content into a safely renderable format.
 * Primarily joins text blocks from arrays into a single string.
 * Filters out file content that shouldn't be displayed to the user.
 * @param content - The message content (string, element, array, etc.)
 * @returns A renderable string or React element.
 */
export function getSafeContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string | React.ReactElement {
  if (!content) return "";
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith(STORAGE_REFERENCE_PREFIX)) {
      return "";
    }
    return content;
  }
  if (React.isValidElement(content)) return content; // Pass elements through
  if (Array.isArray(content)) {
    // Filter out non-text items and file content markers, then join text
    return content
      .map((item) => {
        if (item && item.type === "text") {
          const text = item.text ?? "";
          if (text.trim().startsWith(STORAGE_REFERENCE_PREFIX)) {
            return "";
          }
          // Filter out file content sections (everything after "--- File:")
          const fileMarkerIndex = text.indexOf("\n\n--- File:");
          if (fileMarkerIndex !== -1) {
            // Return only the text before the file marker
            return text.substring(0, fileMarkerIndex).trim();
          }
          return text;
        }
        return "";
      })
      .join("");
  }
  // Handle potential edge cases or unknown types
  // console.warn("getSafeContent encountered unknown content type:", content);
  return "Invalid content format"; // Or handle differently
}

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
    const trimmed = typedItem.text?.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed.startsWith(STORAGE_REFERENCE_PREFIX)) {
      return false;
    }
    return true;
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
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith(STORAGE_REFERENCE_PREFIX)) {
      return false;
    }
    return trimmed.length > 0;
  }
  if (React.isValidElement(content)) return true; // Assume elements have content
  if (Array.isArray(content)) {
    return content.some(hasContentInItem);
  }
  return false; // Default for unknown types
}

const STORAGE_REFERENCE_PREFIX = "storage://";

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  text: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  json: "application/json",
  html: "text/html",
  htm: "text/html",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  py: "text/x-python",
  js: "text/javascript",
  mjs: "text/javascript",
  cjs: "text/javascript",
  ts: "text/x-typescript",
  tsx: "text/x-typescript",
  jsx: "text/javascript",
  java: "text/x-java-source",
  cpp: "text/x-c++src",
  c: "text/x-c",
  h: "text/x-c",
  cs: "text/plain",
  go: "text/x-go",
  rb: "text/x-ruby",
  php: "text/x-php",
  swift: "text/x-swift",
  kt: "text/x-kotlin",
  scala: "text/x-scala",
  rs: "text/rust",
  sh: "text/x-shellscript",
  sql: "text/x-sql",
  yaml: "text/yaml",
  yml: "text/yaml",
  css: "text/css",
};

const inferMimeTypeFromFilename = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) {
    return "application/octet-stream";
  }
  return EXTENSION_MIME_MAP[extension] ?? "application/octet-stream";
};

const toSafeFilename = (filename?: string, path?: string): string => {
  if (filename && filename.trim()) {
    return filename.trim();
  }
  if (!path) return "file";
  const pathSegments = path.split("/");
  const fallback = pathSegments[pathSegments.length - 1];
  return fallback && fallback.trim() ? fallback.trim() : "file";
};

const parseStorageReference = (
  raw: string,
): { name: string; mimeType: string } | null => {
  if (!raw.startsWith(STORAGE_REFERENCE_PREFIX)) {
    return null;
  }

  const reference = raw.replace(STORAGE_REFERENCE_PREFIX, "");
  const [path, rawMimeType, rawFilename] = reference.split("|");
  if (!path) {
    return null;
  }

  const name = toSafeFilename(rawFilename, path);
  const trimmedMimeType = rawMimeType?.trim();
  const mimeType =
    trimmedMimeType && trimmedMimeType !== ""
      ? trimmedMimeType
      : inferMimeTypeFromFilename(name);

  return { name, mimeType };
};

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

/**
 * Extracts file attachments (PDFs and text files) from message content.
 * @param content - The message content
 * @returns Array of file attachment info
 */
export interface MessageAttachment {
  readonly name: string;
  readonly mimeType: string;
  readonly source: "storage" | "inline";
}

export function getMessageAttachments(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): MessageAttachment[] {
  if (!content) return [];
  if (!Array.isArray(content)) return [];

  const attachments: MessageAttachment[] = [];

  for (const item of content) {
    if (item && item.type === "text" && item.text) {
      const storageAttachment = parseStorageReference(item.text);
      if (storageAttachment) {
        attachments.push({
          name: storageAttachment.name,
          mimeType: storageAttachment.mimeType,
          source: "storage",
        });
        continue;
      }

      // Look for file markers in text content
      const fileMarkerRegex = /\n\n--- File: (.+?) ---\n/g;
      let match;
      while ((match = fileMarkerRegex.exec(item.text)) !== null) {
        const fileName = match[1];
        attachments.push({
          name: fileName,
          mimeType: inferMimeTypeFromFilename(fileName),
          source: "inline",
        });
      }
    }
  }

  return attachments;
}
