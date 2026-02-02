"use client";

import { Slot } from "@radix-ui/react-slot";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Elicitation component.
 */
export interface MessageInputElicitationRenderProps {
  /** The current elicitation request */
  request: TamboElicitationRequest;
  /** Callback to resolve the elicitation */
  onResponse: (response: TamboElicitationResponse) => void;
}

/**
 * Props for the MessageInput.Elicitation component.
 */
export interface MessageInputElicitationProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Content to display, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputElicitationRenderProps) => React.ReactNode);
}

/**
 * Component for rendering elicitation UI when an elicitation is active.
 * Only renders when there is an active elicitation request.
 */
export const MessageInputElicitation = React.forwardRef<
  HTMLDivElement,
  MessageInputElicitationProps
>(({ asChild, children, ...props }, ref) => {
  const { elicitation, resolveElicitation } = useMessageInputContext();

  // Don't render if no active elicitation
  if (!elicitation || !resolveElicitation) {
    return null;
  }

  const renderProps: MessageInputElicitationRenderProps = {
    request: elicitation,
    onResponse: resolveElicitation,
  };

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="message-input-elicitation" {...props}>
      {typeof children === "function" ? children(renderProps) : children}
    </Comp>
  );
});
MessageInputElicitation.displayName = "MessageInput.Elicitation";
