"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import {
  useThreadHistoryContext,
  type ThreadListItem,
} from "../root/thread-history-context";

export interface ThreadHistoryListState extends Record<string, unknown> {
  slot: string;
  isEmpty: boolean;
  isLoading: boolean;
  hasError: boolean;
  filteredThreads: ThreadListItem[];
  searchQuery: string;
  error: Error | null;
}

export type ThreadHistoryListProps = useRender.ComponentProps<
  "div",
  ThreadHistoryListState
>;

/**
 * Container for the filtered thread list.
 * Exposes loading/empty/error/threads state via render props.
 */
export const ThreadHistoryList = React.forwardRef<
  HTMLDivElement,
  ThreadHistoryListProps
>((props, ref) => {
  const { filteredThreads, isLoading, error, searchQuery } =
    useThreadHistoryContext();

  const { render, ...componentProps } = props;
  const state: ThreadHistoryListState = {
    slot: "thread-history-list",
    isEmpty: filteredThreads.length === 0,
    isLoading,
    hasError: !!error,
    filteredThreads,
    searchQuery,
    error,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
  });
});
ThreadHistoryList.displayName = "ThreadHistory.List";
