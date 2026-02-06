import type { TamboThread } from "@tambo-ai/react";
import * as React from "react";

/**
 * Context value shared among ThreadHistory primitive sub-components.
 */
export interface ThreadHistoryRootContextValue {
  /** The thread list data from useTamboThreadList. */
  threads: { items?: TamboThread[] } | null | undefined;
  /** Whether thread data is currently loading. */
  isLoading: boolean;
  /** Error from loading threads, if any. */
  error: Error | null;
  /** Refetch the thread list. */
  refetch: () => Promise<unknown>;
  /** The current active thread. */
  currentThread: TamboThread;
  /** Switch to a different thread by ID. */
  switchCurrentThread: (threadId: string) => void;
  /** Start a new thread. */
  startNewThread: () => void;
  /** The current search query for filtering threads. */
  searchQuery: string;
  /** Set the search query. */
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
  /** Set the collapsed state. */
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  /** Callback invoked when the active thread changes. */
  onThreadChange?: () => void;
  /** Position of the sidebar. */
  position?: "left" | "right";
  /** Update a thread's name. */
  updateThreadName: (newName: string, threadId?: string) => Promise<void>;
  /** Generate a thread name via AI. */
  generateThreadName: (threadId: string) => Promise<TamboThread>;
  /** Threads filtered by the current search query. */
  filteredThreads: TamboThread[];
}

const ThreadHistoryRootContext =
  React.createContext<ThreadHistoryRootContextValue | null>(null);

/**
 * Hook to access the thread history context.
 * @internal This hook is for internal use by base components only.
 * @returns The thread history context value
 * @throws Error if used outside of ThreadHistory.Root component
 */
function useThreadHistoryRootContext(): ThreadHistoryRootContextValue {
  const context = React.useContext(ThreadHistoryRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: ThreadHistoryRootContext is missing. ThreadHistory parts must be used within <ThreadHistory.Root>",
    );
  }
  return context;
}

export { ThreadHistoryRootContext, useThreadHistoryRootContext };
