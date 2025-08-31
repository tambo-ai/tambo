"use client";
import React, { useCallback, useRef } from "react";
import { FileUploadProps, UploadFile } from "./FileUpload.types";
import { useFileUpload } from "./hooks/useFileUpload";

/**
 * FileUpload component with drag-drop, validation, and progress tracking
 * @param props - Component props
 * @returns JSX element for file upload interface
 */
export const FileUpload: React.FC<FileUploadProps> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files,
    isDragOver,
    setIsDragOver,
    addFiles,
    uploadFile,
    cancelUpload,
    retryUpload,
    removeFile,
  } = useFileUpload(props);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (selectedFiles) {
        const fileArray = Array.from(selectedFiles);
        addFiles(fileArray);

        // Auto-upload valid files
        setTimeout(() => {
          const currentFiles = files ?? [];
          fileArray.forEach((_, index) => {
            const file =
              currentFiles[currentFiles.length - fileArray.length + index];
            if (file?.status === "pending") {
              uploadFile(file.id);
            }
          });
        }, 100);
      }
    },
    [addFiles, uploadFile, files],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) setIsDragOver(true);
    },
    [isDragOver, setIsDragOver],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    },
    [setIsDragOver],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      handleFileSelect(droppedFiles);
    },
    [setIsDragOver, handleFileSelect],
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const safeFiles = files ?? [];

  return (
    <div className="tambo-file-upload">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={props.accept}
        multiple={props.multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: "none" }}
        disabled={props.disabled}
      />

      {/* Drop zone */}
      <div
        className={`drop-zone min-h-[150px] flex flex-col justify-center items-center ${isDragOver ? "drag-over" : ""} ${props.disabled ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!props.disabled ? openFileDialog : undefined}
        role="button"
        tabIndex={props.disabled ? -1 : 0}
        aria-label="Click to select files or drag and drop files here"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !props.disabled) {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        {props.children ?? (
          <div className="default-content">
            <p>Click to select files or drag and drop</p>
            {props.accept && (
              <p className="accepted-types">Accepted: {props.accept}</p>
            )}
            {props.maxSizeMB && (
              <p className="size-limit">Max size: {props.maxSizeMB}MB</p>
            )}
          </div>
        )}
      </div>

      {/* File list */}
      {safeFiles.length > 0 && (
        <div className="file-list" role="list" aria-label="Uploaded files">
          {safeFiles.map((file: UploadFile) => (
            <div
              key={file.id}
              className={`file-item status-${file.status}`}
              role="listitem"
            >
              <div className="file-info">
                <span className="file-name">{file.file.name}</span>
                <span className="file-size">
                  ({(file.file.size / (1024 * 1024)).toFixed(2)}MB)
                </span>
              </div>

              <div className="file-actions">
                {file.status === "uploading" && (
                  <>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      aria-valuenow={file.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="progress-fill"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <button
                      onClick={() => cancelUpload(file.id)}
                      aria-label={`Cancel upload of ${file.file.name}`}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {file.status === "error" && (
                  <>
                    <span className="error-message" role="alert">
                      {file.error}
                    </span>
                    <button
                      onClick={() => retryUpload(file.id)}
                      aria-label={`Retry upload of ${file.file.name}`}
                    >
                      Retry
                    </button>
                  </>
                )}

                {file.status === "success" && (
                  <span
                    className="success-message"
                    aria-label={`${file.file.name} uploaded successfully`}
                  >
                    ✓ Uploaded
                  </span>
                )}

                <button
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.file.name}`}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
