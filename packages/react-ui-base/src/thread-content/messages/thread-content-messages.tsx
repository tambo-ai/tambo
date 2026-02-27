"use client";

import { useRender } from "@base-ui/react/use-render";
import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useThreadContentContext } from "../root/thread-content-context";

/**
 * Filters out system messages, empty-content messages, and standalone
 * tool_result-only messages. Tool results are consumed by ToolcallInfo on the
 * preceding tool_use message and should not render as standalone message bubbles.
 * @returns The filtered messages array
 */
function filterDisplayMessages(
  messages: TamboThreadMessage[],
): TamboThreadMessage[] {
  return messages.filter((message) => {
    if (message.role === "system") return false;
    if (message.content.length === 0) return false;
    if (message.content.every((block) => block.type === "tool_result")) {
      return false;
    }
    return true;
  });
}

export interface ThreadContentMessagesState extends Record<string, unknown> {
  slot: string;
  messageCount: number;
  isEmpty: boolean;
  isGenerating: boolean;
  filteredMessages: TamboThreadMessage[];
}

type ThreadContentMessagesComponentProps = useRender.ComponentProps<
  "div",
  ThreadContentMessagesState
>;

export type ThreadContentMessagesProps = ThreadContentMessagesComponentProps;

/**
 * Renders the list of messages in the thread.
 * Provides filtered messages through render state for consumer-driven rendering.
 */
export const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>((props, ref) => {
  const { messages, isGenerating } = useThreadContentContext();
  const filteredMessages = React.useMemo(
    () => filterDisplayMessages(messages),
    [messages],
  );

  const { render, ...componentProps } = props;
  const state: ThreadContentMessagesState = {
    slot: "thread-content-messages",
    messageCount: filteredMessages.length,
    isEmpty: filteredMessages.length === 0,
    isGenerating,
    filteredMessages,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
  });
});
ThreadContentMessages.displayName = "ThreadContent.Messages";
