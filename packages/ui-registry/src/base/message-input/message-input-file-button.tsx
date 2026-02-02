"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/** Maximum number of images that can be staged at once */
const MAX_IMAGES = 10;

/**
 * Render props for the FileButton component.
 */
export interface MessageInputFileButtonRenderProps {
  /** Trigger the file picker */
  openFilePicker: () => void;
  /** The hidden file input ref */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Props for the MessageInput.FileButton component.
 */
export interface MessageInputFileButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Content to display, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputFileButtonRenderProps) => React.ReactNode);
}

/**
 * File attachment button component for selecting images from file system.
 */
export const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(
  (
    { asChild, accept = "image/*", multiple = true, children, ...props },
    ref,
  ) => {
    const { addImages, images, setImageError } = useMessageInputContext();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const openFilePicker = React.useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);

      try {
        const totalImages = images.length + files.length;

        if (totalImages > MAX_IMAGES) {
          setImageError(`Max ${MAX_IMAGES} uploads at a time`);
          e.target.value = "";
          return;
        }

        setImageError(null);
        await addImages(files);
      } catch (error) {
        console.error("Failed to add selected files:", error);
      }
      // Reset the input so the same file can be selected again
      e.target.value = "";
    };

    const renderProps: MessageInputFileButtonRenderProps = {
      openFilePicker,
      fileInputRef,
    };

    const Comp = asChild ? Slot : "button";

    return (
      <>
        <Comp
          ref={ref}
          type="button"
          onClick={openFilePicker}
          aria-label="Attach Images"
          data-slot="message-input-file-button"
          {...props}
        >
          {typeof children === "function" ? children(renderProps) : children}
        </Comp>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </>
    );
  },
);
MessageInputFileButton.displayName = "MessageInput.FileButton";
