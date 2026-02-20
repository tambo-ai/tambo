"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { MAX_IMAGES } from "./constants";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the FileButton component.
 */
export interface MessageInputFileButtonRenderProps extends Record<
  string,
  unknown
> {
  /** Trigger the file picker */
  openFilePicker: () => void;
  /** The hidden file input ref */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Props for the MessageInput.FileButton component.
 */
type MessageInputFileButtonComponentProps = useRender.ComponentProps<
  "button",
  MessageInputFileButtonRenderProps
>;

export interface MessageInputFileButtonProps extends MessageInputFileButtonComponentProps {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * File attachment button component for selecting images from file system.
 */
export const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ accept = "image/*", multiple = true, onClick, ...props }, ref) => {
  const { addImages, images, setImageError } = useMessageInputContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      openFilePicker();
    },
    [onClick, openFilePicker],
  );

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
  const { render, ...componentProps } = props;

  return (
    <>
      {useRender({
        defaultTagName: "button",
        ref,
        render,
        state: renderProps,
        props: mergeProps(componentProps, {
          type: "button",
          onClick: handleClick,
          "aria-label": "Attach Images",
          "data-slot": "message-input-file-button",
        }),
      })}
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
});
MessageInputFileButton.displayName = "MessageInput.FileButton";
