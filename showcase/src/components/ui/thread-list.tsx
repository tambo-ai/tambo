import * as React from "react"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const threadListVariants = cva(
  "flex flex-col w-full",
  {
    variants: {
      variant: {
        default: "",
        solid: [
          "[&>div]:shadow [&>div]:shadow-zinc-900/10 [&>div]:dark:shadow-zinc-900/20",
          "[&>div]:bg-zinc-50 [&>div]:dark:bg-zinc-900",
        ].join(" "),
        bordered: [
          "[&>div]:border",
          "[&>div]:border-zinc-200/40 [&>div]:dark:border-zinc-700/40",
        ].join(" "),
      },
      size: {
        default: "gap-4",
        compact: "gap-2",
        relaxed: "gap-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface Thread {
  id: string
  title: string
  lastMessage?: string
  timestamp?: string
  unread?: boolean
}

export interface ThreadListProps extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof threadListVariants> {
  threads: Thread[]
  onThreadSelect?: (threadId: string) => void
}

const ThreadList = React.forwardRef<HTMLDivElement, ThreadListProps>(
  ({ className, variant, size, threads, onThreadSelect, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(threadListVariants({ variant, size }), className)}
        {...props}
      >
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onThreadSelect?.(thread.id)}
            className={cn(
              "p-4 rounded-lg cursor-pointer transition-colors",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              thread.unread && "bg-zinc-50 dark:bg-zinc-800/50"
            )}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{thread.title}</h3>
              {thread.timestamp && (
                <span className="text-sm text-zinc-500">{thread.timestamp}</span>
              )}
            </div>
            {thread.lastMessage && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
                {thread.lastMessage}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }
)
ThreadList.displayName = "ThreadList"

export { ThreadList, threadListVariants } 