"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import {
  useThreadHistoryContext,
  type ThreadListItem,
} from "../root/thread-history-context";

export interface ThreadHistoryItemState extends Record<string, unknown> {
  slot: string;
  isActive: boolean;
  thread: ThreadListItem;
}

type ThreadHistoryItemComponentProps = useRender.ComponentProps<
  "button",
  ThreadHistoryItemState
>;

export interface ThreadHistoryItemProps extends ThreadHistoryItemComponentProps {
  /** The thread to display and select. */
  thread: ThreadListItem;
}

/**
 * An individual thread item that triggers thread switching on click.
 */
export const ThreadHistoryItem = React.forwardRef<
  HTMLButtonElement,
  ThreadHistoryItemProps
>(({ thread, ...props }, ref) => {
  const { currentThreadId, switchThread, onThreadChange } =
    useThreadHistoryContext();

  const isActive = currentThreadId === thread.id;

  const handleClick = () => {
    switchThread(thread.id);
    onThreadChange?.();
  };

  const { render, children, ...componentProps } = props;
  const state: ThreadHistoryItemState = {
    slot: "thread-history-item",
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
      "aria-current": isActive ? "true" : undefined,
      "data-active": isActive ? "true" : undefined,
      onClick: handleClick,
      children: children ?? (thread.name || thread.id),
    }),
  });
});
ThreadHistoryItem.displayName = "ThreadHistory.Item";
