import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { checkHasContent } from "../../utils/check-has-content";
import { convertContentToMarkdown } from "../../utils/message-content";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageRootContext } from "../root/message-root-context";

/**
 * Props passed to the renderContent callback.
 */
export interface MessageContentRenderProps {
  /** The resolved content to render (from children, content prop, or message). */
  content: unknown;
  /** The content converted to markdown string. */
  markdownContent: string;
  /** Whether markdown rendering is enabled. */
  markdown: boolean;
  /** Whether the content is currently loading. */
  isLoading: boolean;
  /** Whether the message has been cancelled. */
  isCancelled: boolean;
  /** Whether the message is in reasoning state. */
  isReasoning: boolean;
}

export interface MessageContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content" | "children"
> {
  /** Optional override for the message content. */
  content?: string | TamboThreadMessage["content"];
  /** Whether to render as Markdown. Default is true. */
  markdown?: boolean;
}

/**
 * Content primitive for displaying message text.
 * Handles content resolution, markdown conversion, and loading state detection.
 * The actual rendering is delegated to the children render prop.
 */
export const MessageContent = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    MessageContentProps,
    MessageContentRenderProps
  >
>(({ content: contentProp, markdown = true, asChild, ...props }, ref) => {
  const { message, isLoading } = useMessageRootContext();
  const contentToRender = contentProp ?? message.content;

  const markdownContent = React.useMemo(
    () => convertContentToMarkdown(contentToRender),
    [contentToRender],
  );

  const hasContent = React.useMemo(
    () => checkHasContent(contentToRender),
    [contentToRender],
  );

  const showLoading = !!isLoading && !hasContent && !message.reasoning;

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    content: contentToRender,
    markdownContent,
    markdown,
    isLoading: showLoading,
    isCancelled: false,
    isReasoning: !!message.reasoning,
  });

  return (
    <Comp
      ref={ref}
      data-slot="message-content"
      data-loading={showLoading || undefined}
      data-has-content={hasContent || undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
MessageContent.displayName = "Message.Content";
