"use client";

import { mergeProps, useRender } from "@base-ui/react";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

export interface MessageInputStopButtonState extends Record<string, unknown> {
  slot: string;
  disabled: boolean;
}

export interface MessageInputStopButtonProps extends useRender.ComponentProps<
  "button",
  MessageInputStopButtonState
> {
  keepMounted?: boolean;
}

export const MessageInputStopButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputStopButtonProps
>(({ keepMounted = false, tabIndex: propTabIndex, ...props }, ref) => {
  const { isPending, isIdle, cancel, isUpdatingToken } =
    useMessageInputContext();
  const hidden = isUpdatingToken || (!isPending && isIdle);
  const disabled = isUpdatingToken;
  const effectiveTabIndex = hidden ? -1 : propTabIndex;

  const onClick = React.useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      await cancel();
    },
    [cancel],
  );

  const { render, ...componentProps } = props;
  const enabled = !hidden || keepMounted;

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    enabled,
    state: {
      slot: "message-input-stop",
      disabled,
      state: hidden ? "hidden" : "visible",
    },
    props: mergeProps(componentProps, {
      type: "button",
      disabled,
      tabIndex: effectiveTabIndex,
      onClick,
      tabIndex: effectiveTabIndex,
      "aria-hidden": hidden ? "true" : undefined,
    }),
  });
});
MessageInputStopButton.displayName = "MessageInput.StopButton";
