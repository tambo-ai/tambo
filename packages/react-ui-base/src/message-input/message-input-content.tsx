"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Content component.
 */
export interface MessageInputContentRenderProps extends Record<
  string,
  unknown
> {
  /** Whether files are being dragged over the input */
  isDragging: boolean;
  /** Current elicitation request if active */
  elicitation: TamboElicitationRequest | null;
  /** Callback to resolve the elicitation */
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
}

/**
 * Props for the MessageInput.Content component.
 */
export type MessageInputContentProps = useRender.ComponentProps<
  "div",
  MessageInputContentRenderProps
>;

/**
 * Content container that shows either children or elicitation UI.
 * Provides render props for accessing drag and elicitation state.
 */
export const MessageInputContent = React.forwardRef<
  HTMLDivElement,
  MessageInputContentProps
>(({ ...props }, ref) => {
  const { elicitation, resolveElicitation, isDragging } =
    useMessageInputContext();

  const renderProps = React.useMemo<MessageInputContentRenderProps>(
    () => ({
      isDragging,
      elicitation,
      resolveElicitation,
    }),
    [isDragging, elicitation, resolveElicitation],
  );

  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "message-input-content",
      "data-dragging": isDragging || undefined,
      "data-elicitation": elicitation ? "active" : undefined,
    }),
  });
});
MessageInputContent.displayName = "MessageInput.Content";
