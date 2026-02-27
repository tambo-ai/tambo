"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useThreadDropdownContext } from "../root/thread-dropdown-context";

export interface ThreadDropdownNewThreadState extends Record<string, unknown> {
  slot: string;
}

export type ThreadDropdownNewThreadProps = useRender.ComponentProps<
  "button",
  ThreadDropdownNewThreadState
>;

/**
 * Action button that creates a new thread and refetches the thread list.
 */
export const ThreadDropdownNewThread = React.forwardRef<
  HTMLButtonElement,
  ThreadDropdownNewThreadProps
>((props, ref) => {
  const { startNewThread, refetch, onThreadChange } =
    useThreadDropdownContext();

  const handleClick = async () => {
    startNewThread();
    await refetch();
    onThreadChange?.();
  };

  const { render, ...componentProps } = props;
  const state: ThreadDropdownNewThreadState = {
    slot: "thread-dropdown-new-thread",
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
ThreadDropdownNewThread.displayName = "ThreadDropdown.NewThread";
