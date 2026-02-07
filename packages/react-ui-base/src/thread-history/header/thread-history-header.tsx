import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useThreadHistoryRootContext } from "../root/thread-history-root-context";

/**
 * Props passed to the Header render function.
 */
export interface ThreadHistoryHeaderRenderProps {
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
  /** Position of the sidebar. */
  position: "left" | "right";
}

export interface ThreadHistoryHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Children as ReactNode or render function receiving header state. */
  children?:
    | React.ReactNode
    | ((props: ThreadHistoryHeaderRenderProps) => React.ReactNode);
}

/**
 * Header primitive for the thread history sidebar.
 * Provides data attributes for collapsed state and position to enable styling.
 * Accepts children as a render function to access isCollapsed and position state.
 * @returns The header element with data attributes for styling
 */
export const ThreadHistoryHeader = React.forwardRef<
  HTMLDivElement,
  ThreadHistoryHeaderProps
>(function ThreadHistoryHeader({ children, asChild, ...props }, ref) {
  const { isCollapsed, position } = useThreadHistoryRootContext();

  const Comp = asChild ? Slot : "div";

  const renderedChildren =
    typeof children === "function"
      ? children({ isCollapsed, position: position ?? "left" })
      : children;

  return (
    <Comp
      ref={ref}
      data-slot="thread-history-header"
      data-collapsed={isCollapsed || undefined}
      data-position={position}
      {...props}
    >
      {renderedChildren}
    </Comp>
  );
});
