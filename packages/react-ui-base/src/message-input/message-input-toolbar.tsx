"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

/**
 * Props for the MessageInput.Toolbar component.
 */
export interface MessageInputToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
}

/**
 * Container for the toolbar components (like submit button and file button).
 * A simple container that provides proper semantic markup.
 */
export const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  MessageInputToolbarProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="message-input-toolbar" {...props}>
      {children}
    </Comp>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";
