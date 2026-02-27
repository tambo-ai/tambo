"use client";

import { useRender } from "@base-ui/react/use-render";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { ThreadContentContext } from "./thread-content-context";

export interface ThreadContentRootState extends Record<string, unknown> {
  slot: string;
  messageCount: number;
  isEmpty: boolean;
  isGenerating: boolean;
  isLoading: boolean;
}

type ThreadContentRootComponentProps = useRender.ComponentProps<
  "div",
  ThreadContentRootState
>;

export type ThreadContentRootProps = ThreadContentRootComponentProps;

/**
 * Root component for thread content.
 * Derives timeline state from Tambo hooks and provides it to children via context.
 */
export const ThreadContentRoot = React.forwardRef<
  HTMLDivElement,
  ThreadContentRootProps
>((props, ref) => {
  const { messages, isStreaming } = useTambo();
  const isGenerating = isStreaming;
  const isEmpty = messages.length === 0 && !isGenerating;
  const isLoading = isGenerating && messages.length === 0;

  const contextValue = React.useMemo(
    () => ({
      messages,
      isGenerating,
      isEmpty,
      isLoading,
    }),
    [messages, isGenerating, isEmpty, isLoading],
  );

  const { render, ...componentProps } = props;
  const state: ThreadContentRootState = {
    slot: "thread-content",
    messageCount: messages.length,
    isEmpty,
    isGenerating,
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
    <ThreadContentContext.Provider value={contextValue}>
      {element}
    </ThreadContentContext.Provider>
  );
});
ThreadContentRoot.displayName = "ThreadContent.Root";
