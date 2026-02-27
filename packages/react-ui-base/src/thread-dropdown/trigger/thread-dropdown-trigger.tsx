"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useThreadDropdownContext } from "../root/thread-dropdown-context";

export interface ThreadDropdownTriggerState extends Record<string, unknown> {
  slot: string;
  threadCount: number;
}

export type ThreadDropdownTriggerProps = useRender.ComponentProps<
  "button",
  ThreadDropdownTriggerState
>;

/**
 * Trigger button for the thread dropdown.
 */
export const ThreadDropdownTrigger = React.forwardRef<
  HTMLButtonElement,
  ThreadDropdownTriggerProps
>((props, ref) => {
  const { threads } = useThreadDropdownContext();

  const { render, ...componentProps } = props;
  const state: ThreadDropdownTriggerState = {
    slot: "thread-dropdown-trigger",
    threadCount: threads.length,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "button",
    }),
  });
});
ThreadDropdownTrigger.displayName = "ThreadDropdown.Trigger";
