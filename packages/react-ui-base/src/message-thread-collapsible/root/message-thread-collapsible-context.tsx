import * as React from "react";

/**
 * Context value shared among MessageThreadCollapsible sub-components.
 */
export interface MessageThreadCollapsibleContextValue {
  /** Whether the collapsible thread is open. */
  isOpen: boolean;
  /** Set the open/close state. */
  setIsOpen: (value: boolean) => void;
  /** Display-friendly shortcut string (e.g. "⌘K" or "Ctrl+K"). */
  shortcutText: string;
  /** The configured hotkey string (e.g. "mod+k"). */
  hotkey: string;
  /** Whether the current platform is macOS. */
  isMac: boolean;
  /** Callback to invoke when the active thread changes. Opens the collapsible. */
  onThreadChange: () => void;
}

const MessageThreadCollapsibleContext =
  React.createContext<MessageThreadCollapsibleContextValue | null>(null);

/**
 * Hook to access the message thread collapsible context.
 * @internal This hook is for internal use by base components only.
 * @returns The message thread collapsible context value
 * @throws Error if used outside of MessageThreadCollapsible.Root
 */
function useMessageThreadCollapsibleContext(): MessageThreadCollapsibleContextValue {
  const context = React.useContext(MessageThreadCollapsibleContext);
  if (!context) {
    throw new Error(
      "React UI Base: MessageThreadCollapsibleContext is missing. MessageThreadCollapsible parts must be used within <MessageThreadCollapsible.Root>",
    );
  }
  return context;
}

export {
  MessageThreadCollapsibleContext,
  useMessageThreadCollapsibleContext,
};
