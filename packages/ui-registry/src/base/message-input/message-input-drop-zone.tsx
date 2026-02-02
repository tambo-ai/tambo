"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the DropZone component.
 */
export interface MessageInputDropZoneRenderProps {
  /** Whether files are being dragged over the input */
  isDragging: boolean;
}

/**
 * Props for the MessageInput.DropZone component.
 */
export interface MessageInputDropZoneProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Content to display, or render function */
  children?:
    | React.ReactNode
    | ((props: MessageInputDropZoneRenderProps) => React.ReactNode);
}

/**
 * Drop zone overlay that appears when dragging files.
 * Only renders when isDragging is true.
 */
export const MessageInputDropZone = React.forwardRef<
  HTMLDivElement,
  MessageInputDropZoneProps
>(({ asChild, children, ...props }, ref) => {
  const { isDragging } = useMessageInputContext();

  // Don't render if not dragging
  if (!isDragging && typeof children !== "function") {
    return null;
  }

  const renderProps: MessageInputDropZoneRenderProps = {
    isDragging,
  };

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="message-input-drop-zone"
      data-dragging={isDragging || undefined}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </Comp>
  );
});
MessageInputDropZone.displayName = "MessageInput.DropZone";
