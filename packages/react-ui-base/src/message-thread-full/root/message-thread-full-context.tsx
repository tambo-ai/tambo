"use client";

import * as React from "react";

/**
 * Context value shared among MessageThreadFull primitive sub-components.
 */
export interface MessageThreadFullContextValue {
  /** Ref for the container element used for canvas detection. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether canvas space is present in the layout. */
  hasCanvasSpace: boolean;
  /** Whether the canvas is positioned on the left side. */
  canvasIsOnLeft: boolean;
  /** Whether this thread is positioned as a left panel. */
  isLeftPanel: boolean;
  /** Which side the history sidebar is positioned on. */
  historyPosition: "left" | "right";
}

const MessageThreadFullContext =
  React.createContext<MessageThreadFullContextValue | null>(null);

/**
 * Hook to access the message thread full context.
 * @internal This hook is for internal use by base components only.
 * @returns The message thread full context value
 * @throws Error if used outside of MessageThreadFull.Root component
 */
function useMessageThreadFullContext(): MessageThreadFullContextValue {
  const context = React.useContext(MessageThreadFullContext);
  if (!context) {
    throw new Error(
      "React UI Base: MessageThreadFullContext is missing. MessageThreadFull parts must be used within <MessageThreadFull.Root>",
    );
  }
  return context;
}

export { MessageThreadFullContext, useMessageThreadFullContext };
