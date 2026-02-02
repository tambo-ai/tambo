"use client";

import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { Slot } from "@radix-ui/react-slot";
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
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
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
>(({ asChild, children, ...props }, ref) => {
  const { elicitation, resolveElicitation, isDragging } =
    useMessageInputContext();

  const renderProps: MessageInputContentRenderProps = {
    isDragging,
    elicitation,
    resolveElicitation,
  };

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="message-input-content"
      data-dragging={isDragging || undefined}
      data-elicitation={elicitation ? "active" : undefined}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </Comp>
  );
});
MessageInputContent.displayName = "MessageInput.Content";
