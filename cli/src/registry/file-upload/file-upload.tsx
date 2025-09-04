import * as React from "react";
import { z } from "zod";

/**
 * JSDoc for Schemas and Types
 */
export const fileStatusSchema = z.enum([
  "pending",
  "uploading",
  "success",
  "error",
  "cancelled",
]);

export const uploadFileSchema = z.object({
  id: z.string(),
  file: z.any(),
  status: fileStatusSchema,
  progress: z.number().min(0).max(100),
  error: z.string().optional(),
  url: z.string().optional(),
});

export const fileUploadPropsSchema = z.object({
  accept: z
    .string()
    .optional()
    .describe("Accepted file types (e.g., '.jpg,.png')"),
  multiple: z
    .boolean()
    .optional()
    .default(false)
    .describe("Allow multiple file selection"),
  maxSizeMB: z
    .number()
    .positive()
    .optional()
    .describe("Maximum file size in megabytes"),
  uploader: z
    .function()
    .args(
      z.array(z.any()),
      z.function().args(z.string(), z.number()).returns(z.void()),
    )
    .returns(z.promise(z.array(z.string())))
    .describe("Upload function that returns file URLs"),
  disabled: z.boolean().optional().default(false),
  className: z.string().optional(),
  children: z.any().optional().describe("Custom content for the drop zone"),
});

export type FileUploadProps = z.infer<typeof fileUploadPropsSchema>;
export type UploadFile = z.infer<typeof uploadFileSchema>;
export type FileStatus = z.infer<typeof fileStatusSchema>;

/**
 * Hook for validating files based on type and size.
 */
const useFileValidation = (accept?: string, maxSizeMB?: number) => {
  const validateFile = React.useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        return { isValid: false, error: `File size exceeds ${maxSizeMB}MB` };
      }
      if (accept) {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const mimeType = file.type;
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith("/*"))
            return mimeType.startsWith(type.slice(0, -1));
          if (type.startsWith(".")) return fileExtension === type.toLowerCase();
          return mimeType === type;
        });
        if (!isAccepted) {
          return { isValid: false, error: `File type not accepted` };
        }
      }
      return { isValid: true };
    },
    [accept, maxSizeMB],
  );
  return { validateFile };
};

/**
 * Hook for managing the complete file upload state and operations.
 */
const useFileUpload = (props: FileUploadProps) => {
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const { validateFile } = useFileValidation(props.accept, props.maxSizeMB);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const { multiple, uploader, disabled } = props;

  const addFiles = React.useCallback(
    (newFiles: File[]) => {
      if (disabled) return;
      const validatedFiles: UploadFile[] = newFiles.map((file) => {
        const validation = validateFile(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          status: validation.isValid ? "pending" : "error",
          progress: 0,
          error: validation.error,
        };
      });
      setFiles((current) =>
        multiple ? [...current, ...validatedFiles] : validatedFiles,
      );
    },
    [validateFile, multiple, disabled],
  );

  const updateFileById = React.useCallback(
    (id: string, updates: Partial<UploadFile>) => {
      setFiles((current) =>
        current.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      );
    },
    [],
  );

  const uploadFile = React.useCallback(
    async (fileId: string) => {
      const fileToUpload = files.find((f) => f.id === fileId);
      if (!fileToUpload || fileToUpload.status !== "pending" || !uploader)
        return;

      updateFileById(fileId, { status: "uploading" });
      try {
        const result = await uploader([fileToUpload.file], (id, progress) => {
          if (id === fileToUpload.id) updateFileById(id, { progress });
        });
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
    [files, uploader, updateFileById],
  );

  const removeFile = React.useCallback((fileId: string) => {
    setFiles((current) => current.filter((f) => f.id !== fileId));
  }, []);

  const retryUpload = React.useCallback(
    (fileId: string) => {
      updateFileById(fileId, {
        status: "pending",
        error: undefined,
        progress: 0,
      });
      void uploadFile(fileId);
    },
    [updateFileById, uploadFile],
  );

  const cancelUpload = React.useCallback(
    (fileId: string) => {
      updateFileById(fileId, { status: "cancelled" });
    },
    [updateFileById],
  );

  return {
    files,
    isDragOver,
    setIsDragOver,
    addFiles,
    removeFile,
    retryUpload,
    cancelUpload,
    uploadFile,
  };
};

/**
 * A component for handling file uploads with drag-and-drop, validation, and progress tracking.
 * @component
 * @example
 * ```tsx
 * <FileUpload
 * multiple
 * maxSizeMB={10}
 * uploader={myUploadFunction}
 * />
 * ```
 */
export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ className, children, ...props }, ref) => {
    const {
      files,
      isDragOver,
      setIsDragOver,
      addFiles,
      removeFile,
      retryUpload,
      cancelUpload,
      uploadFile,
    } = useFileUpload(props);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!props.disabled) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (!props.disabled) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
      }
    };

    return (
      <div ref={ref} className={className}>
        <div
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDragOver ? "border-primary" : "border-muted"} ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !props.disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple={props.multiple}
            accept={props.accept}
            disabled={props.disabled}
          />
          {children ?? <p>Drag 'n' drop files here, or click to select</p>}
        </div>
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{file.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {file.status} - {file.progress}%
                </p>
                {file.error && (
                  <p className="text-sm text-destructive">{file.error}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {file.status === "pending" && (
                  <button onClick={async () => await uploadFile(file.id)}>
                    Upload
                  </button>
                )}
                {file.status === "error" && (
                  <button onClick={() => retryUpload(file.id)}>Retry</button>
                )}
                {file.status === "uploading" && (
                  <button onClick={() => cancelUpload(file.id)}>Cancel</button>
                )}
                <button onClick={() => removeFile(file.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);
FileUpload.displayName = "FileUpload";
