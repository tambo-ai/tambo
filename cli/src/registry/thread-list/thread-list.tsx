"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { TamboThread } from "@tambo-ai/react";

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

/**
 * Represents a thread list component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof threadListVariants>["variant"]} variant - Optional variant for custom styling
 */

type Thread = Omit<TamboThread, "messages">;

export interface ThreadListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof threadListVariants> {
  threads: Thread[];
  selectedThreadId?: string | null;
  onThreadSelect?: (threadId: string) => void;
  isLoading?: boolean;
}

const ThreadList = React.forwardRef<HTMLDivElement, ThreadListProps>(
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

export { ThreadList, threadListVariants };
