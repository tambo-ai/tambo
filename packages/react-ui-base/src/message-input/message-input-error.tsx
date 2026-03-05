"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Error component.
 */
export interface MessageInputErrorState extends Record<string, unknown> {
  slot: string;
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
export interface MessageInputErrorProps extends useRender.ComponentProps<
  "p",
  MessageInputErrorState
> {
  /** Keep the element mounted in the DOM when hidden. Defaults to false. */
  keepMounted?: boolean;
}

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 */
export const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ children, keepMounted = false, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  const errorMessage = error?.message ?? submitError ?? imageError ?? null;
  const hasError = !!errorMessage;
  const isVisible = hasError || children != null;

  const { render, ...componentProps } = props;
  const enabled = isVisible || keepMounted;

  const renderProps: MessageInputErrorState = {
    slot: "message-input-error",
    errorMessage,
    error,
    submitError,
    imageError,
  };

  return useRender({
    defaultTagName: "p",
    ref,
    render,
    enabled,
    state: renderProps,
    props: mergeProps(componentProps, {
      children: children ?? errorMessage,
      "data-state": isVisible ? "visible" : "hidden",
      "aria-hidden": !isVisible,
    }),
  });
});
MessageInputError.displayName = "MessageInput.Error";
