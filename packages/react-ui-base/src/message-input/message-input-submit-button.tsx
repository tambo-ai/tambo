"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the SubmitButton component.
 */
export interface MessageInputSubmitButtonRenderProps extends Record<
  string,
  unknown
> {
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
export type MessageInputSubmitButtonProps = useRender.ComponentProps<
  "button",
  MessageInputSubmitButtonRenderProps
>;

/**
 * Submit button component for sending messages.
 * Automatically handles submission and cancellation states.
 */
export const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ children, ...props }, ref) => {
  const { isPending, isIdle, cancel, isUpdatingToken } =
    useMessageInputContext();

  // Show cancel button if either:
  // 1. A mutation is in progress (isPending), OR
  // 2. Thread is stuck in a processing state
  const showCancelButton = isPending || !isIdle;

  const handleCancel = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      await cancel();
    },
    [cancel],
  );

  const disabled = isUpdatingToken;

  const renderProps = React.useMemo<MessageInputSubmitButtonRenderProps>(
    () => ({
      showCancelButton,
      disabled,
      handleCancel,
    }),
    [showCancelButton, disabled, handleCancel],
  );

  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      type: showCancelButton ? "button" : "submit",
      disabled,
      onClick: showCancelButton ? handleCancel : undefined,
      "aria-label": showCancelButton ? "Cancel message" : "Send message",
      children,
      "data-slot": showCancelButton
        ? "message-input-cancel"
        : "message-input-submit",
      "data-state": showCancelButton ? "cancel" : "submit",
      "data-disabled": disabled || undefined,
    }),
  });
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";
