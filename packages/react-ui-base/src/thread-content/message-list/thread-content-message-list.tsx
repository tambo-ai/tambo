import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useThreadContentRootContext } from "../root/thread-content-root-context";

/**
 * Props passed to the render function of ThreadContentMessageList.
 */
export interface ThreadContentMessageListRenderProps {
  /** The filtered messages to display (excludes system and child messages). */
  messages: TamboThreadMessage[];
  /** Whether the thread is currently generating a response. */
  isGenerating: boolean;
}

export type ThreadContentMessageListProps =
  BasePropsWithChildrenOrRenderFunction<
    Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
      /**
       * Optional custom filter function for messages.
       * When not provided, system messages and child messages (with parentMessageId) are excluded.
       */
      filter?: (message: TamboThreadMessage) => boolean;
    },
    ThreadContentMessageListRenderProps
  >;

/**
 * Default message filter that excludes system messages and child messages.
 * @returns Whether the message should be included in the list
 */
function defaultMessageFilter(message: TamboThreadMessage): boolean {
  return message.role !== "system" && !message.parentMessageId;
}

/**
 * Primitive for rendering the list of messages in a thread.
 * Supports render props for custom message rendering.
 * @returns The message list container element
 */
export const ThreadContentMessageList = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessageListProps
>(function ThreadContentMessageList({ filter, asChild, ...props }, ref) {
  const { messages, isGenerating } = useThreadContentRootContext();

  const filterFn = filter ?? defaultMessageFilter;
  const filteredMessages = React.useMemo(
    () => messages.filter(filterFn),
    [messages, filterFn],
  );

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    messages: filteredMessages,
    isGenerating,
  });

  return (
    <Comp ref={ref} data-slot="thread-content-message-list" {...componentProps}>
      {content}
    </Comp>
  );
});
