import type TamboAI from "@tambo-ai/typescript-sdk";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  MAX_ATTACHMENT_SIZE,
  uploadAttachment,
  type UploadResult,
} from "../util/attachment-uploader";

/** Maximum number of concurrent uploads */
const MAX_CONCURRENT_UPLOADS = 4;

/**
 * Reason why a file was rejected
 */
export type FileRejectionReason = "unsupported_type" | "file_too_large";

/**
 * Information about a rejected file
 */
export interface RejectedFile {
  file: File;
  reason: FileRejectionReason;
}

/**
 * Options for the useMessageAttachments hook
 */
export interface UseMessageAttachmentsOptions {
  /** TamboAI client for immediate uploads */
  client?: TamboAI;
  /** Callback when files are rejected during batch add */
  onFilesRejected?: (rejectedFiles: RejectedFile[]) => void;
}

/**
 * Attachment type category for determining how to process the file
 */
export type AttachmentType = "image" | "document" | "text" | "unknown";

/**
 * Upload status for an attachment
 */
export type UploadStatus = "pending" | "uploading" | "complete" | "error";

/**
 * Supported MIME types organized by category
 */
export const SUPPORTED_ATTACHMENT_TYPES: Record<AttachmentType, string[]> = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  document: ["application/pdf"],
  text: [
    "text/plain",
    "text/csv",
    "text/markdown",
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/x-javascript",
    "text/ecmascript",
    "application/ecmascript",
    "application/json",
    "application/xml",
    "text/xml",
    "text/typescript",
    "application/typescript",
    "application/x-typescript",
    "text/x-python",
    "text/x-java",
    "text/x-java-source",
    "text/x-c",
    "text/x-cpp",
    "text/x-c++",
    "text/x-c++src",
    "text/x-csharp",
    "text/x-go",
    "text/x-rust",
    "text/x-typescript",
    "text/x-ruby",
    "text/x-php",
    "application/x-php",
    "text/x-shellscript",
    "application/x-sh",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-swift",
    "text/x-objective-c",
    "text/x-objcsrc",
    "text/x-yaml",
    "application/x-yaml",
  ],
  unknown: [],
};

/**
 * MIME types considered "code" for icon rendering.
 */
export const CODE_MIME_TYPES = [
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
  "text/ecmascript",
  "application/ecmascript",
  "text/typescript",
  "application/typescript",
  "application/x-typescript",
  "text/x-typescript",
  "text/x-python",
  "text/x-java",
  "text/x-java-source",
  "text/x-c",
  "text/x-cpp",
  "text/x-c++",
  "text/x-c++src",
  "text/x-csharp",
  "text/x-go",
  "text/x-rust",
  "text/x-ruby",
  "text/x-php",
  "application/x-php",
  "text/x-shellscript",
  "application/x-sh",
  "text/x-kotlin",
  "text/x-scala",
  "text/x-swift",
  "text/x-objective-c",
  "text/x-objcsrc",
] as const;

/**
 * File extensions mapped to their MIME types for fallback detection
 */
const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  // Documents
  pdf: "application/pdf",
  // Text files
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  markdown: "text/markdown",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  jsx: "text/javascript",
  ts: "text/x-typescript",
  tsx: "text/x-typescript",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  py: "text/x-python",
  java: "text/x-java",
  c: "text/x-c",
  h: "text/x-c",
  cpp: "text/x-cpp",
  hpp: "text/x-cpp",
  cc: "text/x-cpp",
  cs: "text/x-csharp",
  go: "text/x-go",
  rs: "text/x-rust",
};

/**
 * Represents an attachment staged for upload.
 * Includes upload status tracking for presigned URL uploads.
 */
export interface StagedAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** Original file name */
  name: string;
  /**
   * URL for preview. When a client is provided, this is an Object URL (memory-efficient).
   * In fallback mode (no client), this is a data URL (base64 encoded) for embedding in messages.
   */
  dataUrl: string;
  /** Text content for text-based files */
  textContent?: string;
  /** Original file reference */
  file: File;
  /** File size in bytes */
  size: number;
  /**
   * MIME type of the file.
   * @deprecated Use mimeType instead. Kept as 'type' for backwards compatibility with StagedImage.
   */
  type: string;
  /** MIME type of the file */
  mimeType: string;
  /** Category of the attachment */
  attachmentType: AttachmentType;
  /** Current upload status */
  uploadStatus: UploadStatus;
  /** Result of successful upload (contains attachmentUri) */
  uploadResult?: UploadResult;
  /** Error from failed upload */
  uploadError?: Error;
}

/**
 * @deprecated Use StagedAttachment instead. This alias is kept for backwards compatibility.
 */
export type StagedImage = StagedAttachment;

interface UseMessageAttachmentsReturn {
  /** Currently staged attachments */
  attachments: StagedAttachment[];
  /** Add a single file as attachment (starts upload immediately if client provided) */
  addAttachment: (file: File) => Promise<void>;
  /** Add multiple files as attachments (starts uploads immediately if client provided) */
  addAttachments: (files: File[]) => Promise<void>;
  /** Remove an attachment by id */
  removeAttachment: (id: string) => void;
  /** Clear all staged attachments */
  clearAttachments: () => void;
  /** Whether any uploads are in progress */
  isUploading: boolean;
  /** Whether all uploads have completed successfully */
  allUploadsComplete: boolean;
  /** Whether any uploads have failed */
  hasUploadErrors: boolean;
  /**
   * @deprecated Use attachments instead
   */
  images: StagedAttachment[];
  /**
   * @deprecated Use addAttachment instead
   */
  addImage: (file: File) => Promise<void>;
  /**
   * @deprecated Use addAttachments instead
   */
  addImages: (files: File[]) => Promise<void>;
  /**
   * @deprecated Use removeAttachment instead
   */
  removeImage: (id: string) => void;
  /**
   * @deprecated Use clearAttachments instead
   */
  clearImages: () => void;
}

/**
 * Determines the MIME type from a file, using extension as fallback
 * @param file - The file to get the MIME type for
 * @returns The MIME type string
 */
export function getMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && extension in EXTENSION_TO_MIME) {
    return EXTENSION_TO_MIME[extension];
  }

  return file.type || "application/octet-stream";
}

/**
 * Determines the attachment type category from a MIME type
 * @param mimeType - The MIME type to categorize
 * @returns The attachment type category
 */
export function getAttachmentType(mimeType: string): AttachmentType {
  for (const [type, mimeTypes] of Object.entries(SUPPORTED_ATTACHMENT_TYPES)) {
    if (type === "unknown") continue;
    if (mimeTypes.includes(mimeType)) {
      return type as AttachmentType;
    }
  }

  // Fallback checks for broader categories
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/")) return "text";

  return "unknown";
}

/**
 * Checks if a file type is supported
 * @param file - The file to check
 * @returns Whether the file type is supported
 */
export function isFileTypeSupported(file: File): boolean {
  const mimeType = getMimeType(file);
  return getAttachmentType(mimeType) !== "unknown";
}

/**
 * Gets a list of all supported MIME types
 * @returns Array of supported MIME type strings
 */
export function getAllSupportedMimeTypes(): string[] {
  return Object.values(SUPPORTED_ATTACHMENT_TYPES).flat();
}

/**
 * Gets the accept string for file inputs
 * @returns Comma-separated string of MIME types and extensions for input accept attribute
 */
export function getAcceptString(): string {
  const mimeTypes = getAllSupportedMimeTypes();
  const extensions = Object.keys(EXTENSION_TO_MIME).map((ext) => `.${ext}`);
  return [...mimeTypes, ...extensions].join(",");
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToText(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Determines if we need to read the file as a data URL (base64).
 * Data URLs are only needed in fallback mode (no client) for embedding content in messages.
 * When a client is provided, we use memory-efficient Object URLs for preview instead.
 * @returns Whether the file should be read as a data URL
 */
function shouldReadAsDataUrl(
  attachmentType: AttachmentType,
  client?: TamboAI,
): boolean {
  // In fallback mode (no client), we need data URLs for embedding in messages
  if (!client) {
    // Images and documents need data URLs for inline embedding
    return attachmentType === "image" || attachmentType === "document";
  }
  // With client, uploads go to S3 - we use Object URLs for preview (memory efficient)
  return false;
}

/**
 * Determines if we should create an Object URL for preview.
 * Object URLs are memory-efficient (don't load file into JS heap).
 * @returns Whether an Object URL should be created
 */
function shouldCreateObjectUrl(
  attachmentType: AttachmentType,
  client?: TamboAI,
): boolean {
  // Only images need preview URLs when client is provided
  return attachmentType === "image" && !!client;
}

/**
 * Hook for managing attachments in message input.
 * Supports images, PDFs, text files, CSV, markdown, JSON, and code files.
 * When a client is provided, uploads start immediately when files are added.
 * @param options - Hook options including client and callbacks
 * @returns Object with attachments array, management functions, and upload status
 */
export function useMessageAttachments(
  options: UseMessageAttachmentsOptions | TamboAI = {},
): UseMessageAttachmentsReturn {
  // Support both old signature (client only) and new signature (options object)
  const { client, onFilesRejected } =
    options && "post" in options
      ? { client: options, onFilesRejected: undefined }
      : options;
  const [attachments, setAttachments] = useState<StagedAttachment[]>([]);

  // Track active uploads for concurrency limiting
  const activeUploadsRef = useRef(0);
  const uploadQueueRef = useRef<StagedAttachment[]>([]);

  const updateAttachmentStatus = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<StagedAttachment, "uploadStatus" | "uploadResult" | "uploadError">
      >,
    ) => {
      setAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === id ? { ...attachment, ...updates } : attachment,
        ),
      );
    },
    [],
  );

  /**
   * Process the next item in the upload queue if under concurrency limit
   */
  const processUploadQueue = useCallback(() => {
    if (!client) return;

    while (
      activeUploadsRef.current < MAX_CONCURRENT_UPLOADS &&
      uploadQueueRef.current.length > 0
    ) {
      const attachment = uploadQueueRef.current.shift();
      if (!attachment) break;

      activeUploadsRef.current++;
      updateAttachmentStatus(attachment.id, { uploadStatus: "uploading" });

      uploadAttachment(
        client,
        attachment.file,
        attachment.mimeType,
        attachment.attachmentType,
      )
        .then((result) => {
          updateAttachmentStatus(attachment.id, {
            uploadStatus: "complete",
            uploadResult: result,
          });
        })
        .catch((error: unknown) => {
          updateAttachmentStatus(attachment.id, {
            uploadStatus: "error",
            uploadError:
              error instanceof Error ? error : new Error("Upload failed"),
          });
        })
        .finally(() => {
          activeUploadsRef.current--;
          processUploadQueue(); // Process next in queue
        });
    }
  }, [client, updateAttachmentStatus]);

  /**
   * Queue an attachment for upload with concurrency limiting
   */
  const queueUpload = useCallback(
    (attachment: StagedAttachment) => {
      if (!client) return;
      uploadQueueRef.current.push(attachment);
      processUploadQueue();
    },
    [client, processUploadQueue],
  );

  const addAttachment = useCallback(
    async (file: File) => {
      // Check file size BEFORE reading into memory
      if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new Error(`File ${file.name} exceeds the maximum size of 10MB.`);
      }

      const mimeType = getMimeType(file);
      const attachmentType = getAttachmentType(mimeType);

      if (attachmentType === "unknown") {
        throw new Error(
          `Unsupported file type: ${mimeType}. Supported types include images, PDFs, and text files.`,
        );
      }

      // Generate preview URL - use memory-efficient Object URLs when uploading,
      // or data URLs for fallback mode (needed for inline embedding in messages)
      let dataUrl = "";
      if (shouldCreateObjectUrl(attachmentType, client)) {
        // Object URL - memory efficient, just references the file
        dataUrl = URL.createObjectURL(file);
      } else if (shouldReadAsDataUrl(attachmentType, client)) {
        // Data URL - needed for inline embedding in fallback mode
        dataUrl = await fileToDataUrl(file);
      }

      // For text-based files, read the text content
      let textContent: string | undefined;
      if (attachmentType === "text") {
        textContent = await fileToText(file);
      }

      const newAttachment: StagedAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl,
        textContent,
        file,
        size: file.size,
        type: mimeType, // backwards compat
        mimeType,
        attachmentType,
        uploadStatus: client ? "pending" : "complete", // If no client, treat as complete (inline mode)
      };

      setAttachments((prev) => [...prev, newAttachment]);

      // Queue upload if client is provided (with concurrency limiting)
      if (client) {
        queueUpload(newAttachment);
      }
    },
    [client, queueUpload],
  );

  const addAttachments = useCallback(
    async (files: File[]) => {
      const rejectedFiles: RejectedFile[] = [];
      const validFiles: File[] = [];

      // Validate all files BEFORE reading any into memory
      for (const file of files) {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          rejectedFiles.push({ file, reason: "file_too_large" });
          continue;
        }

        const mimeType = getMimeType(file);
        if (getAttachmentType(mimeType) === "unknown") {
          rejectedFiles.push({ file, reason: "unsupported_type" });
          continue;
        }

        validFiles.push(file);
      }

      // Notify about rejected files
      if (rejectedFiles.length > 0 && onFilesRejected) {
        onFilesRejected(rejectedFiles);
      }

      if (validFiles.length === 0) {
        throw new Error(
          "No valid files provided. Supported types include images, PDFs, and text files.",
        );
      }

      const newAttachments = await Promise.all(
        validFiles.map(async (file) => {
          const mimeType = getMimeType(file);
          const attachmentType = getAttachmentType(mimeType);

          // Generate preview URL - use memory-efficient Object URLs when uploading,
          // or data URLs for fallback mode (needed for inline embedding in messages)
          let dataUrl = "";
          if (shouldCreateObjectUrl(attachmentType, client)) {
            // Object URL - memory efficient, just references the file
            dataUrl = URL.createObjectURL(file);
          } else if (shouldReadAsDataUrl(attachmentType, client)) {
            // Data URL - needed for inline embedding in fallback mode
            dataUrl = await fileToDataUrl(file);
          }

          // For text-based files, read the text content
          let textContent: string | undefined;
          if (attachmentType === "text") {
            textContent = await fileToText(file);
          }

          return {
            id: crypto.randomUUID(),
            name: file.name,
            dataUrl,
            textContent,
            file,
            size: file.size,
            type: mimeType, // backwards compat
            mimeType,
            attachmentType,
            uploadStatus: (client ? "pending" : "complete") as UploadStatus,
          };
        }),
      );

      setAttachments((prev) => [...prev, ...newAttachments]);

      // Queue uploads with concurrency limiting if client is provided
      if (client) {
        for (const attachment of newAttachments) {
          queueUpload(attachment);
        }
      }
    },
    [client, onFilesRejected, queueUpload],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      // Find and cleanup Object URL before removing
      const toRemove = prev.find((a) => a.id === id);
      if (toRemove?.dataUrl.startsWith("blob:")) {
        URL.revokeObjectURL(toRemove.dataUrl);
      }
      return prev.filter((attachment) => attachment.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      // Cleanup all Object URLs before clearing
      for (const attachment of prev) {
        if (attachment.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.dataUrl);
        }
      }
      return [];
    });
  }, []);

  // Computed upload status
  const isUploading = useMemo(
    () =>
      attachments.some(
        (a) => a.uploadStatus === "uploading" || a.uploadStatus === "pending",
      ),
    [attachments],
  );

  const allUploadsComplete = useMemo(
    () =>
      attachments.length > 0 &&
      attachments.every((a) => a.uploadStatus === "complete"),
    [attachments],
  );

  const hasUploadErrors = useMemo(
    () => attachments.some((a) => a.uploadStatus === "error"),
    [attachments],
  );

  return {
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    clearAttachments,
    isUploading,
    allUploadsComplete,
    hasUploadErrors,
    // Backwards compatibility aliases
    images: attachments,
    addImage: addAttachment,
    addImages: addAttachments,
    removeImage: removeAttachment,
    clearImages: clearAttachments,
  };
}

// Re-export upload types for convenience
export {
  AttachmentUploadError,
  MAX_ATTACHMENT_SIZE,
} from "../util/attachment-uploader";
export type { UploadResult } from "../util/attachment-uploader";
