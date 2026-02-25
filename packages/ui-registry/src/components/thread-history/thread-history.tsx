"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ThreadHistory as BaseThreadHistory,
  type ThreadListItem,
} from "@tambo-ai/react-ui-base";
import { cn } from "@tambo-ai/ui-registry/utils";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  MoreHorizontal,
  Pencil,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import React from "react";

/**
 * Styled context for collapse/position state (presentation concerns only).
 */
interface StyledThreadHistoryContextValue {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  position: "left" | "right";
}

const StyledThreadHistoryContext =
  React.createContext<StyledThreadHistoryContextValue | null>(null);

const useStyledThreadHistoryContext = () => {
  const context = React.useContext(StyledThreadHistoryContext);
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
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    // Update CSS variable when sidebar collapses/expands
    React.useEffect(() => {
      const sidebarWidth = isCollapsed ? "3rem" : "16rem";
      document.documentElement.style.setProperty(
        "--sidebar-width",
        sidebarWidth,
      );
    }, [isCollapsed]);

    const styledContextValue = React.useMemo(
      () => ({ isCollapsed, setIsCollapsed, position }),
      [isCollapsed, position],
    );

    return (
      <StyledThreadHistoryContext.Provider value={styledContextValue}>
        <BaseThreadHistory.Root
          onThreadChange={onThreadChange}
          render={(renderProps) => (
            <div
              ref={ref}
              className={cn(
                "bg-container h-full transition-all duration-300 flex-none",
                position === "left" ? "border-r" : "border-l",
                isCollapsed ? "w-12" : "w-64",
                className,
              )}
              {...renderProps}
              {...props}
            >
              <div
                className={cn(
                  "flex flex-col h-full",
                  isCollapsed ? "py-4 px-2" : "p-4",
                )}
              >
                {children}
              </div>
            </div>
          )}
        />
      </StyledThreadHistoryContext.Provider>
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
  const { isCollapsed, setIsCollapsed, position } =
    useStyledThreadHistoryContext();

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center mb-4 relative",
        isCollapsed ? "p-1" : "p-1",
        className,
      )}
      {...props}
    >
      <h2
        className={cn(
          "text-sm text-muted-foreground whitespace-nowrap ",
          position === "left" ? "mr-8" : "ml-8",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden "
            : "opacity-100 max-w-none transition-all duration-300 delay-75",
        )}
      >
        Tambo Conversations
      </h2>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          `bg-container p-1 hover:bg-backdrop transition-colors rounded-md cursor-pointer absolute flex items-center justify-center`,
          position === "left" ? "right-1" : "left-0",
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
  const { isCollapsed } = useStyledThreadHistoryContext();

  return (
    <BaseThreadHistory.NewThreadButton
      ref={ref}
      render={(renderProps) => (
        <button
          {...renderProps}
          className={cn(
            "flex items-center rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer relative",
            isCollapsed ? "p-1 justify-center" : "p-2 gap-2",
          )}
          title="New thread"
          {...props}
        >
          <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white" />
          <span
            className={cn(
              "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px] ",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                : "opacity-100 transition-all duration-300 delay-100",
            )}
          >
            New thread
          </span>
        </button>
      )}
    />
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
  const { isCollapsed, setIsCollapsed } = useStyledThreadHistoryContext();
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
    <div ref={ref} className={cn("mb-4 relative", className)} {...props}>
      {/* Visible when collapsed */}
      <button
        onClick={expandOnSearch}
        className={cn(
          "p-1 hover:bg-backdrop rounded-md cursor-pointer absolute left-1/2 -translate-x-1/2",
          isCollapsed
            ? "opacity-100 pointer-events-auto transition-all duration-300"
            : "opacity-0 pointer-events-none",
        )}
        title="Search threads"
      >
        <SearchIcon className="h-4 w-4 text-gray-400" />
      </button>

      {/* Visible when expanded with delay */}
      <div
        className={cn(
          isCollapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-100 delay-100 transition-all duration-500",
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <BaseThreadHistory.Search
          ref={searchInputRef}
          className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-container focus:outline-none"
          placeholder="Search..."
        />
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
  const { isCollapsed } = useStyledThreadHistoryContext();

  const [editingThread, setEditingThread] =
    React.useState<ThreadListItem | null>(null);
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle click outside name editing input
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

  // Focus input when entering edit mode
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

  const handleRename = (thread: ThreadListItem) => {
    setEditingThread(thread);
    setNewName(`Thread ${thread.id.substring(0, 8)}`);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread) return;

    // TODO(tambo): Wire thread rename submission once backend rename API is available.
    setEditingThread(null);
  };

  return (
    <BaseThreadHistory.List
      render={(_renderProps, state) => {
        // While collapsed we do not need the list, avoid extra work.
        if (isCollapsed) {
          return (
            <div
              ref={ref}
              className={cn(
                "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
                "opacity-0 max-h-0 overflow-hidden pointer-events-none",
                className,
              )}
              {...props}
            />
          );
        }

        let content;
        if (state.isLoading) {
          content = (
            <div className={cn("text-sm text-muted-foreground p-2")}>
              Loading threads...
            </div>
          );
        } else if (state.hasError) {
          content = (
            <div className="text-sm text-destructive p-2 whitespace-nowrap">
              Error loading threads
            </div>
          );
        } else if (state.isEmpty) {
          content = (
            <div className="text-sm text-muted-foreground p-2 whitespace-nowrap">
              {state.searchQuery
                ? "No matching threads"
                : "No previous threads"}
            </div>
          );
        } else {
          content = (
            <div className="space-y-1">
              {state.filteredThreads.map((thread: ThreadListItem) => (
                <BaseThreadHistory.Item
                  key={thread.id}
                  thread={thread}
                  render={(itemProps, itemState) => (
                    <div
                      {...itemProps}
                      className={cn(
                        "p-2 rounded-md hover:bg-backdrop cursor-pointer group flex items-center justify-between",
                        itemState.isActive ? "bg-muted" : "",
                        editingThread?.id === thread.id ? "bg-muted" : "",
                      )}
                    >
                      <div className="text-sm flex-1">
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
                              className="w-full bg-background px-1 text-sm font-medium focus:outline-none rounded-sm"
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Thread name..."
                            />
                            <p className="text-xs text-muted-foreground truncate">
                              {new Date(thread.createdAt).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </form>
                        ) : (
                          <>
                            <span className="font-medium line-clamp-1">
                              {`Thread ${thread.id.substring(0, 8)}`}
                            </span>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {new Date(thread.createdAt).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </>
                        )}
                      </div>
                      <ThreadOptionsDropdown
                        thread={thread}
                        onRename={handleRename}
                      />
                    </div>
                  )}
                />
              ))}
            </div>
          );
        }

        return (
          <div
            ref={ref}
            className={cn(
              "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
              "opacity-100 max-h-full pointer-events-auto",
              className,
            )}
            {...props}
          >
            {content}
          </div>
        );
      }}
    />
  );
});
ThreadHistoryList.displayName = "ThreadHistory.List";

/**
 * Dropdown menu component for thread actions
 */
const ThreadOptionsDropdown = ({
  thread,
  onRename,
}: {
  thread: ThreadListItem;
  onRename: (thread: ThreadListItem) => void;
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 hover:bg-backdrop rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Thread actions"
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] text-xs bg-popover rounded-md p-1 shadow-md border border-border"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-2 py-1.5 text-foreground hover:bg-backdrop rounded-sm cursor-pointer outline-none transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRename(thread);
            }}
          >
            <Pencil className="h-3 w-3" />
            Rename
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
