"use client";

import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";

/**
 * Props for the ThreadDropdown component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface ThreadDropdownProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional context key for filtering threads */
  contextKey?: string;
  /** Optional callback function called when the current thread changes */
  onThreadChange?: () => void;
}

/**
 * A component that displays a dropdown menu for managing chat threads with keyboard shortcuts
 * @component
 * @example
 * ```tsx
 * <ThreadDropdown
 *   contextKey="my-thread"
 *   onThreadChange={() => console.log('Thread changed')}
 *   className="custom-styles"
 * />
 * ```
 */
export const ThreadDropdown = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownProps
>(({ className, contextKey, onThreadChange, ...props }, ref) => {
  const {
    data: threads,
    isLoading,
    error,
    refetch,
  } = useTamboThreadList({ contextKey });
  const { switchCurrentThread, startNewThread } = useTamboThread();
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const modKey = isMac ? "⌥" : "Alt";

  const handleNewThread = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      try {
        await startNewThread();
        await refetch();
        onThreadChange?.();
      } catch (error) {
        console.error("Failed to create new thread:", error);
      }
    },
    [onThreadChange, startNewThread, refetch],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        handleNewThread();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNewThread]);

  const handleSwitchThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      switchCurrentThread(threadId);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  };

  return (
    <div className={cn("relative", className)} ref={ref} {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div
            role="button"
            tabIndex={0}
            className="rounded-md px-1 flex items-center gap-2 text-sm border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            aria-label="Thread History"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[200px] overflow-hidden rounded-md border border-gray-200 bg-popover p-1 text-popover-foreground shadow-md"
            side="right"
            align="start"
            sideOffset={5}
          >
            <DropdownMenu.Item
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onSelect={(e: Event) => {
                e.preventDefault();
                handleNewThread();
              }}
            >
              <div className="flex items-center">
                <PlusIcon className="mr-2 h-4 w-4" />
                <span>New Thread</span>
              </div>
              <span
                className="ml-auto text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {modKey}+⇧+N
              </span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

            {isLoading ? (
              <DropdownMenu.Item
                className="px-2 py-1.5 text-sm text-muted-foreground"
                disabled
              >
                Loading threads...
              </DropdownMenu.Item>
            ) : error ? (
              <DropdownMenu.Item
                className="px-2 py-1.5 text-sm text-destructive"
                disabled
              >
                Error loading threads
              </DropdownMenu.Item>
            ) : threads?.items.length === 0 ? (
              <DropdownMenu.Item
                className="px-2 py-1.5 text-sm text-muted-foreground"
                disabled
              >
                No previous threads
              </DropdownMenu.Item>
            ) : (
              threads?.items.map((thread) => (
                <DropdownMenu.Item
                  key={thread.id}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onSelect={(e: Event) => {
                    e.preventDefault();
                    handleSwitchThread(thread.id);
                  }}
                >
                  <span className="truncate max-w-[180px]">
                    {`Thread ${thread.id.substring(0, 8)}`}
                  </span>
                </DropdownMenu.Item>
              ))
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
});
ThreadDropdown.displayName = "ThreadDropdown";
