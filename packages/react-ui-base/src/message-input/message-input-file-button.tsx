"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { MAX_IMAGES } from "./constants";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the FileButton component.
 */
export interface MessageInputFileButtonState extends Record<string, unknown> {
  slot: string;
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
  MessageInputFileButtonState
>;

export interface MessageInputFileButtonProps extends MessageInputFileButtonComponentProps {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** When true, removes the visually-hidden styles from the file input. Defaults to false. */
  inputVisible?: boolean;
}

/**
 * File attachment button component for selecting images from file system.
 */
export const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(
  (
    {
      accept = "image/*",
      multiple = true,
      inputVisible = false,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { addImages, images, setImageError } = useMessageInputContext();
    const [fileInputElement, setFileInputElement] =
      React.useState<HTMLInputElement | null>(null);
    const fileInputRef = React.useMemo<
      React.RefObject<HTMLInputElement | null>
    >(() => ({ current: fileInputElement }), [fileInputElement]);

    const openFilePicker = React.useCallback(() => {
      fileInputElement?.click();
    }, [fileInputElement]);

    const handleFileInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        setFileInputElement(node);
      },
      [],
    );

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

    const renderProps: MessageInputFileButtonState = {
      slot: "message-input-file-button",
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
          stateAttributesMapping: {
            openFilePicker: () => null,
            fileInputRef: () => null,
          },
          props: mergeProps(componentProps, {
            type: "button",
            onClick: handleClick,
            "aria-label": "Attach Images",
          }),
        })}
        <input
          ref={handleFileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          style={
            inputVisible
              ? undefined
              : {
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0, 0, 0, 0)",
                  whiteSpace: "nowrap",
                  borderWidth: 0,
                }
          }
          aria-hidden="true"
        />
      </>
    );
  },
);
MessageInputFileButton.displayName = "MessageInput.FileButton";
