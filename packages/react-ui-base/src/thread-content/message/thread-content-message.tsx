import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";

export type ThreadContentMessageProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The message to display. */
    message: TamboThreadMessage;
    /** Index of the message in the filtered list. */
    index: number;
    /** Total number of messages in the filtered list. */
    total: number;
    /** Whether the thread is currently generating a response. */
    isGenerating: boolean;
  }
>;

/**
 * Generates a stable key for a thread message.
 * Falls back to a composite key when the message has no id.
 * @returns A string key suitable for use as a React key
 */
export function getMessageKey(
  message: TamboThreadMessage,
  index: number,
): string {
  if (message.id) {
    return message.id;
  }
  const contentPrefix = message.content?.toString().substring(0, 10) ?? "";
  return `${message.role}-${message.createdAt ?? index}-${contentPrefix}`;
}

/**
 * Primitive wrapper for an individual message in the thread content.
 * Provides data attributes for the message role and position.
 * @returns The message wrapper element
 */
export const ThreadContentMessage = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessageProps
>(function ThreadContentMessage(
  { message, index, total, isGenerating, asChild, children, ...props },
  ref,
) {
  const isLast = index === total - 1;
  const isLoading = isGenerating && isLast;

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="thread-content-message"
      data-message-role={message.role === "assistant" ? "assistant" : "user"}
      data-message-index={index}
      data-message-loading={isLoading || undefined}
      data-message-last={isLast || undefined}
      {...props}
    >
      {children}
    </Comp>
  );
});
