"use client";

import { mergeProps, useRender } from "@base-ui/react";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

export interface MessageInputStopButtonState {
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
>(({ keepMounted = false, ...props }, ref) => {
  const { isPending, isIdle, cancel, isUpdatingToken } =
    useMessageInputContext();
  const hidden = isUpdatingToken || (!isPending && isIdle);
  const disabled = isUpdatingToken;

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
      disabled,
      state: hidden ? "hidden" : "visible",
    },
    props: mergeProps(componentProps, {
      disabled,
      onClick,
    }),
  });
});
MessageInputStopButton.displayName = "MessageInput.StopButton";
