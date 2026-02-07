import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";
import type { EditWithTamboButtonSendMode } from "../root/edit-with-tambo-button-context";

export type EditWithTamboButtonSendModeOptionProps = BaseProps<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /** The send mode this option represents. */
    mode: EditWithTamboButtonSendMode;
  }
>;

/**
 * An individual send mode option within the dropdown.
 * When clicked, sets the send mode and closes the dropdown.
 * Exposes the active state via data attribute.
 * @returns A button element representing a send mode option.
 */
export const EditWithTamboButtonSendModeOption = React.forwardRef<
  HTMLButtonElement,
  EditWithTamboButtonSendModeOptionProps
>(({ asChild, mode, onClick, children, ...props }, ref) => {
  const { sendMode, setSendMode, setDropdownOpen } =
    useEditWithTamboButtonContext();

  const isActive = sendMode === mode;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setSendMode(mode);
    setDropdownOpen(false);
    onClick?.(e);
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      role="menuitem"
      onClick={handleClick}
      data-slot="edit-with-tambo-button-send-mode-option"
      data-mode={mode}
      data-active={isActive || undefined}
      {...props}
    >
      {children}
    </Comp>
  );
});
EditWithTamboButtonSendModeOption.displayName =
  "EditWithTamboButton.SendModeOption";
