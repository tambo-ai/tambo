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
export interface MessageInputContentState extends Record<string, unknown> {
  slot: string;
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
  MessageInputContentState
> & {
  /** Whether to keep the content mounted even when hidden */
  keepMounted?: boolean;
};

/**
 * Content container that shows either children or elicitation UI.
 * Provides render props for accessing drag and elicitation state.
 */
export const MessageInputContent = React.forwardRef<
  HTMLDivElement,
  MessageInputContentProps
>(({ keepMounted = false, ...props }, ref) => {
  const { elicitation, resolveElicitation, isDragging } =
    useMessageInputContext();
  const hidden = !!elicitation;

  const renderProps = React.useMemo<MessageInputContentState>(
    () => ({
      slot: "message-input-content",
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
    enabled: !hidden || keepMounted,
    state: renderProps,
    stateAttributesMapping: {
      elicitation: () => null,
      resolveElicitation: () => null,
    },
    props: mergeProps(componentProps, {
      "data-dragging": isDragging || undefined,
      "data-elicitation": elicitation ? "active" : undefined,
    }),
  });
});
MessageInputContent.displayName = "MessageInput.Content";
