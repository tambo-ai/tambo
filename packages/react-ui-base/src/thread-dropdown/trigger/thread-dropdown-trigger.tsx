import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";

export type ThreadDropdownTriggerProps = BaseProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>
>;

/**
 * Trigger button primitive for the thread dropdown.
 * Renders a button element (or a Slot when asChild is true) that can be
 * used to open the dropdown menu.
 * @returns The trigger button element
 */
export const ThreadDropdownTrigger = React.forwardRef<
  HTMLButtonElement,
  ThreadDropdownTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      data-slot="thread-dropdown-trigger"
      {...props}
    >
      {children}
    </Comp>
  );
});
ThreadDropdownTrigger.displayName = "ThreadDropdown.Trigger";
