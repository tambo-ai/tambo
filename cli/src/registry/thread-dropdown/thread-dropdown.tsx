"use client";

import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";

/**
 * Props for the ThreadDropdown component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface ThreadDropdownRootProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenu.Root> {
  contextKey?: string;
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
interface ThreadDropdownContextType {
  contextKey?: string;
  onThreadChange?: () => void;
}
const ThreadDropdownContext = React.createContext<ThreadDropdownContextType>(
  {},
);

const ThreadDropdownRoot = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownRootProps
>(({ contextKey, onThreadChange, children, ...props }, ref) => {
  return (
    <ThreadDropdownContext.Provider value={{ contextKey, onThreadChange }}>
      <DropdownMenu.Root {...props}>
        <div ref={ref} className={cn("relative")}>
          {children}
        </div>
      </DropdownMenu.Root>
    </ThreadDropdownContext.Provider>
  );
});
ThreadDropdownRoot.displayName = "ThreadDropdown.Root";

const ThreadDropdownTrigger = DropdownMenu.Trigger;

const baseItemClass =
  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

const ThreadDropdownSeparator = (
  props: React.ComponentPropsWithoutRef<typeof DropdownMenu.Separator>,
) => (
  <DropdownMenu.Separator
    className={cn("my-1 h-px bg-gray-200", props.className)}
    {...props}
  />
);

const ThreadDropdownItem = (
  props: React.ComponentPropsWithoutRef<typeof DropdownMenu.Item>,
) => (
  <DropdownMenu.Item
    className={cn(baseItemClass, props.className)}
    {...props}
  />
);

const ThreadDropdownContent = (
  props: React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>,
) => (
  <DropdownMenu.Content
    className={cn(
      "z-50 min-w-[200px] overflow-hidden rounded-md border border-gray-200 bg-popover p-1 text-popover-foreground shadow-md",
      props.className,
    )}
    sideOffset={5}
    {...props}
  />
);

// Opinionated menu content that lists threads and "new thread" action
const ThreadDropdownAutoContent: React.FC<
  { className?: string } & React.ComponentPropsWithoutRef<
    typeof DropdownMenu.Content
  >
> = ({ className, ...props }) => {
  const { contextKey, onThreadChange } = React.useContext(
    ThreadDropdownContext,
  );
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
      if (e) e.stopPropagation();
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

  const handleSwitchThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      switchCurrentThread(threadId);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  };

  return (
    <ThreadDropdownContent className={className} {...props}>
      <ThreadDropdownItem
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
      </ThreadDropdownItem>
      <ThreadDropdownSeparator />
      {isLoading ? (
        <ThreadDropdownItem disabled>Loading threads...</ThreadDropdownItem>
      ) : error ? (
        <ThreadDropdownItem disabled className="text-destructive">
          Error loading threads
        </ThreadDropdownItem>
      ) : threads?.items.length === 0 ? (
        <ThreadDropdownItem disabled>No previous threads</ThreadDropdownItem>
      ) : (
        threads?.items.map((thread) => (
          <ThreadDropdownItem
            key={thread.id}
            onSelect={(e: Event) => {
              e.preventDefault();
              handleSwitchThread(thread.id);
            }}
          >
            <span className="truncate max-w-[180px]">{`Thread ${thread.id.substring(0, 8)}`}</span>
          </ThreadDropdownItem>
        ))
      )}
    </ThreadDropdownContent>
  );
};

export {
  ThreadDropdownAutoContent as ThreadDropdownAutoContent,
  ThreadDropdownContent as ThreadDropdownContent,
  ThreadDropdownItem as ThreadDropdownItem,
  ThreadDropdownRoot as ThreadDropdownRoot,
  ThreadDropdownSeparator as ThreadDropdownSeparator,
  ThreadDropdownTrigger as ThreadDropdownTrigger,
};
