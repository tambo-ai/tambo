import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";

export type EditWithTamboButtonSendModeDropdownProps = BaseProps<
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled">
>;

/**
 * Dropdown trigger button for switching between send modes.
 * Toggles the send mode dropdown open/closed state.
 * Disabled when there is no prompt or when generating.
 * @returns A button element that toggles the send mode dropdown.
 */
export const EditWithTamboButtonSendModeDropdown = React.forwardRef<
  HTMLButtonElement,
  EditWithTamboButtonSendModeDropdownProps
>(({ asChild, children, ...props }, ref) => {
  const { prompt, isGenerating, isDropdownOpen, setDropdownOpen } =
    useEditWithTamboButtonContext();

  const isDisabled = !prompt.trim() || isGenerating;

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      onClick={() => setDropdownOpen(!isDropdownOpen)}
      disabled={isDisabled}
      aria-expanded={isDropdownOpen}
      aria-haspopup="true"
      data-slot="edit-with-tambo-button-send-mode-dropdown"
      data-state={isDropdownOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </Comp>
  );
});
EditWithTamboButtonSendModeDropdown.displayName =
  "EditWithTamboButton.SendModeDropdown";
