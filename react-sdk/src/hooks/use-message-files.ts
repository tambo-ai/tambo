import { useCallback, useState } from "react";
import { useTamboClient } from "../providers/tambo-client-provider";

/**
 * Content type for staged files
 * Determines how the file content will be sent to the AI
 */
export type FileContentType = "image" | "text";

/**
 * Represents a file staged for upload
 */
export interface StagedFile {
  id: string;
  name: string;
  file: File;
  size: number;
  type: string;
  contentType: FileContentType;
  storagePath?: string;
  uploadError?: string;
  isProcessing?: boolean;
}

interface UseMessageFilesReturn {
  files: StagedFile[];
  addFile: (file: File) => Promise<void>;
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

// File upload limits
const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

const SUPPORTED_APPLICATION_TYPES = new Set(["application/pdf"]);

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  text: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
};

const SUPPORTED_TYPE_DESCRIPTION =
  "PDF, plain text, Markdown, CSV, JPEG, and PNG files";

function inferMimeType(file: File): string | undefined {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) return undefined;
  return EXTENSION_MIME_MAP[extension];
}

function isSupportedMimeType(mimeType: string | undefined): boolean {
  if (!mimeType) return false;
  if (SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    return true;
  }
  if (mimeType.startsWith("image/")) {
    return SUPPORTED_IMAGE_TYPES.has(mimeType);
  }
  if (mimeType.startsWith("text/")) {
    return true;
  }
  return SUPPORTED_APPLICATION_TYPES.has(mimeType);
}

/**
 * Determines if a file is a supported type
 * @param file - The file to check
 * @returns True if the file type is supported
 */
function isSupportedFile(file: File): boolean {
  const mimeType = inferMimeType(file);
  return isSupportedMimeType(mimeType);
}

/**
 * Determines the content type for a file
 * @param file - The file to analyze
 * @returns The content type ("image" or "text")
 */
function getFileContentTypeFromMimeType(mimeType: string): FileContentType {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  return "text";
}

/**
 * Hook for managing files in message input
 * Supports images, PDFs, and text files
 * @returns Object with files array and management functions
 */
export function useMessageFiles(): UseMessageFilesReturn {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const client = useTamboClient();

  const uploadFile = useCallback(
    async (file: File): Promise<{ storagePath: string; mimeType: string }> => {
      const formData = new FormData();
      formData.append("file", file);

      // Use the client's base URL for the API request
      const baseUrl = client.baseURL;
      const apiKey = client.apiKey;
      if (!apiKey) {
        throw new Error("API key is required for file upload");
      }
      const response = await fetch(`${baseUrl}/extract/pdf`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`File upload failed: ${error}`);
      }

      const { storagePath, mimeType } = await response.json();
      return { storagePath, mimeType };
    },
    [client],
  );

  const addFile = useCallback(
    async (file: File) => {
      // Check file count limit
      if (files.length >= MAX_FILES) {
        throw new Error(`Maximum ${MAX_FILES} files allowed`);
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File "${file.name}" is too large. Maximum size is 50MB`,
        );
      }

      // Check total size
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        throw new Error(
          "Total file size exceeds 100MB limit. Please remove some files.",
        );
      }

      if (!isSupportedFile(file)) {
        throw new Error(
          `Unsupported file type. Supported: ${SUPPORTED_TYPE_DESCRIPTION}`,
        );
      }

      const initialMimeType = inferMimeType(file);
      if (!initialMimeType) {
        throw new Error(
          `Unable to determine file type for "${file.name}". Supported: ${SUPPORTED_TYPE_DESCRIPTION}`,
        );
      }

      const contentType = getFileContentTypeFromMimeType(initialMimeType);
      const fileId = crypto.randomUUID();

      // Add file in processing state immediately
      const processingFile: StagedFile = {
        id: fileId,
        name: file.name,
        file,
        size: file.size,
        type: initialMimeType,
        contentType,
        isProcessing: true,
      };

      setFiles((prev) => [...prev, processingFile]);
      try {
        const { storagePath, mimeType } = await uploadFile(file);
        const resolvedMimeType = mimeType ?? initialMimeType;
        processingFile.storagePath = storagePath;
        processingFile.type = resolvedMimeType;
        processingFile.contentType =
          getFileContentTypeFromMimeType(resolvedMimeType);
        processingFile.isProcessing = false;

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, ...processingFile } : f)),
        );
      } catch (error) {
        processingFile.uploadError =
          error instanceof Error ? error.message : "Upload failed";
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        throw error;
      }
    },
    [files, uploadFile],
  );

  const addFiles = useCallback(
    async (filesToAdd: File[]) => {
      const filesWithMime = filesToAdd.map((file) => ({
        file,
        mimeType: inferMimeType(file),
      }));

      const supportedFiles = filesWithMime.filter(
        (
          entry,
        ): entry is {
          file: File;
          mimeType: string;
        } => isSupportedMimeType(entry.mimeType),
      );

      if (supportedFiles.length === 0) {
        throw new Error("No supported files provided");
      }

      // Check file count limit
      if (files.length + supportedFiles.length > MAX_FILES) {
        throw new Error(
          `Can only add ${MAX_FILES - files.length} more file(s). Maximum ${MAX_FILES} files allowed`,
        );
      }

      // Check total size
      const currentTotalSize = files.reduce((sum, f) => sum + f.size, 0);
      const newTotalSize = supportedFiles.reduce(
        (sum, entry) => sum + entry.file.size,
        currentTotalSize,
      );

      if (newTotalSize > MAX_TOTAL_SIZE) {
        throw new Error("Total file size would exceed 100MB limit");
      }

      // Add all files in processing state
      const processingFiles: StagedFile[] = supportedFiles.map(
        ({ file, mimeType }) => {
          const resolvedMimeType = mimeType!;
          return {
            id: crypto.randomUUID(),
            name: file.name,
            file,
            size: file.size,
            type: resolvedMimeType,
            contentType: getFileContentTypeFromMimeType(resolvedMimeType),
            isProcessing: true,
          };
        },
      );

      setFiles((prev) => [...prev, ...processingFiles]);
      const processedFiles = await Promise.all(
        processingFiles.map(async (f) => {
          try {
            const { storagePath, mimeType } = await uploadFile(f.file);
            const resolvedMimeType = mimeType ?? f.type;
            return {
              ...f,
              storagePath,
              type: resolvedMimeType,
              contentType: getFileContentTypeFromMimeType(resolvedMimeType),
              isProcessing: false,
            };
          } catch (error) {
            return {
              ...f,
              uploadError:
                error instanceof Error ? error.message : "Upload failed",
              isProcessing: false,
            };
          }
        }),
      );

      setFiles((prev) => {
        const updatedFiles = prev.map((existingFile) => {
          const processed = processedFiles.find(
            (pf) => pf.id === existingFile.id,
          );
          return processed ?? existingFile;
        });
        return updatedFiles.filter((f) => !f.uploadError);
      });
    },
    [files, uploadFile],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    addFile,
    addFiles,
    removeFile,
    clearFiles,
  };
}

// Backwards compatibility exports
export type StagedImage = StagedFile;
export { useMessageFiles as useMessageImages };
