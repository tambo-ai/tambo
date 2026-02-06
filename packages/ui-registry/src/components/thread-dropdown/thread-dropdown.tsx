"use client";

import {
  ThreadDropdown as ThreadDropdownBase,
  useThreadDropdownContext,
  type ThreadDropdownRootProps,
} from "@tambo-ai/react-ui-base/thread-dropdown";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@tambo-ai/ui-registry/utils";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";

/**
 * Props for the ThreadDropdown component.
 */
export type ThreadDropdownProps = ThreadDropdownRootProps;

/**
 * A styled component that displays a dropdown menu for managing chat threads
 * with keyboard shortcuts. Wraps the headless ThreadDropdown base components
 * with Radix DropdownMenu and Tailwind styling.
 * @component
 * @example
 * ```tsx
 * <ThreadDropdown
 *   onThreadChange={() => console.log('Thread changed')}
 *   className="custom-styles"
 * />
 * ```
 * @returns The styled thread dropdown component
 */
export const ThreadDropdown = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownProps
>(({ className, onThreadChange, ...props }, ref) => {
  return (
    <ThreadDropdownBase.Root
      ref={ref}
      className={cn("relative", className)}
      onThreadChange={onThreadChange}
      {...props}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <ThreadDropdownBase.Trigger
            className="rounded-md px-1 flex items-center gap-2 text-sm border border-border bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            aria-label="Thread History"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </ThreadDropdownBase.Trigger>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
            side="right"
            align="start"
            sideOffset={5}
          >
            <ThreadDropdownBase.NewThreadItem
              render={({ shortcutLabel, onSelect }) => (
                <DropdownMenu.Item
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onSelect={(e: Event) => {
                    e.preventDefault();
                    onSelect();
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
                    {shortcutLabel}
                  </span>
                </DropdownMenu.Item>
              )}
            />

            <DropdownMenu.Separator className="my-1 h-px bg-border" />

            <StyledThreadListContent />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </ThreadDropdownBase.Root>
  );
});
ThreadDropdown.displayName = "ThreadDropdown";

/**
 * Internal component to render thread list content based on loading/error/empty states.
 * Consumes the ThreadDropdown context to access thread data.
 * @returns The styled thread list content
 */
function StyledThreadListContent() {
  const { threads, isLoading, error, onSwitchThread } =
    useThreadDropdownContext();

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
        <DropdownMenu.Item
          key={thread.id}
          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          onSelect={(e: Event) => {
            e.preventDefault();
            onSwitchThread(thread.id);
          }}
        >
          <span className="truncate max-w-[180px]">
            {`Thread ${thread.id.substring(0, 8)}`}
          </span>
        </DropdownMenu.Item>
      ))}
    </>
  );
}
