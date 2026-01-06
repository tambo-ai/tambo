import { useCallback, useState } from "react";

/**
 * Preview information for staged attachments
 */
export interface AttachmentPreview {
  /** Type of preview */
  type: "image" | "text" | "csv" | "generic";
  /** For text files: first 30 characters */
  textPreview?: string;
  /** For CSV files: row and column count */
  dimensions?: { rows: number; columns: number };
}

/**
 * Represents a file attachment staged for upload to storage
 */
export interface StagedAttachment {
  /** Unique identifier for this staged attachment */
  id: string;
  /** Original filename */
  name: string;
  /** The File object */
  file: File;
  /** File size in bytes */
  size: number;
  /** MIME type of the file */
  mimeType: string;
  /** Upload status */
  status: "pending" | "uploading" | "uploaded" | "error";
  /** Storage path after successful upload (e.g., "projectId/1699999999-document.pdf") */
  storagePath?: string;
  /** Error message if upload failed */
  error?: string;
  /** Local preview URL for images (blob URL for client-side preview) */
  dataUrl?: string;
  /** Preview information for displaying attachment content summary */
  preview?: AttachmentPreview;
}

interface UseMessageAttachmentsReturn {
  /** Array of staged attachments */
  stagedAttachments: StagedAttachment[];
  /**
   * Add attachments and upload to storage
   * @returns Array of newly created staged attachments (useful for inserting mentions)
   */
  addAttachments: (files: File[]) => Promise<StagedAttachment[]>;
  /** Remove a staged attachment by ID */
  removeAttachment: (id: string) => void;
  /** Clear all staged attachments */
  clearAttachments: () => void;
  /** Whether any attachments are currently uploading */
  isUploading: boolean;
  /** Whether any attachments have errors */
  hasErrors: boolean;
}

// Attachment upload limits
const ATTACHMENT_LIMITS = {
  maxAttachments: 10,
  maxAttachmentSize: 50 * 1024 * 1024, // 50MB per attachment
  maxTotalSize: 100 * 1024 * 1024, // 100MB total
};

// Supported MIME types by category
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const SUPPORTED_DOCUMENT_TYPES = new Set(["application/pdf"]);

const SUPPORTED_TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/javascript",
  "text/typescript",
  "application/json",
  "application/xml",
]);

// Extension to MIME type mapping for files without proper MIME type
const EXTENSION_MIME_MAP: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  // Documents
  pdf: "application/pdf",
  // Text
  txt: "text/plain",
  text: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  html: "text/html",
  htm: "text/html",
  js: "text/javascript",
  ts: "text/typescript",
  json: "application/json",
  xml: "application/xml",
};

/**
 * Infer MIME type from file, falling back to extension-based detection
 * @returns The MIME type string or undefined if not determinable
 */
function inferMimeType(file: File): string | undefined {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) return undefined;
  return EXTENSION_MIME_MAP[extension];
}

/**
 * Check if a MIME type is supported
 * @returns True if the MIME type is supported for upload
 */
function isSupportedMimeType(mimeType: string | undefined): boolean {
  if (!mimeType) return false;
  return (
    SUPPORTED_IMAGE_TYPES.has(mimeType) ||
    SUPPORTED_DOCUMENT_TYPES.has(mimeType) ||
    SUPPORTED_TEXT_TYPES.has(mimeType) ||
    mimeType.startsWith("text/")
  );
}

/**
 * Get a human-readable description of supported file types
 * @returns A formatted string listing supported file types
 */
function getSupportedTypesDescription(): string {
  return "Images (JPEG, PNG, GIF, WebP), Documents (PDF), Text files (TXT, MD, CSV, HTML, JS, TS, JSON, XML)";
}

/**
 * Generate a preview for an attachment based on its type
 * @returns Preview information for the attachment
 */
async function generateAttachmentPreview(
  file: File,
  mimeType: string,
): Promise<AttachmentPreview> {
  // Images - preview handled separately via dataUrl
  if (mimeType.startsWith("image/")) {
    return { type: "image" };
  }

  // CSV files - count rows and columns
  if (mimeType === "text/csv") {
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const rows = lines.length;
      // Count columns from first line (header)
      const columns = lines[0] ? lines[0].split(",").length : 0;
      return {
        type: "csv",
        dimensions: { rows, columns },
      };
    } catch {
      return { type: "generic" };
    }
  }

  // Text files - show first 30 characters
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  ) {
    try {
      const text = await file.text();
      const preview = text.slice(0, 30).trim();
      return {
        type: "text",
        textPreview: preview + (text.length > 30 ? "..." : ""),
      };
    } catch {
      return { type: "generic" };
    }
  }

  // PDFs and other files - generic preview
  return { type: "generic" };
}

/**
 * Convert a File to a base64 data URL
 * @returns Promise resolving to the data URL string
 */
async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as data URL"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Hook for managing file attachments in message input.
 * Currently operates in local-only mode with dataUrl for images.
 * Future versions will support cloud storage uploads.
 * @example
 * ```tsx
 * const { stagedAttachments, addAttachments, removeAttachment, clearAttachments, isUploading } = useMessageAttachments();
 *
 * const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const files = Array.from(e.target.files || []);
 *   await addAttachments(files);
 * };
 * ```
 * @returns Object with staged attachments array and management functions
 */
export function useMessageAttachments(): UseMessageAttachmentsReturn {
  const [stagedAttachments, setStagedAttachments] = useState<
    StagedAttachment[]
  >([]);

  const addAttachments = useCallback(
    async (files: File[]): Promise<StagedAttachment[]> => {
      // Validate attachment count
      const totalCount = stagedAttachments.length + files.length;
      if (totalCount > ATTACHMENT_LIMITS.maxAttachments) {
        throw new Error(
          `Maximum ${ATTACHMENT_LIMITS.maxAttachments} attachments allowed. You can add ${ATTACHMENT_LIMITS.maxAttachments - stagedAttachments.length} more.`,
        );
      }

      // Validate and prepare attachments
      const preparedAttachments: {
        file: File;
        mimeType: string;
        id: string;
      }[] = [];
      let addedSize = 0;

      for (const file of files) {
        // Check individual attachment size
        if (file.size > ATTACHMENT_LIMITS.maxAttachmentSize) {
          throw new Error(
            `File "${file.name}" is too large. Maximum size is ${ATTACHMENT_LIMITS.maxAttachmentSize / (1024 * 1024)}MB.`,
          );
        }

        // Infer and validate MIME type
        const mimeType = inferMimeType(file);
        if (!isSupportedMimeType(mimeType)) {
          throw new Error(
            `File "${file.name}" has unsupported type "${mimeType ?? "unknown"}". Supported: ${getSupportedTypesDescription()}`,
          );
        }

        addedSize += file.size;
        preparedAttachments.push({
          file,
          mimeType: mimeType!,
          id: crypto.randomUUID(),
        });
      }

      // Check total size
      const currentTotalSize = stagedAttachments.reduce(
        (sum, a) => sum + a.size,
        0,
      );
      if (currentTotalSize + addedSize > ATTACHMENT_LIMITS.maxTotalSize) {
        throw new Error(
          `Total attachment size would exceed ${ATTACHMENT_LIMITS.maxTotalSize / (1024 * 1024)}MB limit.`,
        );
      }

      // Generate previews and dataUrls for all attachments in parallel
      const attachmentData = await Promise.all(
        preparedAttachments.map(async ({ file, mimeType }) => {
          const preview = await generateAttachmentPreview(file, mimeType);
          // Generate dataUrl for all attachments (used for message content in local mode)
          // Images use dataUrl for display preview, all attachments use it for message content
          const dataUrl = await fileToDataUrl(file);
          return { preview, dataUrl };
        }),
      );

      // Attachments are ready immediately with embedded dataUrl content
      // When storage uploads are implemented, this will upload to storage first
      const newStagedAttachments: StagedAttachment[] = preparedAttachments.map(
        ({ file, mimeType, id }, index) => ({
          id,
          name: file.name,
          file,
          size: file.size,
          mimeType,
          status: "uploaded" as const,
          dataUrl: attachmentData[index].dataUrl,
          preview: attachmentData[index].preview,
        }),
      );

      setStagedAttachments((prev) => [...prev, ...newStagedAttachments]);

      return newStagedAttachments;
    },
    [stagedAttachments],
  );

  const removeAttachment = useCallback((id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setStagedAttachments([]);
  }, []);

  const isUploading = stagedAttachments.some((a) => a.status === "uploading");
  const hasErrors = stagedAttachments.some((a) => a.status === "error");

  return {
    stagedAttachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
    isUploading,
    hasErrors,
  };
}

// =============================================================================
// Backwards Compatibility (for useMessageImages which existed before this PR)
// =============================================================================

/**
 * @deprecated Use StagedAttachment instead
 */
export type StagedImage = StagedAttachment;

/**
 * @deprecated Use useMessageAttachments instead
 */
export { useMessageAttachments as useMessageImages };
