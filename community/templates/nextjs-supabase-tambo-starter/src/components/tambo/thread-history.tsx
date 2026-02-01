"use client";

import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  type TamboThread,
  useTamboThread,
  useTamboThreadList,
} from "@tambo-ai/react";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  MoreHorizontal,
  Pencil,
  PlusIcon,
  SearchIcon,
  Sparkles,
} from "lucide-react";
import React from "react";

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
  position?: "left" | "right";
  updateThreadName: (newName: string, threadId?: string) => Promise<void>;
  generateThreadName: (threadId: string) => Promise<TamboThread>;
}

const ThreadHistoryContext =
  React.createContext<ThreadHistoryContextValue | null>(null);

export const useThreadHistoryContext = () => {
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
  onThreadChange?: () => void;
  children?: React.ReactNode;
  defaultCollapsed?: boolean;
  position?: "left" | "right";
}

const ThreadHistory = React.forwardRef<HTMLDivElement, ThreadHistoryProps>(
  (
    {
      className,
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

    const { data: threads, isLoading, error, refetch } = useTamboThreadList();

    const {
      switchCurrentThread,
      startNewThread,
      thread: currentThread,
      updateThreadName,
      generateThreadName,
    } = useTamboThread();

    React.useEffect(() => {
      const sidebarWidth = isCollapsed ? "3rem" : "16rem";
      document.documentElement.style.setProperty(
        "--sidebar-width",
        sidebarWidth,
      );
    }, [isCollapsed]);

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
        position,
        updateThreadName,
        generateThreadName,
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
      ],
    );

    return (
      <ThreadHistoryContext.Provider
        value={contextValue as ThreadHistoryContextValue}
      >
        <div
          ref={ref}
          className={cn(
            "h-full flex-none transition-[width] duration-200 ease-out",
            "bg-[#0a0b0d]",
            "border-r border-white/10",
            isCollapsed ? "w-12" : "w-64",
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "flex flex-col h-full relative",
              isCollapsed ? "py-4 px-2" : "p-4",
            )}
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
      className={cn("flex items-center mb-4 relative", "p-1", className)}
      {...props}
    >
      <h2
        className={cn(
          "text-xs font-semibold uppercase tracking-widest text-[#9aa0a6]",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden"
            : "opacity-100 transition-opacity duration-150 delay-30",
        )}
      >
        Tambo Conversations
      </h2>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute flex items-center justify-center",
          "w-8 h-8",
          "bg-[#111]",
          "border border-white/10",
          "text-[#9aa0a6]",
          "hover:text-white hover:border-white/20",
          "transition-colors",
          position === "left" ? "right-0" : "left-0",
          "rounded-md",
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
        void handleNewThread();
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
        `
      relative flex items-center mb-5
      rounded-md
      bg-[#0f1115]
      border border-white/10
      text-[#9aa0a6]
      hover:text-white hover:border-white/20
      transition-colors
      `,
        isCollapsed ? "p-2 justify-center" : "px-3 py-2 gap-2",
      )}
      title="New thread"
      {...props}
    >
      <PlusIcon className="h-4 w-4 rounded-full" />
      <span
        className={cn(
          "text-xs uppercase tracking-widest whitespace-nowrap",
          isCollapsed
            ? "opacity-0 w-0 overflow-hidden"
            : "opacity-100 transition-opacity duration-150",
        )}
      >
        New thread
      </span>
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
      }, 300);
    }
  };

  return (
    <div ref={ref} className={cn("mb-3 relative", className)} {...props}>
      {/* Collapsed icon */}
      <button
        onClick={expandOnSearch}
        className={cn(
          `
        absolute inset-x-0 mx-auto
        w-8 h-8
        cursor-pointer
        flex items-center justify-center
        rounded-md
        bg-[#0f1115]
        border border-white/10
        text-[#9aa0a6]
        hover:text-white hover:border-white/20
        transition-colors
        `,
          isCollapsed
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        title="Search threads"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      {/* Expanded input */}
      <div
        className={cn(
          "transition-opacity duration-150",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
          <input
            ref={searchInputRef}
            type="text"
            className="
            w-full pl-10 pr-3 py-2 text-sm
            rounded-md
            bg-[#0f1115]
            border border-white/10
            text-white placeholder:text-[#6b7280]
            focus:outline-none
            focus:border-white/20
          "
            placeholder="Search threads"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
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
    updateThreadName,
    generateThreadName,
    refetch,
  } = useThreadHistoryContext();

  const [editingThread, setEditingThread] = React.useState<TamboThread | null>(
    null,
  );
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingThread &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setEditingThread(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingThread]);

  React.useEffect(() => {
    if (editingThread) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editingThread]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingThread(null);
    }
  };

  const filteredThreads = React.useMemo(() => {
    if (isCollapsed) return [];
    if (!threads?.items) return [];

    const query = searchQuery.toLowerCase();
    return threads.items.filter((thread: TamboThread) => {
      const nameMatches = thread.name?.toLowerCase().includes(query) ?? false;
      const idMatches = thread.id.toLowerCase().includes(query);
      return idMatches || nameMatches;
    });
  }, [isCollapsed, threads, searchQuery]);

  const handleSwitchThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      switchCurrentThread(threadId);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  };

  const handleRename = (thread: TamboThread) => {
    setEditingThread(thread);
    setNewName(thread.name ?? "");
  };

  const handleGenerateName = async (thread: TamboThread) => {
    try {
      await generateThreadName(thread.id);
      await refetch();
    } catch (error) {
      console.error("Failed to generate name:", error);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread) return;

    try {
      await updateThreadName(newName, editingThread.id);
      await refetch();
      setEditingThread(null);
    } catch (error) {
      console.error("Failed to rename thread:", error);
    }
  };

  let content;
  if (isLoading) {
    content = (
      <div ref={ref} className={cn("p-2 text-sm", className)} {...props}>
        Loading threads…
      </div>
    );
  } else if (error) {
    content = (
      <div
        ref={ref}
        className={cn(
          "p-2 text-sm whitespace-nowrap",
          isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100",
          className,
        )}
        {...props}
      >
        Error loading threads
      </div>
    );
  } else if (filteredThreads.length === 0) {
    content = (
      <div
        ref={ref}
        className={cn(
          "p-2 text-sm whitespace-nowrap",
          isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100",
          className,
        )}
        {...props}
      >
        {searchQuery ? "No matching threads" : "No previous threads"}
      </div>
    );
  } else {
    content = (
      <div className="space-y-1">
        {filteredThreads.map((thread: TamboThread) => (
          <div
            key={thread.id}
            onClick={async () => await handleSwitchThread(thread.id)}
            className={cn(
              `
             group flex items-center justify-between
             rounded-md px-3 py-2 cursor-pointer
            bg-[#0f1115]
            border border-white/5
            transition-colors
             hover:bg-[#141821]
              `,
              currentThread?.id === thread.id &&
                "bg-[#141821] border-l-2 border-l-orange-500",
              editingThread?.id === thread.id &&
                "bg-[#10191a] border-l-2 border-l-emerald-400",
            )}
          >
            <div className="flex-1 text-sm min-w-0">
              {editingThread?.id === thread.id ? (
                <form
                  onSubmit={handleNameSubmit}
                  className="flex flex-col gap-1"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Thread name…"
                    className="
                      w-full px-1 py-0.5 text-sm
                      bg-black/60 backdrop-blur-md
                      border border-emerald-400/30
                      rounded-md
                      text-emerald-300
                      focus:outline-none
                    "
                  />
                  <p className="text-xs truncate">
                    {new Date(thread.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </form>
              ) : (
                <>
                  <span className="font-medium line-clamp-1 text-white">
                    {thread.name ?? `Thread ${thread.id.substring(0, 8)}`}
                  </span>
                  <p className="mt-1 text-xs text-[#9aa0a6] truncate">
                    {new Date(thread.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </>
              )}
            </div>

            <ThreadOptionsDropdown
              thread={thread}
              onRename={handleRename}
              onGenerateName={handleGenerateName}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-0">
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 overflow-y-auto transition-opacity duration-300 ease-in-out",
        isCollapsed
          ? "opacity-0 overflow-hidden pointer-events-none"
          : "opacity-100 pointer-events-auto",
        className,
        /* Vertical scrollbar (neutral, ops-safe) */
        "[&::-webkit-scrollbar]:w-[6px]",
        "[&::-webkit-scrollbar-thumb]:bg-orange-500/40",
        "[&::-webkit-scrollbar-thumb]  :rounded-full",
        "[&::-webkit-scrollbar-track]:bg-transparent",


        /* Horizontal scrollbar */
        "[&::-webkit-scrollbar:horizontal]:h-[2px]",
      )}
      {...props}
    >
      {content}
    </div>
    </div>
  );
});
ThreadHistoryList.displayName = "ThreadHistory.List";

/**
 * Dropdown menu component for thread actions
 */
const ThreadOptionsDropdown = ({
  thread,
  onRename,
  onGenerateName,
}: {
  thread: TamboThread;
  onRename: (thread: TamboThread) => void;
  onGenerateName: (thread: TamboThread) => void;
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="
  p-1 rounded-md cursor-pointer
  opacity-0 group-hover:opacity-100
  bg-[#0f1115]
  border border-white/10
  text-[#9aa0a6]
  transition-opacity
  hover:bg-[#1a1f2b]
"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4 text-[#9aa0a6]" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="end"
          className="
  z-50 min-w-[180px]
  rounded-md p-1
  bg-[#0f1115]
  border border-white/10
  shadow-lg
"
        >
          <DropdownMenu.Item
            className="
  flex items-center gap-2
  px-3 py-2 text-xs
  rounded-sm cursor-pointer outline-none
  text-white
  hover:bg-[#1a1f2b]
"
            onClick={(e) => {
              e.stopPropagation();
              onRename(thread);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-[#9aa0a6]" />
            Rename
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="
         flex items-center gap-2
         px-3 py-2 text-xs
         rounded-sm cursor-pointer outline-none
          text-[#c5c7c9]
          hover:bg-[#1a1f2b]
"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateName(thread);
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#8ab4f8]" />
            Generate Name
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadOptionsDropdown,
};
