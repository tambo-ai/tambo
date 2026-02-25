"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import {
  useThreadDropdownContext,
  type ThreadDropdownListItem,
} from "../root/thread-dropdown-context";

export interface ThreadDropdownContentState extends Record<string, unknown> {
  slot: string;
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  threads: ThreadDropdownListItem[];
  error: Error | null;
}

export type ThreadDropdownContentProps = useRender.ComponentProps<
  "div",
  ThreadDropdownContentState
>;

/**
 * Content container for the thread dropdown menu.
 * Exposes loading/empty/error/threads state via render props.
 */
export const ThreadDropdownContent = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownContentProps
>((props, ref) => {
  const { threads, isLoading, error } = useThreadDropdownContext();

  const { render, ...componentProps } = props;
  const state: ThreadDropdownContentState = {
    slot: "thread-dropdown-content",
    isLoading,
    hasError: !!error,
    isEmpty: threads.length === 0,
    threads,
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
ThreadDropdownContent.displayName = "ThreadDropdown.Content";
