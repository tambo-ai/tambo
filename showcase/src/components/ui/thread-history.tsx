"use client";

import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";

/**
 * Represents the history of threads
 * @property {string} className - Optional className for custom styling
 * @property {string} contextKey - The context key for the thread
 * @property {function} onThreadChange - The function to call when the thread changes
 */
export interface ThreadHistoryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  onThreadChange?: () => void;
}

export function ThreadHistory({
  className,
  contextKey,
  onThreadChange,
  ...props
}: ThreadHistoryProps) {
  const {
    data: threads,
    isLoading,
    error,
    refetch,
  } = useTamboThreadList({ contextKey });
  const { switchCurrentThread, startNewThread } = useTamboThread();
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    const isMacOS =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");
    setIsMac(isMacOS);
  }, []);

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
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div
            role="button"
            tabIndex={0}
            className="rounded-md px-1 flex items-center gap-2 text-sm border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            aria-label="Thread History"
          >
            <PlusIcon className="h-4 w-4" />
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
              <span className="ml-auto text-xs text-muted-foreground">
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
}
