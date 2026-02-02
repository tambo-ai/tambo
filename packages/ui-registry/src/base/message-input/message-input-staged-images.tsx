"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import {
  useMessageInputContext,
  type StagedImage,
} from "./message-input-context";

/**
 * Symbol for marking pasted images.
 * Uses a unique well-known symbol to detect if an image was pasted vs uploaded.
 */
const IS_PASTED_IMAGE: unique symbol = Symbol.for(
  "tambo-is-pasted-image",
) as typeof IS_PASTED_IMAGE;

/**
 * Extend the File interface to include IS_PASTED_IMAGE symbol.
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

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
export interface MessageInputStagedImagesRenderProps {
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
export interface MessageInputStagedImagesProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Content to display, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputStagedImagesRenderProps) => React.ReactNode);
}

/**
 * Component that displays currently staged images.
 * Provides render props for custom image rendering.
 */
export const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ asChild, children, ...props }, ref) => {
  const { images: rawImages, removeImage } = useMessageInputContext();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  // Pre-compute image props array - more performant than getImageProps(index) calls
  const images = React.useMemo<StagedImageRenderProps[]>(
    () =>
      rawImages.map((image, index) => ({
        image,
        displayName: image.file?.[IS_PASTED_IMAGE]
          ? `Image ${index + 1}`
          : image.name,
        index,
        isExpanded: expandedImageId === image.id,
        onToggle: () =>
          setExpandedImageId(expandedImageId === image.id ? null : image.id),
        onRemove: () => removeImage(image.id),
      })),
    [rawImages, expandedImageId, removeImage],
  );

  const renderProps: MessageInputStagedImagesRenderProps = {
    images,
    removeImage,
    expandedImageId,
    setExpandedImageId,
  };

  // Don't render if no images and children is not a function
  if (rawImages.length === 0 && typeof children !== "function") {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="message-input-staged-images"
      data-count={rawImages.length}
      data-empty={rawImages.length === 0 || undefined}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </Comp>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";
