"use client";

import {
  ScrollableMessageContainer as ScrollableMessageContainerBase,
  type ScrollableMessageContainerViewportProps,
} from "@tambo-ai/react-ui-base/scrollable-message-container";
import { cn } from "@tambo-ai/ui-registry/utils";
import * as React from "react";

/**
 * Props for the ScrollableMessageContainer component.
 */
export type ScrollableMessageContainerProps =
  ScrollableMessageContainerViewportProps &
    React.HTMLAttributes<HTMLDivElement>;

/**
 * A scrollable container for message content with auto-scroll functionality.
 * Used across message thread components for consistent scrolling behavior.
 *
 * This is a styled wrapper around the base ScrollableMessageContainer compound
 * component. It composes Root and Viewport into a single element for backwards
 * compatibility with the original non-compound API.
 *
 * @example
 * ```tsx
 * <ScrollableMessageContainer>
 *   <ThreadContent variant="default">
 *     <ThreadContentMessages />
 *   </ThreadContent>
 * </ScrollableMessageContainer>
 * ```
 * @returns A scrollable container element with auto-scroll behavior
 */
export const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
>(({ className, children, ...props }, ref) => {
  return (
    <ScrollableMessageContainerBase.Root asChild>
      <ScrollableMessageContainerBase.Viewport
        ref={ref}
        className={cn(
          "flex-1 overflow-y-auto",
          "[&::-webkit-scrollbar]:w-[6px]",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
          "[&::-webkit-scrollbar:horizontal]:h-[4px]",
          className,
        )}
        data-slot="scrollable-message-container"
        {...props}
      >
        {children}
      </ScrollableMessageContainerBase.Viewport>
    </ScrollableMessageContainerBase.Root>
  );
});
ScrollableMessageContainer.displayName = "ScrollableMessageContainer";
