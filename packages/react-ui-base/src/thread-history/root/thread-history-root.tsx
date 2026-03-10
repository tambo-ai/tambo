"use client";

import { useRender } from "@base-ui/react/use-render";
import { useTambo, useTamboThreadList } from "@tambo-ai/react";
import * as React from "react";
import {
  ThreadHistoryContext,
  type ThreadListItem,
} from "./thread-history-context";

export interface ThreadHistoryRootState extends Record<string, unknown> {
  slot: string;
  threadCount: number;
  hasSearchQuery: boolean;
  isLoading: boolean;
}

type ThreadHistoryRootComponentProps = useRender.ComponentProps<
  "div",
  ThreadHistoryRootState
>;

export interface ThreadHistoryRootProps extends ThreadHistoryRootComponentProps {
  /** Callback invoked after a thread switch or new thread creation. */
  onThreadChange?: () => void;
}

/**
 * Root component for thread history.
 * Provides thread collection state, search filtering, and selection callbacks to children.
 */
export const ThreadHistoryRoot = React.forwardRef<
  HTMLDivElement,
  ThreadHistoryRootProps
>(({ onThreadChange, ...props }, ref) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const onThreadChangeRef = React.useRef(onThreadChange);
  onThreadChangeRef.current = onThreadChange;

  const { data, isLoading, error, refetch } = useTamboThreadList();
  const { switchThread, startNewThread, currentThreadId } = useTambo();

  const threads = React.useMemo(() => data?.threads ?? [], [data?.threads]);

  const filteredThreads = React.useMemo(() => {
    if (!searchQuery) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter(
      (thread: ThreadListItem) =>
        thread.id.toLowerCase().includes(query) ||
        thread.name?.toLowerCase().includes(query),
    );
  }, [threads, searchQuery]);

  const stableOnThreadChange = React.useCallback(() => {
    onThreadChangeRef.current?.();
  }, []);

  const contextValue = React.useMemo(
    () => ({
      filteredThreads,
      isLoading,
      error,
      refetch,
      currentThreadId,
      switchThread,
      startNewThread,
      searchQuery,
      setSearchQuery,
      onThreadChange: stableOnThreadChange,
    }),
    [
      filteredThreads,
      isLoading,
      error,
      refetch,
      currentThreadId,
      switchThread,
      startNewThread,
      searchQuery,
      stableOnThreadChange,
    ],
  );

  const { render, ...componentProps } = props;
  const state: ThreadHistoryRootState = {
    slot: "thread-history",
    threadCount: filteredThreads.length,
    hasSearchQuery: searchQuery.length > 0,
    isLoading,
  };

  const element = useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
  });

  return (
    <ThreadHistoryContext.Provider value={contextValue}>
      {element}
    </ThreadHistoryContext.Provider>
  );
});
ThreadHistoryRoot.displayName = "ThreadHistory.Root";
