"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { IS_PASTED_IMAGE } from "./constants";
import {
  useMessageInputContext,
  type StagedImage,
} from "./message-input-context";

/**
 * Render props for a single staged image.
 */
export interface StagedImageRenderProps {
  /** The staged image data */
  image: StagedImage;
  /** Display name for the image */
  displayName: string;
  /** Index of the image */
  index: number;
  /** Whether this image is expanded */
  isExpanded: boolean;
  /** Toggle the expanded state */
  onToggle: () => void;
  /** Remove this image */
  onRemove: () => void;
}

/**
 * Render props for the StagedImages component.
 */
export interface MessageInputStagedImagesRenderProps extends Record<
  string,
  unknown
> {
  /** Array of staged images with pre-computed props for rendering */
  images: StagedImageRenderProps[];
  /** Remove an image by ID */
  removeImage: (id: string) => void;
  /** Currently expanded image ID */
  expandedImageId: string | null;
  /** Set expanded image ID */
  setExpandedImageId: (id: string | null) => void;
}

/**
 * Props for the MessageInput.StagedImages component.
 */
export type MessageInputStagedImagesProps = useRender.ComponentProps<
  "div",
  MessageInputStagedImagesRenderProps
>;

/**
 * Component that displays currently staged images.
 * Provides render props for custom image rendering.
 */
export const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ children, ...props }, ref) => {
  const { images: rawImages, removeImage } = useMessageInputContext();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  // Stable toggle callback using functional update to avoid dep on expandedImageId
  const toggleImage = React.useCallback((id: string) => {
    setExpandedImageId((current) => (current === id ? null : id));
  }, []);

  // Stable remove callback
  const handleRemove = React.useCallback(
    (id: string) => {
      removeImage(id);
    },
    [removeImage],
  );

  // Pre-compute image props array - only depends on rawImages and expandedImageId for isExpanded
  const images = React.useMemo<StagedImageRenderProps[]>(
    () =>
      rawImages.map((image, index) => ({
        image,
        displayName: image.file?.[IS_PASTED_IMAGE]
          ? `Image ${index + 1}`
          : image.name,
        index,
        isExpanded: expandedImageId === image.id,
        onToggle: () => toggleImage(image.id),
        onRemove: () => handleRemove(image.id),
      })),
    [rawImages, expandedImageId, toggleImage, handleRemove],
  );

  const renderProps = React.useMemo<MessageInputStagedImagesRenderProps>(
    () => ({
      images,
      removeImage,
      expandedImageId,
      setExpandedImageId,
    }),
    [images, removeImage, expandedImageId],
  );

  const { render, ...componentProps } = props;

  // Don't render if no images and no render callback is provided.
  if (rawImages.length === 0 && !render) {
    return null;
  }

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      children,
      "data-slot": "message-input-staged-images",
      "data-count": rawImages.length,
      "data-empty": rawImages.length === 0 || undefined,
    }),
  });
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";
