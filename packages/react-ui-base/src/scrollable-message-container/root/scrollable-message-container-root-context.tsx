import * as React from "react";

/**
 * Context value shared among ScrollableMessageContainer primitive sub-components.
 */
export interface ScrollableMessageContainerRootContextValue {
  /** Whether the container should auto-scroll to the bottom when content changes. */
  shouldAutoscroll: boolean;
  /** Whether the scroll position is currently at the bottom of the container. */
  isAtBottom: boolean;
  /** Scroll the container to the bottom. */
  scrollToBottom: () => void;
  /** Suspend auto-scrolling (e.g., when user scrolls up). */
  suspendAutoscroll: () => void;
  /** Resume auto-scrolling (e.g., when user scrolls to bottom). */
  resumeAutoscroll: () => void;
  /** Ref for the scrollable viewport element. */
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

const ScrollableMessageContainerRootContext =
  React.createContext<ScrollableMessageContainerRootContextValue | null>(null);

/**
 * Hook to access the scrollable message container context.
 * @internal This hook is for internal use by base components only.
 * @returns The scrollable message container context value
 * @throws Error if used outside of ScrollableMessageContainer.Root component
 */
function useScrollableMessageContainerRootContext(): ScrollableMessageContainerRootContextValue {
  const context = React.useContext(ScrollableMessageContainerRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: ScrollableMessageContainerRootContext is missing. ScrollableMessageContainer parts must be used within <ScrollableMessageContainer.Root>",
    );
  }
  return context;
}

export {
  ScrollableMessageContainerRootContext,
  useScrollableMessageContainerRootContext,
};
