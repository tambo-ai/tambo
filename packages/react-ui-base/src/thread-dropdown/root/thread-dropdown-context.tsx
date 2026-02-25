import type { ThreadListResponse } from "@tambo-ai/react";
import * as React from "react";

/** Thread item from the thread list API. */
export type ThreadDropdownListItem = ThreadListResponse["threads"][number];

export interface ThreadDropdownContextValue {
  threads: ThreadDropdownListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
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
