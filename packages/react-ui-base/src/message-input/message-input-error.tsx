"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Error component.
 */
export interface MessageInputErrorRenderProps {
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
export interface MessageInputErrorProps extends Omit<
  React.HTMLAttributes<HTMLParagraphElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Content to display, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputErrorRenderProps) => React.ReactNode);
}

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 */
export const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ asChild, children, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  const errorMessage = error?.message ?? submitError ?? imageError ?? null;

  // Don't render if no errors
  if (!errorMessage && typeof children !== "function") {
    return null;
  }

  const renderProps: MessageInputErrorRenderProps = {
    errorMessage,
    error,
    submitError,
    imageError,
  };

  const Comp = asChild ? Slot : "p";

  return (
    <Comp
      ref={ref}
      data-slot="message-input-error"
      data-state={errorMessage ? "error" : undefined}
      {...props}
    >
      {typeof children === "function"
        ? children(renderProps)
        : (children ?? errorMessage)}
    </Comp>
  );
});
MessageInputError.displayName = "MessageInput.Error";
