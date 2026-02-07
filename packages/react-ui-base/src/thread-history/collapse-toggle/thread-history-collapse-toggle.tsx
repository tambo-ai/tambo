import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useThreadHistoryRootContext } from "../root/thread-history-root-context";

export type ThreadHistoryCollapseToggleProps = BaseProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>
>;

/**
 * Collapse toggle primitive for the thread history sidebar.
 * Toggles the collapsed state when clicked.
 * Provides data attributes for collapsed state and position to enable styling.
 * @returns A button element that toggles the sidebar collapsed state
 */
export const ThreadHistoryCollapseToggle = React.forwardRef<
  HTMLButtonElement,
  ThreadHistoryCollapseToggleProps
>(function ThreadHistoryCollapseToggle({ children, asChild, ...props }, ref) {
  const { isCollapsed, setIsCollapsed, position } =
    useThreadHistoryRootContext();

  const handleToggle = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="thread-history-collapse-toggle"
      data-collapsed={isCollapsed || undefined}
      data-position={position}
      onClick={handleToggle}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      {...props}
    >
      {children}
    </Comp>
  );
});
