"use client";

import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Content component.
 */
export interface MessageInputContentRenderProps {
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
export interface MessageInputContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Keep the element mounted while hidden during elicitation */
  keepMounted?: boolean;
  /** Content to display, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputContentRenderProps) => React.ReactNode);
}

/**
 * Content container that shows either children or elicitation UI.
 * Provides render props for accessing drag and elicitation state.
 */
export const MessageInputContent = React.forwardRef<
  HTMLDivElement,
  MessageInputContentProps
>(({ keepMounted = false, children, ...props }, ref) => {
  const { elicitation, resolveElicitation, isDragging } =
    useMessageInputContext();
  const hidden = !!elicitation;

  const renderProps = React.useMemo<MessageInputContentRenderProps>(
    () => ({
      isDragging,
      elicitation,
      resolveElicitation,
    }),
    [isDragging, elicitation, resolveElicitation],
  );

  if (hidden && !keepMounted) {
    return null;
  }

  return (
    <div
      ref={ref}
      data-slot="message-input-content"
      data-dragging={isDragging || undefined}
      data-elicitation={elicitation ? "active" : undefined}
      data-hidden={hidden || undefined}
      hidden={hidden && keepMounted}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </div>
  );
});
MessageInputContent.displayName = "MessageInput.Content";
