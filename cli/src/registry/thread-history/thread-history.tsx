"use client";

import { cn } from "@/lib/utils";
import {
  type TamboThread,
  useTamboThread,
  useTamboThreadList,
} from "@tambo-ai/react";
import {
  PlusIcon,
  SearchIcon,
  ArrowLeftToLine,
  ArrowRightToLine,
} from "lucide-react";
import * as React from "react";

/**
 * Context for sharing thread history state and functions
 */
interface ThreadHistoryContextValue {
  threads: { items?: TamboThread[] } | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  currentThread: TamboThread;
  switchCurrentThread: (threadId: string) => void;
  startNewThread: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onThreadChange?: () => void;
  contextKey?: string;
  position?: "left" | "right";
}

const ThreadHistoryContext =
  React.createContext<ThreadHistoryContextValue | null>(null);

const useThreadHistoryContext = () => {
  const context = React.useContext(ThreadHistoryContext);
  if (!context) {
    throw new Error(
      "ThreadHistory components must be used within ThreadHistory",
    );
  }
  return context;
};

/**
 * Root component that provides context for thread history
 */
interface ThreadHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  onThreadChange?: () => void;
  children?: React.ReactNode;
  defaultCollapsed?: boolean;
  position?: "left" | "right";
}

const ThreadHistory = React.forwardRef<HTMLDivElement, ThreadHistoryProps>(
  (
    {
      className,
      contextKey,
      onThreadChange,
      defaultCollapsed = true,
      position = "left",
      children,
      ...props
    },
    ref,
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [shouldFocusSearch, setShouldFocusSearch] = React.useState(false);

    const {
      data: threads,
      isLoading,
      error,
      refetch,
    } = useTamboThreadList({ contextKey });

    const {
      switchCurrentThread,
      startNewThread,
      thread: currentThread,
    } = useTamboThread();

    // Update CSS variable when sidebar collapses/expands
    React.useEffect(() => {
      const sidebarWidth = isCollapsed ? "3rem" : "16rem";
      document.documentElement.style.setProperty(
        "--sidebar-width",
        sidebarWidth,
      );
    }, [isCollapsed]);

    // Focus search input when expanded from collapsed state
    React.useEffect(() => {
      if (!isCollapsed && shouldFocusSearch) {
        setShouldFocusSearch(false);
      }
    }, [isCollapsed, shouldFocusSearch]);

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
        contextKey,
        position,
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
        contextKey,
        position,
      ],
    );

    return (
      <ThreadHistoryContext.Provider
        value={contextValue as ThreadHistoryContextValue}
      >
        <div
          ref={ref}
          className={cn(
            "border-flat bg-container h-screen fixed top-0 transition-all duration-300",
            position === "left" ? "border-r left-0" : "border-l right-0",
            isCollapsed ? "w-12" : "w-64",
            className,
          )}
          {...props}
        >
          <div
            className={cn("flex flex-col h-full", isCollapsed ? "p-2" : "p-4")}
          >
            {children}
          </div>
        </div>
      </ThreadHistoryContext.Provider>
    );
  },
);
ThreadHistory.displayName = "ThreadHistory";

/**
 * Header component with title and collapse toggle
 */
const ThreadHistoryHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    isCollapsed,
    setIsCollapsed,
    position = "left",
  } = useThreadHistoryContext();

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between mb-4",
        isCollapsed ? "p-1" : "p-2",
        className,
      )}
      {...props}
    >
      {!isCollapsed && (
        <h2 className="text-sm text-muted-foreground">Tambo Conversations</h2>
      )}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "bg-container hover:bg-muted transition-colors p-1 hover:bg-backdrop rounded-md cursor-pointer",
          position === "left" ? "ml-auto" : "",
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ArrowRightToLine
            className={cn("h-4 w-4", position === "right" && "rotate-180")}
          />
        ) : (
          <ArrowLeftToLine
            className={cn("h-4 w-4", position === "right" && "rotate-180")}
          />
        )}
      </button>
    </div>
  );
});
ThreadHistoryHeader.displayName = "ThreadHistory.Header";

/**
 * Button to create a new thread
 */
const ThreadHistoryNewButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ ...props }, ref) => {
  const { isCollapsed, startNewThread, refetch, onThreadChange } =
    useThreadHistoryContext();

  const handleNewThread = React.useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      try {
        await startNewThread();
        await refetch();
        onThreadChange?.();
      } catch (error) {
        console.error("Failed to create new thread:", error);
      }
    },
    [startNewThread, refetch, onThreadChange],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        handleNewThread();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNewThread]);

  return (
    <button
      ref={ref}
      onClick={handleNewThread}
      className={cn(
        "flex items-center gap-2 rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer",
        isCollapsed ? "p-1 justify-center" : "p-2",
      )}
      title="New thread"
      {...props}
    >
      <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white" />
      {!isCollapsed && <span className="text-sm font-medium">New thread</span>}
    </button>
  );
});
ThreadHistoryNewButton.displayName = "ThreadHistory.NewButton";

/**
 * Search input for filtering threads
 */
const ThreadHistorySearch = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed, setIsCollapsed, searchQuery, setSearchQuery } =
    useThreadHistoryContext();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const expandOnSearch = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Wait for animation
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "mb-4",
        isCollapsed ? "flex justify-center" : "relative",
        className,
      )}
      {...props}
    >
      {isCollapsed ? (
        <button
          onClick={expandOnSearch}
          className="p-1 hover:bg-backdrop rounded-md cursor-pointer transition-colors"
          title="Search threads"
        >
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </button>
      ) : (
        <>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-container focus:outline-none"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </>
      )}
    </div>
  );
});
ThreadHistorySearch.displayName = "ThreadHistory.Search";

/**
 * List of thread items
 */
const ThreadHistoryList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    threads,
    isLoading,
    error,
    isCollapsed,
    searchQuery,
    currentThread,
    switchCurrentThread,
    onThreadChange,
  } = useThreadHistoryContext();

  if (isCollapsed) return null;

  // Filter threads based on search query
  const filteredThreads =
    threads?.items?.filter((thread: TamboThread) =>
      thread.id.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  const handleSwitchThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      switchCurrentThread(threadId);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  };

  if (isLoading) {
    return (
      <div
        ref={ref}
        className={cn("text-sm text-muted-foreground p-2", className)}
        {...props}
      >
        Loading threads...
      </div>
    );
  }

  if (error) {
    return (
      <div
        ref={ref}
        className={cn("text-sm text-destructive p-2", className)}
        {...props}
      >
        Error loading threads
      </div>
    );
  }

  if (filteredThreads.length === 0) {
    return (
      <div
        ref={ref}
        className={cn("text-sm text-muted-foreground p-2", className)}
        {...props}
      >
        {searchQuery ? "No matching threads" : "No previous threads"}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("overflow-y-auto flex-1", className)}
      {...props}
    >
      <div className="space-y-1">
        {filteredThreads.map((thread: TamboThread) => (
          <div
            key={thread.id}
            onClick={async () => await handleSwitchThread(thread.id)}
            className={cn(
              "p-2 rounded-md hover:bg-backdrop cursor-pointer",
              currentThread?.id === thread.id ? "bg-muted" : "",
            )}
          >
            <div className="text-sm">
              <span className="font-medium">
                {`Thread ${thread.id.substring(0, 8)}`}
              </span>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {new Date(thread.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
ThreadHistoryList.displayName = "ThreadHistory.List";

export {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
};
