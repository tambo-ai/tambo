import { type ThreadListItem } from "../../thread-history/root/thread-history-context";
import * as React from "react";

export interface ThreadDropdownContextValue {
  threads: ThreadListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  currentThreadId: string;
  switchThread: (threadId: string) => void;
  startNewThread: () => string;
  onThreadChange?: () => void;
}

export const ThreadDropdownContext =
  React.createContext<ThreadDropdownContextValue | null>(null);

/**
 * Hook to access the thread dropdown context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
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
