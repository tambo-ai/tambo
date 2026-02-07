import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useThreadHistoryRootContext } from "../root/thread-history-root-context";

/**
 * Props passed to the NewThreadButton render function.
 */
export interface ThreadHistoryNewThreadButtonRenderProps {
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
}

export interface ThreadHistoryNewThreadButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Children as ReactNode or render function receiving button state. */
  children?:
    | React.ReactNode
    | ((props: ThreadHistoryNewThreadButtonRenderProps) => React.ReactNode);
}

/**
 * New thread button primitive for the thread history sidebar.
 * Creates a new thread when clicked and supports Alt+Shift+N keyboard shortcut.
 * Accepts children as a render function to access isCollapsed state.
 * @returns A button element that creates a new thread on click
 */
export const ThreadHistoryNewThreadButton = React.forwardRef<
  HTMLButtonElement,
  ThreadHistoryNewThreadButtonProps
>(function ThreadHistoryNewThreadButton({ children, asChild, ...props }, ref) {
  const { isCollapsed, startNewThread, refetch, onThreadChange } =
    useThreadHistoryRootContext();

  const handleNewThread = React.useCallback(
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
    [startNewThread, refetch, onThreadChange],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        void handleNewThread();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNewThread]);

  const Comp = asChild ? Slot : "button";

  const renderedChildren =
    typeof children === "function" ? children({ isCollapsed }) : children;

  return (
    <Comp
      ref={ref}
      data-slot="thread-history-new-thread-button"
      data-collapsed={isCollapsed || undefined}
      onClick={handleNewThread}
      title="New thread"
      {...props}
    >
      {renderedChildren}
    </Comp>
  );
});
