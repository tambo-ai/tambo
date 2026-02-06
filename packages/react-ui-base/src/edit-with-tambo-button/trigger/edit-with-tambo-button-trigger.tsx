import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";

export type EditWithTamboButtonTriggerProps = BaseProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>
>;

/**
 * Trigger button that opens the edit popover.
 * Renders with data attributes for the open state.
 * @returns A button element that toggles the popover.
 */
export const EditWithTamboButtonTrigger = React.forwardRef<
  HTMLButtonElement,
  EditWithTamboButtonTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const { tooltip, isOpen, setIsOpen } = useEditWithTamboButtonContext();

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      aria-label={tooltip}
      onClick={() => setIsOpen(!isOpen)}
      data-slot="edit-with-tambo-button-trigger"
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </Comp>
  );
});
EditWithTamboButtonTrigger.displayName = "EditWithTamboButton.Trigger";
