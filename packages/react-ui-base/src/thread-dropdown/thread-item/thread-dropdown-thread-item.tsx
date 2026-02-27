"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { type ThreadListItem } from "../../thread-history/root/thread-history-context";
import { useThreadDropdownContext } from "../root/thread-dropdown-context";

export interface ThreadDropdownThreadItemState extends Record<string, unknown> {
  slot: string;
  isActive: boolean;
  thread: ThreadListItem;
}

type ThreadDropdownThreadItemComponentProps = useRender.ComponentProps<
  "button",
  ThreadDropdownThreadItemState
>;

export interface ThreadDropdownThreadItemProps extends ThreadDropdownThreadItemComponentProps {
  /** The thread to display and select. */
  thread: ThreadListItem;
}

/**
 * An individual thread item that triggers thread switching on click.
 */
export const ThreadDropdownThreadItem = React.forwardRef<
  HTMLButtonElement,
  ThreadDropdownThreadItemProps
>(({ thread, ...props }, ref) => {
  const { switchThread, currentThreadId, onThreadChange } =
    useThreadDropdownContext();

  const isActive = currentThreadId === thread.id;

  const handleClick = () => {
    switchThread(thread.id);
    onThreadChange?.();
  };

  const { render, ...componentProps } = props;
  const state: ThreadDropdownThreadItemState = {
    slot: "thread-dropdown-thread-item",
    isActive,
    thread,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    stateAttributesMapping: {
      thread: () => null,
    },
    props: mergeProps(componentProps, {
      type: "button",
      "data-active": isActive || undefined,
      onClick: handleClick,
    }),
  });
});
ThreadDropdownThreadItem.displayName = "ThreadDropdown.ThreadItem";
