import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";

export interface EditWithTamboButtonPopoverRenderProps {
  /** Whether the popover is currently open. */
  isOpen: boolean;
  /** The tooltip/title text. */
  tooltip: string;
  /** The component name from the interactable. */
  componentName: string | undefined;
  /** Close the popover and clear the prompt. */
  closeAndReset: () => void;
}

export type EditWithTamboButtonPopoverProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Popover panel that contains the prompt input and actions.
 * Only renders its children when the popover is open.
 * Provides data attributes for open/closed state.
 * @returns A container div for the popover content, or null when closed.
 */
export const EditWithTamboButtonPopover = React.forwardRef<
  HTMLDivElement,
  EditWithTamboButtonPopoverProps
>(({ asChild, children, ...props }, ref) => {
  const { isOpen, component } = useEditWithTamboButtonContext();

  if (!isOpen) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="edit-with-tambo-button-popover"
      data-state={isOpen ? "open" : "closed"}
      data-component-name={component.componentName}
      {...props}
    >
      {children}
    </Comp>
  );
});
EditWithTamboButtonPopover.displayName = "EditWithTamboButton.Popover";
