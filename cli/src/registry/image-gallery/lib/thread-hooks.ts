import { useCallback } from "react";
import { useTamboThread } from "@tambo-ai/react";

/**
 * Hook for image gallery thread interactions
 * Provides utilities for handling image-related thread operations
 */
export const useImageGalleryThread = () => {
  const { addThreadMessage, thread } = useTamboThread();

  /**
   * Send a message about the current image being viewed
   */
  const reportImageView = useCallback(
    (imageIndex: number, imageSrc: string, imageAlt: string) => {
      addThreadMessage(
        {
          id: crypto.randomUUID(),
          threadId: thread.id,
          createdAt: new Date().toISOString(),
          componentState: {},
          role: "user",
          content: [
            {
              type: "text",
              text: `Currently viewing image ${imageIndex + 1}: ${imageAlt} (${imageSrc})`,
            },
          ],
        },
        false,
      );
    },
    [addThreadMessage],
  );

  /**
   * Send a message about image interaction (zoom, rotate, etc.)
   */
  const reportImageInteraction = useCallback(
    (action: string, details?: Record<string, unknown>) => {
      const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
      addThreadMessage(
        {
          id: crypto.randomUUID(),
          threadId: thread.id,
          createdAt: new Date().toISOString(),
          componentState: {},
          role: "user",
          content: [
            {
              type: "text",
              text: `Image gallery action: ${action}${detailsStr}`,
            },
          ],
        },
        false,
      );
    },
    [addThreadMessage],
  );

  /**
   * Request AI assistance with image analysis
   */
  const requestImageAnalysis = useCallback(
    (imageSrc: string, imageAlt: string) => {
      addThreadMessage(
        {
          id: crypto.randomUUID(),
          threadId: thread.id,
          createdAt: new Date().toISOString(),
          componentState: {},
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this image: ${imageAlt} (${imageSrc})`,
            },
          ],
        },
        false,
      );
    },
    [addThreadMessage],
  );

  return {
    reportImageView,
    reportImageInteraction,
    requestImageAnalysis,
  };
};
