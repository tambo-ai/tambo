"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the SubmitButton component.
 */
export interface MessageInputSubmitButtonRenderProps {
  /** Whether to show cancel button instead of submit */
  showCancelButton: boolean;
  /** Whether the button is disabled */
  disabled: boolean;
  /** Handle cancel action */
  handleCancel: (e: React.MouseEvent) => Promise<void>;
}

/**
 * Props for the MessageInput.SubmitButton component.
 */
export interface MessageInputSubmitButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Content to display inside the button, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputSubmitButtonRenderProps) => React.ReactNode);
}

/**
 * Submit button component for sending messages.
 * Automatically handles submission and cancellation states.
 */
export const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ asChild, children, ...props }, ref) => {
  const { isPending, isIdle, cancel, isUpdatingToken } =
    useMessageInputContext();

  // Show cancel button if either:
  // 1. A mutation is in progress (isPending), OR
  // 2. Thread is stuck in a processing state
  const showCancelButton = isPending || !isIdle;

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancel();
  };

  const disabled = isUpdatingToken;

  const renderProps: MessageInputSubmitButtonRenderProps = {
    showCancelButton,
    disabled,
    handleCancel,
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type={showCancelButton ? "button" : "submit"}
      disabled={disabled}
      onClick={showCancelButton ? handleCancel : undefined}
      aria-label={showCancelButton ? "Cancel message" : "Send message"}
      data-slot={
        showCancelButton ? "message-input-cancel" : "message-input-submit"
      }
      data-state={showCancelButton ? "cancel" : "submit"}
      data-disabled={disabled || undefined}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </Comp>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";
