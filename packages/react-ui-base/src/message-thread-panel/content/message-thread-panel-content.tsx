"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

export interface MessageThreadPanelContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
}

/**
 * Content primitive for the message thread panel.
 * Renders the main content area (messages, input, suggestions).
 * @returns The content container element
 */
export const MessageThreadPanelContent = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelContentProps
>(function MessageThreadPanelContent({ children, asChild, ...props }, ref) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="message-thread-panel-content" {...props}>
      {children}
    </Comp>
  );
});
MessageThreadPanelContent.displayName = "MessageThreadPanel.Content";
