"use client";

import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

export interface MessageInputSubmitButtonRenderProps {
  hidden: boolean;
  disabled: boolean;
  loading: boolean;
}

export interface MessageInputSubmitButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  keepMounted?: boolean;
  children?:
    | React.ReactNode
    | ((props: MessageInputSubmitButtonRenderProps) => React.ReactNode);
}

export const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ children, keepMounted = false, tabIndex, ...props }, ref) => {
  const { isPending, isIdle, isUpdatingToken } = useMessageInputContext();
  const hidden = isPending || (!isIdle && !isUpdatingToken);
  const disabled = isUpdatingToken;
  const loading = isUpdatingToken && !isIdle && !isPending;

  if (hidden && !keepMounted) {
    return null;
  }

  const renderProps = React.useMemo<MessageInputSubmitButtonRenderProps>(
    () => ({
      hidden,
      disabled,
      loading,
    }),
    [hidden, disabled, loading],
  );

  return (
    <button
      {...props}
      ref={ref}
      type={hidden ? "button" : "submit"}
      disabled={disabled}
      tabIndex={hidden ? -1 : tabIndex}
      aria-label="Send message"
      aria-hidden={hidden || undefined}
      data-slot="message-input-submit"
      data-state="submit"
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
      data-hidden={hidden || undefined}
      hidden={hidden && keepMounted}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";
