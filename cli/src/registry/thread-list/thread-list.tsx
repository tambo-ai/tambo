"use client";

import { cn } from "@/lib/utils";
import type { TamboThread } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const threadListVariants = cva("flex flex-col w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:shadow [&>div]:shadow-zinc-900/10 [&>div]:dark:shadow-zinc-900/20",
        "[&>div]:bg-muted",
      ].join(" "),
      bordered: ["[&>div]:border", "[&>div]:border-border"].join(" "),
    },
    size: {
      default: "gap-4",
      compact: "gap-2",
      relaxed: "gap-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type Thread = Omit<TamboThread, "messages">;

/**
 * Props for the ThreadList component
 * @interface
 */
export interface ThreadListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof threadListVariants> {
  /** Array of thread objects to display */
  threads: Thread[];
  /** ID of the currently selected thread */
  selectedThreadId?: string | null;
  /** Callback function called when a thread is selected */
  onThreadSelect?: (threadId: string) => void;
  /** Whether the list is in a loading state */
  isLoading?: boolean;
}

/**
 * A component that displays a list of chat threads with selection functionality
 * @component
 * @example
 * ```tsx
 * <ThreadList
 *   threads={threads}
 *   selectedThreadId="thread-123"
 *   onThreadSelect={(id) => console.log('Selected thread:', id)}
 *   variant="solid"
 *   size="compact"
 *   className="custom-styles"
 * />
 * ```
 */
export const ThreadList = React.forwardRef<HTMLDivElement, ThreadListProps>(
  (
    {
      className,
      variant,
      size,
      threads,
      selectedThreadId,
      onThreadSelect,
      isLoading,
      ...props
    },
    ref,
  ) => {
    if (threads.length === 0 && !isLoading) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No threads found
        </p>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(threadListVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading && (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        )}
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onThreadSelect?.(thread.id)}
            className={cn(
              "p-4 rounded-lg cursor-pointer transition-colors",
              "hover:bg-muted/80",
              selectedThreadId === thread.id && "bg-muted",
            )}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-foreground">
                {`Thread ${thread.id.substring(0, 8)}`}
              </h3>
              <span className="text-sm text-muted-foreground">
                {new Date(thread.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  },
);
ThreadList.displayName = "ThreadList";

export { threadListVariants };
