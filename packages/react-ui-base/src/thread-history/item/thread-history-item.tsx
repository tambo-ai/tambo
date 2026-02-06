import { Slot } from "@radix-ui/react-slot";
import type { TamboThread } from "@tambo-ai/react";
import * as React from "react";
import { useThreadHistoryRootContext } from "../root/thread-history-root-context";

/**
 * Props passed to the Item render function.
 */
export interface ThreadHistoryItemRenderProps {
  /** Whether this thread is the currently active thread. */
  isActive: boolean;
}

export interface ThreadHistoryItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** The thread to display. */
  thread: TamboThread;
  /** Children as ReactNode or render function receiving item state. */
  children?:
    | React.ReactNode
    | ((props: ThreadHistoryItemRenderProps) => React.ReactNode);
}

/**
 * Item primitive for a single thread entry in the thread history list.
 * Handles click-to-switch and provides data attributes for active state.
 * Accepts children as a render function to access isActive state.
 * @returns A clickable thread item element
 */
export const ThreadHistoryItem = React.forwardRef<
  HTMLDivElement,
  ThreadHistoryItemProps
>(function ThreadHistoryItem({ thread, children, asChild, ...props }, ref) {
  const { currentThread, switchCurrentThread, onThreadChange } =
    useThreadHistoryRootContext();

  const isActive = currentThread?.id === thread.id;

  const handleClick = React.useCallback(async () => {
    try {
      switchCurrentThread(thread.id);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  }, [switchCurrentThread, thread.id, onThreadChange]);

  const Comp = asChild ? Slot : "div";

  const renderedChildren =
    typeof children === "function" ? children({ isActive }) : children;

  return (
    <Comp
      ref={ref}
      data-slot="thread-history-item"
      data-active={isActive || undefined}
      data-thread-id={thread.id}
      onClick={handleClick}
      {...props}
    >
      {renderedChildren}
    </Comp>
  );
});
