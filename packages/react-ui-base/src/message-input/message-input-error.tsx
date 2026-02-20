"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Error component.
 */
export interface MessageInputErrorRenderProps extends Record<string, unknown> {
  /** Error message to display */
  errorMessage: string | null;
  /** The original error object if available */
  error: Error | null;
  /** Submit-specific error */
  submitError: string | null;
  /** Image-specific error */
  imageError: string | null;
}

/**
 * Props for the MessageInput.Error component.
 */
export type MessageInputErrorProps = useRender.ComponentProps<
  "p",
  MessageInputErrorRenderProps
>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 */
export const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ children, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  const errorMessage = error?.message ?? submitError ?? imageError ?? null;

  // Don't render if no errors
  const { render, ...componentProps } = props;

  if (!errorMessage && !render && children == null) {
    return null;
  }

  const renderProps: MessageInputErrorRenderProps = {
    errorMessage,
    error,
    submitError,
    imageError,
  };

  return useRender({
    defaultTagName: "p",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      children: children ?? errorMessage,
      "data-slot": "message-input-error",
      "data-state": errorMessage ? "error" : undefined,
    }),
  });
});
MessageInputError.displayName = "MessageInput.Error";
