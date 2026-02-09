import * as React from "react";

/**
 * Context value shared among MessageThreadPanel sub-components.
 */
export interface MessageThreadPanelContextValue {
  /** Ref for the panel DOM element. */
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Current panel width in pixels. */
  width: number;
  /** Update the panel width. */
  setWidth: (width: number) => void;
  /** Whether this panel is on the left side. */
  isLeftPanel: boolean;
  /** Which side the history sidebar should appear on. */
  historyPosition: "left" | "right";
  /** Whether a canvas space element is present. */
  hasCanvasSpace: boolean;
  /** Whether the canvas is positioned to the left. */
  canvasIsOnLeft: boolean;
}

const MessageThreadPanelContext =
  React.createContext<MessageThreadPanelContextValue | null>(null);

/**
 * Hook to access the message thread panel context.
 * Must be used within a MessageThreadPanel.Root component.
 *
 * @returns The message thread panel context value
 * @throws Error if used outside of MessageThreadPanel.Root
 */
function useMessageThreadPanelContext(): MessageThreadPanelContextValue {
  const context = React.useContext(MessageThreadPanelContext);
  if (!context) {
    throw new Error(
      "React UI Base: MessageThreadPanelContext is missing. MessageThreadPanel parts must be used within <MessageThreadPanel.Root>",
    );
  }
  return context;
}

export { MessageThreadPanelContext, useMessageThreadPanelContext };
