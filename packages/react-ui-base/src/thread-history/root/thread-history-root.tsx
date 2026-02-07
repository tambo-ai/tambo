import { Slot } from "@radix-ui/react-slot";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import * as React from "react";
import {
  ThreadHistoryRootContext,
  type ThreadHistoryRootContextValue,
} from "./thread-history-root-context";

/**
 * Props passed to the Root render function.
 */
export interface ThreadHistoryRootRenderProps {
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
  /** Position of the sidebar. */
  position: "left" | "right";
}

export interface ThreadHistoryRootProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Callback invoked when the active thread changes. */
  onThreadChange?: () => void;
  /** Whether the sidebar should start collapsed. */
  defaultCollapsed?: boolean;
  /** Position of the sidebar. */
  position?: "left" | "right";
  /** Children as ReactNode or render function receiving root state. */
  children?:
    | React.ReactNode
    | ((props: ThreadHistoryRootRenderProps) => React.ReactNode);
}

/**
 * Root primitive for the thread history component.
 * Provides context for all child ThreadHistory sub-components including
 * thread list data, search/filter state, and collapse state.
 * @returns The root thread history element with context provider
 */
export const ThreadHistoryRoot = React.forwardRef<
  HTMLDivElement,
  ThreadHistoryRootProps
>(function ThreadHistoryRoot(
  {
    children,
    asChild,
    onThreadChange,
    defaultCollapsed = true,
    position = "left",
    ...props
  },
  ref,
) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const { data: threads, isLoading, error, refetch } = useTamboThreadList();

  const {
    switchCurrentThread,
    startNewThread,
    thread: currentThread,
    updateThreadName,
    generateThreadName,
  } = useTamboThread();

  // Update CSS variable when sidebar collapses/expands
  React.useEffect(() => {
    const sidebarWidth = isCollapsed ? "3rem" : "16rem";
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth);
  }, [isCollapsed]);

  // Filter threads based on search query
  const filteredThreads = React.useMemo(() => {
    if (isCollapsed) return [];
    if (!threads?.items) return [];

    const query = searchQuery.toLowerCase();
    return threads.items.filter((thread) => {
      const nameMatches = thread.name?.toLowerCase().includes(query) ?? false;
      const idMatches = thread.id.toLowerCase().includes(query);
      return idMatches ? true : nameMatches;
    });
  }, [isCollapsed, threads, searchQuery]);

  const contextValue = React.useMemo(
    () => ({
      threads,
      isLoading,
      error,
      refetch,
      currentThread,
      switchCurrentThread,
      startNewThread,
      searchQuery,
      setSearchQuery,
      isCollapsed,
      setIsCollapsed,
      onThreadChange,
      position,
      updateThreadName,
      generateThreadName,
      filteredThreads,
    }),
    [
      threads,
      isLoading,
      error,
      refetch,
      currentThread,
      switchCurrentThread,
      startNewThread,
      searchQuery,
      isCollapsed,
      onThreadChange,
      position,
      updateThreadName,
      generateThreadName,
      filteredThreads,
    ],
  );

  const Comp = asChild ? Slot : "div";

  const renderedChildren =
    typeof children === "function"
      ? children({ isCollapsed, position })
      : children;

  return (
    <ThreadHistoryRootContext.Provider
      value={contextValue as ThreadHistoryRootContextValue}
    >
      <Comp
        ref={ref}
        data-slot="thread-history-root"
        data-collapsed={isCollapsed || undefined}
        data-position={position}
        {...props}
      >
        {renderedChildren}
      </Comp>
    </ThreadHistoryRootContext.Provider>
  );
});
