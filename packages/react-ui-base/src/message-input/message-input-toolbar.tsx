"use client";

import * as React from "react";

/**
 * Props for the MessageInput.Toolbar component.
 */
export type MessageInputToolbarProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Container for the toolbar components (like submit button and file button).
 * A simple container that provides proper semantic markup.
 */
export const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  MessageInputToolbarProps
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} data-slot="message-input-toolbar" {...props}>
      {children}
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";
