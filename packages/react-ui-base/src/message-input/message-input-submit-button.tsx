"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the SubmitButton component.
 */
export interface MessageInputSubmitButtonState extends Record<string, unknown> {
  slot: string;
  /** Whether the button is disabled */
  disabled: boolean;
  /** Whether the button is in a loading state */
  loading: boolean;
}

/**
 * Props for the MessageInput.SubmitButton component.
 */
export interface MessageInputSubmitButtonProps extends useRender.ComponentProps<
  "button",
  MessageInputSubmitButtonState
> {
  keepMounted?: boolean;
}

export const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ keepMounted = false, tabIndex: propTabIndex, ...props }, ref) => {
  const { isPending, isIdle, isUpdatingToken } = useMessageInputContext();

  const disabled = isUpdatingToken;
  const hidden = isPending || (!isIdle && !isUpdatingToken);
  const loading = isUpdatingToken && !isIdle && !isPending;
  const effectiveTabIndex = hidden ? -1 : propTabIndex;
  const enabled = !hidden || keepMounted;
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    enabled,
    state: {
      slot: "message-input-submit",
      disabled,
      loading,
      state: hidden ? "hidden" : "visible",
    },
    props: mergeProps(componentProps, {
      disabled,
      tabIndex: effectiveTabIndex,
      "aria-hidden": hidden ? "true" : undefined,
    }),
  });
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";
