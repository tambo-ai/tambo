"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useThreadHistoryContext } from "../root/thread-history-context";

export interface ThreadHistoryNewThreadButtonState extends Record<
  string,
  unknown
> {
  slot: string;
}

export type ThreadHistoryNewThreadButtonProps = useRender.ComponentProps<
  "button",
  ThreadHistoryNewThreadButtonState
>;

/**
 * Button that creates a new thread and refetches the thread list.
 */
export const ThreadHistoryNewThreadButton = React.forwardRef<
  HTMLButtonElement,
  ThreadHistoryNewThreadButtonProps
>((props, ref) => {
  const { startNewThread, refetch, onThreadChange } = useThreadHistoryContext();

  const handleClick = async () => {
    startNewThread();
    await refetch();
    onThreadChange?.();
  };

  const { render, ...componentProps } = props;
  const state: ThreadHistoryNewThreadButtonState = {
    slot: "thread-history-new-thread-button",
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "button",
      onClick: handleClick,
    }),
  });
});
ThreadHistoryNewThreadButton.displayName = "ThreadHistory.NewThreadButton";
