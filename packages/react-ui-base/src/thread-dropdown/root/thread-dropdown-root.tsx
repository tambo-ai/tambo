"use client";

import { useRender } from "@base-ui/react/use-render";
import { useTambo, useTamboThreadList } from "@tambo-ai/react";
import * as React from "react";
import { ThreadDropdownContext } from "./thread-dropdown-context";

export interface ThreadDropdownRootState extends Record<string, unknown> {
  slot: string;
  threadCount: number;
  isLoading: boolean;
}

type ThreadDropdownRootComponentProps = useRender.ComponentProps<
  "div",
  ThreadDropdownRootState
>;

export interface ThreadDropdownRootProps extends ThreadDropdownRootComponentProps {
  /** Callback invoked after a thread switch or new thread creation. */
  onThreadChange?: () => void;
}

/**
 * Root component for thread dropdown.
 * Provides thread action availability state and thread data to children.
 */
export const ThreadDropdownRoot = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownRootProps
>(({ onThreadChange, ...props }, ref) => {
  const { data, isLoading, error, refetch } = useTamboThreadList();
  const { switchThread, startNewThread } = useTambo();

  const threads = React.useMemo(() => data?.threads ?? [], [data?.threads]);

  const contextValue = React.useMemo(
    () => ({
      threads,
      isLoading,
      error,
      refetch,
      switchThread,
      startNewThread,
      onThreadChange,
    }),
    [
      threads,
      isLoading,
      error,
      refetch,
      switchThread,
      startNewThread,
      onThreadChange,
    ],
  );

  const { render, ...componentProps } = props;
  const state: ThreadDropdownRootState = {
    slot: "thread-dropdown",
    threadCount: threads.length,
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
    <ThreadDropdownContext.Provider value={contextValue}>
      {element}
    </ThreadDropdownContext.Provider>
  );
});
ThreadDropdownRoot.displayName = "ThreadDropdown.Root";
