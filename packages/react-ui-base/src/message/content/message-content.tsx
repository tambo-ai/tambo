import { mergeProps } from "@base-ui/react/merge-props";
import { ComponentRenderFn, useRender } from "@base-ui/react/use-render";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { checkHasContent } from "../../utils/check-has-content";
import { convertContentToMarkdown } from "../../utils/message-content";
import { useMessageRootContext } from "../root/message-root-context";

/**
 * Props passed to the renderContent callback.
 */
export interface MessageContentState extends Record<string, unknown> {
  /** Whether the content is currently loading. */
  loading: boolean;
  /** Whether the message is in reasoning state. */
  reasoning: boolean;
  /** Whether the message has content. */
  hasContent: boolean;
  /** Whether to render the content as Markdown. */
  markdown: boolean;
}

export interface MessageContentRenderProps {
  /**
   * Optional override for the message content.
   */
  messageContent?: string | TamboThreadMessage["content"];
  /**
   * Content rendered as single Markdown string. Will be undefined if content
   * is not provided or if renderAsMarkdown is false
   * @default false
   */
  contentAsMarkdownString?: string;
  /**
   * Whether to render as Markdown.
   * @default true
   */
  renderAsMarkdown?: boolean;
}

export type MessageContentProps = MessageContentRenderProps &
  useRender.ComponentProps<
    "div",
    MessageContentState,
    MessageContentRenderProps
  >;

/**
 * Content primitive for displaying message text.
 * Handles content resolution, markdown conversion, and loading state detection.
 * The actual rendering is delegated to the children render prop.
 */
export const MessageContent = ({
  content: contentProp,
  renderAsMarkdown = true,
  ...props
}: MessageContentProps & MessageContentRenderProps) => {
  const { message, isLoading } = useMessageRootContext();
  const contentToRender = contentProp ?? message.content;

  const contentAsMarkdownString = React.useMemo(
    () =>
      renderAsMarkdown ? convertContentToMarkdown(contentToRender) : undefined,
    [contentToRender, renderAsMarkdown],
  );

  const hasContent = React.useMemo(
    () => checkHasContent(contentToRender),
    [contentToRender],
  );

  const showLoading = !!isLoading && !hasContent && !message.reasoning;

  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "div",
    render: render as ComponentRenderFn<
      MessageContentProps & MessageContentRenderProps,
      MessageContentState
    >,
    state: {
      hasContent,
      markdown: renderAsMarkdown,
      loading: showLoading,
      reasoning: !!message.reasoning,
    },
    props: mergeProps(componentProps, {
      "data-slot": "message-content",
      content: contentToRender,
      contentAsMarkdownString,
    }),
  });
};
MessageContent.displayName = "Message.Content";
