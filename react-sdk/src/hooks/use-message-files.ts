import { useCallback, useState } from "react";

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

// Supported MIME types for file uploads
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "image/jpeg",
  "image/png",
] as const;

/**
 * Determines if a file is a supported type
 * @param file - The file to check
 * @returns True if the file type is supported
 */
function isSupportedFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(
    file.type as (typeof ALLOWED_FILE_TYPES)[number],
  );
}

/**
 * Determines the content type for a file
 * @param file - The file to analyze
 * @returns The content type ("image" or "text")
 */
function getFileContentType(file: File): FileContentType {
  if (file.type.startsWith("image/")) {
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
          "Unsupported file type. Supported: PDF, TXT, MD, CSV, JPG, PNG",
        );
      }

      const contentType = getFileContentType(file);
      const fileId = crypto.randomUUID();

      // Add file in processing state immediately
      const processingFile: StagedFile = {
        id: fileId,
        name: file.name,
        file,
        size: file.size,
        type: file.type,
        contentType,
        isProcessing: true,
      };

      setFiles((prev) => [...prev, processingFile]);

      try {
        // TODO: Upload file to storage
        // For now, just mark as not processing
        processingFile.isProcessing = false;

        // Update file to remove processing state
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, ...processingFile } : f)),
        );
      } catch (error) {
        // Remove file if processing failed
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        throw error;
      }
    },
    [files],
  );

  const addFiles = useCallback(
    async (filesToAdd: File[]) => {
      // Filter and validate files
      const supportedFiles = filesToAdd.filter((file) => isSupportedFile(file));

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
        (sum, f) => sum + f.size,
        currentTotalSize,
      );

      if (newTotalSize > MAX_TOTAL_SIZE) {
        throw new Error("Total file size would exceed 100MB limit");
      }

      // Add all files in processing state
      const processingFiles: StagedFile[] = supportedFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        file,
        size: file.size,
        type: file.type,
        contentType: getFileContentType(file),
        isProcessing: true,
      }));

      setFiles((prev) => [...prev, ...processingFiles]);

      // TODO: Upload files to storage
      // For now, just mark as not processing
      const processedFiles = processingFiles.map((f) => ({
        ...f,
        isProcessing: false,
      }));

      // Update files with processed versions
      setFiles((prev) => {
        const updatedFiles = prev.map((existingFile) => {
          const processed = processedFiles.find(
            (pf) => pf.id === existingFile.id,
          );
          return processed ?? existingFile;
        });
        return updatedFiles;
      });
    },
    [files],
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
