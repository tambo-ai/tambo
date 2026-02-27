import type { ThreadListResponse } from "@tambo-ai/react";
import * as React from "react";

/** Thread item from the thread list API. */
export type ThreadListItem = ThreadListResponse["threads"][number];

export interface ThreadHistoryContextValue {
  filteredThreads: ThreadListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  currentThreadId: string;
  switchThread: (threadId: string) => void;
  startNewThread: () => string;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onThreadChange?: () => void;
}

export const ThreadHistoryContext =
  React.createContext<ThreadHistoryContextValue | null>(null);

/**
 * Hook to access the thread history context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
 * @returns The thread history context value
 * @throws Error if used outside of ThreadHistory.Root
 */
export function useThreadHistoryContext(): ThreadHistoryContextValue {
  const context = React.useContext(ThreadHistoryContext);
  if (!context) {
    throw new Error(
      "React UI Base: ThreadHistoryContext is missing. ThreadHistory parts must be used within <ThreadHistory.Root>",
    );
  }
  return context;
}
