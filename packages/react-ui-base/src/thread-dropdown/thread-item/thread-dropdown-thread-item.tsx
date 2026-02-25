"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import {
  useThreadDropdownContext,
  type ThreadDropdownListItem,
} from "../root/thread-dropdown-context";

export interface ThreadDropdownThreadItemState extends Record<string, unknown> {
  slot: string;
  thread: ThreadDropdownListItem;
}

type ThreadDropdownThreadItemComponentProps = useRender.ComponentProps<
  "button",
  ThreadDropdownThreadItemState
>;

export interface ThreadDropdownThreadItemProps extends ThreadDropdownThreadItemComponentProps {
  /** The thread to display and select. */
  thread: ThreadDropdownListItem;
}

/**
 * An individual thread item that triggers thread switching on click.
 */
export const ThreadDropdownThreadItem = React.forwardRef<
  HTMLButtonElement,
  ThreadDropdownThreadItemProps
>(({ thread, ...props }, ref) => {
  const { switchThread, onThreadChange } = useThreadDropdownContext();

  const handleClick = () => {
    switchThread(thread.id);
    onThreadChange?.();
  };

  const { render, ...componentProps } = props;
  const state: ThreadDropdownThreadItemState = {
    slot: "thread-dropdown-thread-item",
    thread,
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
ThreadDropdownThreadItem.displayName = "ThreadDropdown.ThreadItem";
