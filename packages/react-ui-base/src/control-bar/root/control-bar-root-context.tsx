import * as React from "react";

/**
 * Context value shared among ControlBar sub-components.
 */
export interface ControlBarRootContextValue {
  /** Whether the control bar dialog is open. */
  isOpen: boolean;
  /** Set the open state. */
  setOpen: (value: boolean) => void;
  /** The configured hotkey string (e.g. "mod+k"). */
  hotkey: string;
  /** Whether the current platform is macOS. */
  isMac: boolean;
  /** Display-friendly hotkey string (e.g. "⌘K" or "Ctrl+K"). */
  hotkeyDisplay: string;
  /** Whether the thread has messages to display. */
  hasMessages: boolean;
}

const ControlBarRootContext =
  React.createContext<ControlBarRootContextValue | null>(null);

/**
 * Hook to access the control bar root context.
 * @internal This hook is for internal use by base components only.
 * @returns The control bar root context value
 * @throws Error if used outside of ControlBar.Root
 */
function useControlBarRootContext(): ControlBarRootContextValue {
  const context = React.useContext(ControlBarRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: ControlBarRootContext is missing. ControlBar parts must be used within <ControlBar.Root>",
    );
  }
  return context;
}

export { ControlBarRootContext, useControlBarRootContext };
