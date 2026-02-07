"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageThreadFullContext } from "../root/message-thread-full-context";

export interface MessageThreadFullSidebarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Which side this sidebar should appear on. Only renders when historyPosition matches. */
  position: "left" | "right";
}

/**
 * Sidebar primitive for the message thread full component.
 * Reads layout context from Root and renders children only when the
 * historyPosition matches the specified position prop.
 * @returns The sidebar element when position matches, or null otherwise
 */
export const MessageThreadFullSidebar = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullSidebarProps
>(function MessageThreadFullSidebar(
  { children, asChild, position, ...props },
  ref,
) {
  const { historyPosition } = useMessageThreadFullContext();

  if (historyPosition !== position) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="message-thread-full-sidebar"
      data-position={position}
      {...props}
    >
      {children}
    </Comp>
  );
});
MessageThreadFullSidebar.displayName = "MessageThreadFull.Sidebar";
