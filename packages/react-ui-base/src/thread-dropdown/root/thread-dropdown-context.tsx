import * as React from "react";

/**
 * Represents a thread item in the dropdown list.
 */
export interface ThreadDropdownThread {
  id: string;
}

/**
 * Context value shared among ThreadDropdown primitive sub-components.
 */
export interface ThreadDropdownContextValue {
  /** The list of threads available in the dropdown. */
  threads: ThreadDropdownThread[];
  /** Whether the thread list is currently loading. */
  isLoading: boolean;
  /** Error from loading threads, if any. */
  error: Error | null;
  /** Whether the current platform is macOS (for keyboard shortcut labels). */
  isMac: boolean;
  /** The modifier key label for the current platform ("Option" on Mac, "Alt" otherwise). */
  modKey: string;
  /** Handler to create a new thread. */
  onNewThread: () => void;
  /** Handler to switch to an existing thread by ID. */
  onSwitchThread: (threadId: string) => void;
}

const ThreadDropdownContext =
  React.createContext<ThreadDropdownContextValue | null>(null);

/**
 * Hook to access the thread dropdown context.
 * @internal This hook is for internal use by base components only.
 * @returns The thread dropdown context value
 * @throws Error if used outside of ThreadDropdown.Root
 */
export function useThreadDropdownContext(): ThreadDropdownContextValue {
  const context = React.useContext(ThreadDropdownContext);
  if (!context) {
    throw new Error(
      "React UI Base: ThreadDropdownContext is missing. ThreadDropdown parts must be used within <ThreadDropdown.Root>",
    );
  }
  return context;
}

export { ThreadDropdownContext };
