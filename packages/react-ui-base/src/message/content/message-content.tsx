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
  /**
   * Keep the element mounted when there is no content. When false (default),
   * the component returns null if the message has no text content.
   * @default false
   */
  keepMounted?: boolean;
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
>(
  (
    { messageContent, renderAsMarkdown = true, keepMounted = false, ...props },
    ref,
  ) => {
    const { message, isLoading } = useMessageRootContext();
    const contentToRender = messageContent ?? message.content;

    const contentAsMarkdownString = React.useMemo(
      () =>
        renderAsMarkdown
          ? convertContentToMarkdown(contentToRender)
          : undefined,
      [contentToRender, renderAsMarkdown],
    );

    const hasContent = React.useMemo(
      () => checkHasContent(contentToRender),
      [contentToRender],
    );

    const showLoading = !!isLoading && !hasContent && !message.reasoning;

    const { render, children, ...componentProps } = props;

    const state: MessageContentState = {
      slot: "message-content",
      hasContent,
      markdown: renderAsMarkdown,
      loading: showLoading,
      reasoning: !!message.reasoning,
      content: contentToRender,
      contentAsMarkdownString,
    };

    // Default to rendering the markdown string when no children or render prop
    const defaultChildren = children ?? (contentAsMarkdownString || null);

    if (!hasContent && !keepMounted) {
      return null;
    }

    return useRender({
      defaultTagName: "div",
      ref,
      render,
      state,
      stateAttributesMapping: {
        content: () => null,
        contentAsMarkdownString: () => null,
      },
      props: {
        ...componentProps,
        children: defaultChildren,
        "data-hidden": !hasContent ? "true" : undefined,
      },
    });
  },
);
MessageContent.displayName = "Message.Content";
