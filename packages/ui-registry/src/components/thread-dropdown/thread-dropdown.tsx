"use client";

import { cn } from "@tambo-ai/ui-registry/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ThreadDropdown as BaseThreadDropdown,
  type ThreadDropdownListItem,
} from "@tambo-ai/react-ui-base";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";

/**
 * Props for the ThreadDropdown component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface ThreadDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional callback function called when the current thread changes */
  onThreadChange?: () => void;
}

/**
 * A component that displays a dropdown menu for managing chat threads with keyboard shortcuts.
 * Composes base ThreadDropdown primitives for thread behavior; adds Radix dropdown styling
 * and keyboard shortcut wiring.
 */
export const ThreadDropdown = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownProps
>(({ className, onThreadChange, ...props }, ref) => {
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const modKey = isMac ? "⌥" : "Alt";
  const newThreadRef = React.useRef<HTMLButtonElement>(null);

  // Registry-level keyboard shortcut: Alt+Shift+N creates a new thread
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        newThreadRef.current?.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <BaseThreadDropdown.Root
      onThreadChange={onThreadChange}
      render={(_renderProps) => (
        <div className={cn("relative", className)} ref={ref} {...props}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <BaseThreadDropdown.Trigger
                render={(triggerProps) => (
                  <button
                    {...triggerProps}
                    type="button"
                    className="rounded-md px-1 flex items-center gap-2 text-sm border border-border bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                )}
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
                side="right"
                align="start"
                sideOffset={5}
              >
                <BaseThreadDropdown.NewThread
                  ref={newThreadRef}
                  render={(newThreadProps) => (
                    <DropdownMenu.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onSelect={(e: Event) => {
                        e.preventDefault();
                        newThreadProps.onClick?.(
                          e as unknown as React.MouseEvent<HTMLButtonElement>,
                        );
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
                  )}
                />

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                <BaseThreadDropdown.Content
                  render={(_contentProps, state) => (
                    <StyledThreadListContent
                      isLoading={state.isLoading}
                      error={state.error}
                      threads={state.threads}
                    />
                  )}
                />
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    />
  );
});
ThreadDropdown.displayName = "ThreadDropdown";

/**
 * Internal component to render thread list content based on loading/error/empty states.
 * Uses base ThreadItem primitives for switch behavior.
 */
function StyledThreadListContent({
  isLoading,
  error,
  threads,
}: {
  isLoading: boolean;
  error: Error | null;
  threads: ThreadDropdownListItem[];
}) {
  if (isLoading) {
    return (
      <DropdownMenu.Item
        className="px-2 py-1.5 text-sm text-muted-foreground"
        disabled
      >
        Loading threads...
      </DropdownMenu.Item>
    );
  }
  if (error) {
    return (
      <DropdownMenu.Item
        className="px-2 py-1.5 text-sm text-destructive"
        disabled
      >
        Error loading threads
      </DropdownMenu.Item>
    );
  }
  if (threads.length === 0) {
    return (
      <DropdownMenu.Item
        className="px-2 py-1.5 text-sm text-muted-foreground"
        disabled
      >
        No previous threads
      </DropdownMenu.Item>
    );
  }
  return (
    <>
      {threads.map((thread) => (
        <BaseThreadDropdown.ThreadItem
          key={thread.id}
          thread={thread}
          render={(itemProps) => (
            <DropdownMenu.Item
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onSelect={(e: Event) => {
                e.preventDefault();
                itemProps.onClick?.(
                  e as unknown as React.MouseEvent<HTMLButtonElement>,
                );
              }}
            >
              <span className="truncate max-w-[180px]">
                {`Thread ${thread.id.substring(0, 8)}`}
              </span>
            </DropdownMenu.Item>
          )}
        />
      ))}
    </>
  );
}
