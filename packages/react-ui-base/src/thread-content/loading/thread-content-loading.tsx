"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useThreadContentContext } from "../root/thread-content-context";

export interface ThreadContentLoadingState extends Record<string, unknown> {
  slot: string;
  isLoading: boolean;
}

type ThreadContentLoadingComponentProps = useRender.ComponentProps<
  "div",
  ThreadContentLoadingState
>;

export interface ThreadContentLoadingProps extends ThreadContentLoadingComponentProps {
  /** Keeps the node mounted and toggles `data-hidden` when not loading. */
  keepMounted?: boolean;
}

/**
 * Renders its children only when the thread is generating and has no messages yet.
 * Use `keepMounted` to keep the node in the DOM and toggle `data-hidden` instead.
 */
export const ThreadContentLoading = React.forwardRef<
  HTMLDivElement,
  ThreadContentLoadingProps
>((props, ref) => {
  const { isLoading } = useThreadContentContext();
  const { render, keepMounted, ...componentProps } = props;

  const state: ThreadContentLoadingState = {
    slot: "thread-content-loading",
    isLoading,
  };

  if (!isLoading && !keepMounted) {
    return null;
  }

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: {
      ...componentProps,
      "data-hidden": !isLoading ? "true" : undefined,
    },
  });
});
ThreadContentLoading.displayName = "ThreadContent.Loading";
