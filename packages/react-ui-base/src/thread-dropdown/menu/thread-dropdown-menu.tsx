import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";

export type ThreadDropdownMenuProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Menu container primitive for the thread dropdown.
 * Wraps the dropdown content area where menu items are rendered.
 * @returns The menu container element
 */
export const ThreadDropdownMenu = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownMenuProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="thread-dropdown-menu" role="menu" {...props}>
      {children}
    </Comp>
  );
});
ThreadDropdownMenu.displayName = "ThreadDropdown.Menu";
