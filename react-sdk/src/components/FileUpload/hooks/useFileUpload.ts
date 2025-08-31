import { useCallback, useState } from "react";
import { useTamboComponentState } from "../../../hooks/use-component-state";
import { UploadFile, FileUploadProps } from "../FileUpload.types";
import { useFileValidation } from "./useFileValidation";

/**
 * Hook for managing file upload state and operations
 * @param props - FileUpload component props
 * @returns Object containing upload state and handlers
 */
export const useFileUpload = (props: FileUploadProps) => {
  const [files, setFiles] = useTamboComponentState<UploadFile[]>(
    "uploadFiles",
    [],
  );
  const { validateFile } = useFileValidation(props.accept, props.maxSizeMB);
  const [isDragOver, setIsDragOver] = useState(false);

  // Destructure props to avoid dependency issues
  const { multiple, uploader } = props;

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validatedFiles: UploadFile[] = [];

      newFiles.forEach((file) => {
        const validation = validateFile(file);
        const uploadFile: UploadFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: validation.isValid ? "pending" : "error",
          progress: 0,
          error: validation.error,
        };
        validatedFiles.push(uploadFile);
      });

      const currentFiles = files ?? [];
      const newFileList = multiple
        ? [...currentFiles, ...validatedFiles]
        : validatedFiles;
      setFiles(newFileList);
    },
    [validateFile, setFiles, multiple, files],
  );

  const updateFileById = useCallback(
    (fileId: string, updates: Partial<UploadFile>) => {
      const currentFiles = files ?? [];
      const updatedFiles = currentFiles.map((f: UploadFile) =>
        f.id === fileId ? { ...f, ...updates } : f,
      );
      setFiles(updatedFiles);
    },
    [files, setFiles],
  );

  const uploadFile = useCallback(
    async (fileId: string) => {
      const currentFiles = files ?? [];
      const fileToUpload = currentFiles.find(
        (f: UploadFile) => f.id === fileId,
      );
      if (!fileToUpload || fileToUpload.status !== "pending") return;

      // Update status to uploading
      updateFileById(fileId, { status: "uploading" });

      try {
        const onProgress = (progress: number) => {
          updateFileById(fileId, { progress });
        };

        const result = await uploader(
          [fileToUpload.file],
          (id: string, progress: number) => {
            if (id === fileId) onProgress(progress);
          },
        );

        // Update to success
        updateFileById(fileId, {
          status: "success",
          progress: 100,
          url: result[0],
        });
      } catch (error) {
        updateFileById(fileId, {
          status: "error",
          error: (error as Error).message,
        });
      }
    },
    [files, updateFileById, uploader],
  );

  const cancelUpload = useCallback(
    (fileId: string) => {
      updateFileById(fileId, { status: "cancelled" });
    },
    [updateFileById],
  );

  const retryUpload = useCallback(
    (fileId: string) => {
      updateFileById(fileId, {
        status: "pending",
        error: undefined,
        progress: 0,
      });
      uploadFile(fileId);
    },
    [updateFileById, uploadFile],
  );

  const removeFile = useCallback(
    (fileId: string) => {
      const currentFiles = files ?? [];
      const filteredFiles = currentFiles.filter(
        (f: UploadFile) => f.id !== fileId,
      );
      setFiles(filteredFiles);
    },
    [files, setFiles],
  );

  return {
    files: files ?? [],
    isDragOver,
    setIsDragOver,
    addFiles,
    uploadFile,
    cancelUpload,
    retryUpload,
    removeFile,
  };
};
