import { useCallback } from "react";

/**
 * Hook for validating file uploads based on file type and size constraints
 * @param accept - Accepted file types (e.g., '.jpg,.png,.pdf' or 'image/*')
 * @param maxSizeMB - Maximum file size in megabytes
 * @returns Object containing validateFile function
 */
export const useFileValidation = (accept?: string, maxSizeMB?: number) => {
  const validateFile = useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      // Check file size
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        return {
          isValid: false,
          error: `File size exceeds ${maxSizeMB}MB limit`,
        };
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const mimeType = file.type;

        const isAccepted = acceptedTypes.some((type) => {
          // Handle "accept any file" cases
          if (type === "*" || type === "*/*") {
            return true;
          }
          // Handle wildcard MIME types like 'image/*', 'video/*'
          else if (type.endsWith("/*")) {
            const prefix = type.slice(0, -1); // Remove the '*', keep 'image/', 'video/', etc.
            return mimeType.startsWith(prefix);
          }
          // Handle file extensions like '.jpg', '.png'
          else if (type.startsWith(".")) {
            return fileExtension === type.toLowerCase();
          }
          // Handle exact MIME types like 'text/plain'
          else {
            return mimeType === type;
          }
        });

        if (!isAccepted) {
          return {
            isValid: false,
            error: `File type not accepted. Allowed: ${accept}`,
          };
        }
      }

      return { isValid: true };
    },
    [accept, maxSizeMB],
  );

  return { validateFile };
};
