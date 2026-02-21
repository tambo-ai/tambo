"use client";

import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

export interface MessageInputStopButtonRenderProps {
  hidden: boolean;
  disabled: boolean;
  handleStop: (event: React.MouseEvent) => Promise<void>;
}

export interface MessageInputStopButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  keepMounted?: boolean;
  children?:
    | React.ReactNode
    | ((props: MessageInputStopButtonRenderProps) => React.ReactNode);
}

export const MessageInputStopButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputStopButtonProps
>(({ children, keepMounted = false, ...props }, ref) => {
  const { isPending, isIdle, cancel, isUpdatingToken } =
    useMessageInputContext();
  const hidden = isUpdatingToken || (!isPending && isIdle);
  const disabled = isUpdatingToken;

  const handleStop = React.useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      await cancel();
    },
    [cancel],
  );

  if (hidden && !keepMounted) {
    return null;
  }

  const renderProps = React.useMemo<MessageInputStopButtonRenderProps>(
    () => ({
      hidden,
      disabled,
      handleStop,
    }),
    [hidden, disabled, handleStop],
  );

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleStop}
      disabled={disabled}
      aria-label="Stop response"
      data-slot="message-input-stop"
      data-state="stop"
      data-disabled={disabled || undefined}
      data-hidden={hidden || undefined}
      hidden={hidden && keepMounted}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </button>
  );
});
MessageInputStopButton.displayName = "MessageInput.StopButton";
