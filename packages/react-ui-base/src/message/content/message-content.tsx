import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { checkHasContent } from "../../utils/check-has-content";
import { convertContentToMarkdown } from "../../utils/message-content";
import { useMessageRootContext } from "../root/message-root-context";

/**
 * Props passed to the renderContent callback.
 */
export interface MessageContentRenderProps extends Record<string, unknown> {
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

type MessageContentComponentProps = useRender.ComponentProps<
  "div",
  MessageContentRenderProps
>;

export interface MessageContentProps extends Omit<
  MessageContentComponentProps,
  "content"
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
  MessageContentProps
>(({ content: contentProp, markdown = true, ...props }, ref) => {
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
  const renderProps: MessageContentRenderProps = {
    content: contentToRender,
    markdownContent,
    markdown,
    isLoading: showLoading,
    isCancelled: false,
    isReasoning: !!message.reasoning,
  };

  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "message-content",
      "data-loading": showLoading || undefined,
      "data-has-content": hasContent || undefined,
    }),
  });
});
MessageContent.displayName = "Message.Content";
