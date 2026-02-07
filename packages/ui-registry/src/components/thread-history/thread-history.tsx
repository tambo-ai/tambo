"use client";

import { cn } from "@tambo-ai/ui-registry/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type TamboThread, useTamboThread } from "@tambo-ai/react";
import {
  ThreadHistory as ThreadHistoryBase,
  type ThreadHistoryListRenderProps,
} from "@tambo-ai/react-ui-base/thread-history";
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
 * Root component that provides context for thread history.
 * Wraps the base ThreadHistory.Root with Tailwind styling.
 * @returns A styled thread history sidebar
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
    return (
      <ThreadHistoryBase.Root
        ref={ref}
        onThreadChange={onThreadChange}
        defaultCollapsed={defaultCollapsed}
        position={position}
        className={cn(
          "border-flat bg-container h-full transition-all duration-300 flex-none",
          position === "left" ? "border-r" : "border-l",
          className,
        )}
        {...props}
      >
        {({ isCollapsed }) => (
          <div
            className={cn(
              "flex flex-col h-full",
              isCollapsed ? "py-4 px-2" : "p-4",
            )}
          >
            {children}
          </div>
        )}
      </ThreadHistoryBase.Root>
    );
  },
);
ThreadHistory.displayName = "ThreadHistory";

/**
 * Header component with title and collapse toggle.
 * @returns A styled header with collapse toggle button
 */
const ThreadHistoryHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <ThreadHistoryBase.Header
      ref={ref}
      className={cn("flex items-center mb-4 relative p-1", className)}
      {...props}
    >
      {({ isCollapsed, position }) => (
        <>
          <h2
            className={cn(
              "text-sm text-muted-foreground whitespace-nowrap",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden"
                : "opacity-100 max-w-none transition-all duration-300 delay-75",
            )}
          >
            Tambo Conversations
          </h2>
          <ThreadHistoryBase.CollapseToggle
            className={cn(
              "bg-container p-1 hover:bg-backdrop transition-colors rounded-md cursor-pointer absolute flex items-center justify-center",
              position === "left" ? "right-1" : "left-0",
            )}
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
          </ThreadHistoryBase.CollapseToggle>
        </>
      )}
    </ThreadHistoryBase.Header>
  );
});
ThreadHistoryHeader.displayName = "ThreadHistory.Header";

/**
 * Button to create a new thread.
 * @returns A styled button that creates a new thread
 */
const ThreadHistoryNewButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ ...props }, ref) => {
  return (
    <ThreadHistoryBase.NewThreadButton
      ref={ref}
      className={cn(
        "flex items-center rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer relative",
      )}
      {...props}
    >
      {({ isCollapsed }) => (
        <>
          <div className={cn(isCollapsed ? "p-1 mx-auto" : "p-2")}>
            <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white" />
          </div>
          <span
            className={cn(
              "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px]",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                : "opacity-100 transition-all duration-300 delay-100",
            )}
          >
            New thread
          </span>
        </>
      )}
    </ThreadHistoryBase.NewThreadButton>
  );
});
ThreadHistoryNewButton.displayName = "ThreadHistory.NewButton";

/**
 * Search input for filtering threads.
 * @returns A styled search input container
 */
const ThreadHistorySearch = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <ThreadHistoryBase.SearchInput
      ref={ref}
      className={cn("mb-4 relative", className)}
      {...props}
    >
      {({
        isCollapsed,
        searchQuery,
        setSearchQuery,
        expandOnSearch,
        searchInputRef,
      }) => (
        <>
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
            <input
              ref={searchInputRef}
              type="text"
              className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-container focus:outline-none"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </>
      )}
    </ThreadHistoryBase.SearchInput>
  );
});
ThreadHistorySearch.displayName = "ThreadHistory.Search";

/**
 * List of thread items.
 * @returns A styled list of thread items with loading/error/empty states
 */
const ThreadHistoryList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { updateThreadName, generateThreadName } = useTamboThread();

  const [editingThread, setEditingThread] = React.useState<TamboThread | null>(
    null,
  );
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

  return (
    <ThreadHistoryBase.List
      ref={ref}
      className={cn(
        "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
        className,
      )}
      {...props}
    >
      {({
        filteredThreads,
        isLoading,
        error,
        searchQuery,
        isCollapsed,
      }: ThreadHistoryListRenderProps) => {
        if (isCollapsed) {
          return null;
        }

        const handleRename = (thread: TamboThread) => {
          setEditingThread(thread);
          setNewName(thread.name ?? "");
        };

        const handleGenerateName = async (thread: TamboThread) => {
          try {
            await generateThreadName(thread.id);
          } catch (err) {
            console.error("Failed to generate name:", err);
          }
        };

        const handleNameSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!editingThread) return;

          try {
            await updateThreadName(newName, editingThread.id);
            setEditingThread(null);
          } catch (err) {
            console.error("Failed to rename thread:", err);
          }
        };

        if (isLoading) {
          return (
            <div className="text-sm text-muted-foreground p-2">
              Loading threads...
            </div>
          );
        }

        if (error) {
          return (
            <div className="text-sm text-destructive p-2 whitespace-nowrap">
              Error loading threads
            </div>
          );
        }

        if (filteredThreads.length === 0) {
          return (
            <div className="text-sm text-muted-foreground p-2 whitespace-nowrap">
              {searchQuery ? "No matching threads" : "No previous threads"}
            </div>
          );
        }

        return (
          <div className="space-y-1">
            {filteredThreads.map((thread: TamboThread) => (
              <ThreadHistoryBase.Item
                key={thread.id}
                thread={thread}
                className={cn(
                  "p-2 rounded-md hover:bg-backdrop cursor-pointer group flex items-center justify-between",
                  editingThread?.id === thread.id ? "bg-muted" : "",
                )}
              >
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex items-center justify-between w-full",
                      isActive ? "bg-muted rounded-md" : "",
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
                            {thread.name ??
                              `Thread ${thread.id.substring(0, 8)}`}
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
                      onGenerateName={handleGenerateName}
                    />
                  </div>
                )}
              </ThreadHistoryBase.Item>
            ))}
          </div>
        );
      }}
    </ThreadHistoryBase.List>
  );
});
ThreadHistoryList.displayName = "ThreadHistory.List";

/**
 * Dropdown menu component for thread actions.
 * @returns A dropdown menu with rename and generate name options
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
          className="p-1 hover:bg-backdrop rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => e.stopPropagation()}
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
          <DropdownMenu.Item
            className="flex items-center gap-2 px-2 py-1.5 text-foreground hover:bg-backdrop rounded-sm cursor-pointer outline-none transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateName(thread);
            }}
          >
            <Sparkles className="h-3 w-3" />
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
