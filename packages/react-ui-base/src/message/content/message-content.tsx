import { useRender } from "@base-ui/react/use-render";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { checkHasContent } from "../../utils/check-has-content";
import { convertContentToMarkdown } from "../../utils/message-content";
import { useMessageRootContext } from "../root/message-root-context";

/**
 * State passed to the render callback as the second argument.
 */
export interface MessageContentState extends Record<string, unknown> {
  slot: string;
  /** Whether the content is currently loading. */
  loading: boolean;
  /** Whether the message is in reasoning state. */
  reasoning: boolean;
  /** Whether the message has content. */
  hasContent: boolean;
  /** Whether to render the content as Markdown. */
  markdown: boolean;
  /** The resolved content to render. */
  content: string | TamboThreadMessage["content"];
  /** Content rendered as single Markdown string. Undefined if renderAsMarkdown is false. */
  contentAsMarkdownString?: string;
}

export interface MessageContentRenderProps {
  /**
   * Optional override for the message content.
   */
  messageContent?: string | TamboThreadMessage["content"];
  /**
   * Whether to render as Markdown.
   * @default true
   */
  renderAsMarkdown?: boolean;
}

export type MessageContentProps = MessageContentRenderProps &
  useRender.ComponentProps<"div", MessageContentState>;

/**
 * Content primitive for displaying message text.
 * Handles content resolution, markdown conversion, and loading state detection.
 * The actual rendering is delegated to the children render prop.
 */
export const MessageContent = React.forwardRef<
  HTMLDivElement,
  MessageContentProps
>(({ messageContent, renderAsMarkdown = true, ...props }, ref) => {
  const { message, isLoading } = useMessageRootContext();
  const contentToRender = messageContent ?? message.content;

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

  const state: MessageContentState = {
    slot: "message-content",
    hasContent,
    markdown: renderAsMarkdown,
    loading: showLoading,
    reasoning: !!message.reasoning,
    content: contentToRender,
    contentAsMarkdownString,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    stateAttributesMapping: {
      content: () => null,
      contentAsMarkdownString: () => null,
    },
    props: componentProps,
  });
});
MessageContent.displayName = "Message.Content";
