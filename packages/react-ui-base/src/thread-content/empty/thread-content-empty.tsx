"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useThreadContentContext } from "../root/thread-content-context";

export interface ThreadContentEmptyState extends Record<string, unknown> {
  slot: string;
  isEmpty: boolean;
}

type ThreadContentEmptyComponentProps = useRender.ComponentProps<
  "div",
  ThreadContentEmptyState
>;

export interface ThreadContentEmptyProps extends ThreadContentEmptyComponentProps {
  /** Keeps the node mounted and toggles `data-hidden` when non-empty. */
  keepMounted?: boolean;
}

/**
 * Renders its children only when the thread has no messages.
 * Use `keepMounted` to keep the node in the DOM and toggle `data-hidden` instead.
 */
export const ThreadContentEmpty = React.forwardRef<
  HTMLDivElement,
  ThreadContentEmptyProps
>((props, ref) => {
  const { isEmpty } = useThreadContentContext();
  const { render, keepMounted, ...componentProps } = props;

  const state: ThreadContentEmptyState = {
    slot: "thread-content-empty",
    isEmpty,
  };

  if (!isEmpty && !keepMounted) {
    return null;
  }

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: {
      ...componentProps,
      "data-hidden": !isEmpty ? "true" : undefined,
    },
  });
});
ThreadContentEmpty.displayName = "ThreadContent.Empty";
