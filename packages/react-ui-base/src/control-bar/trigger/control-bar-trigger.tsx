import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useControlBarRootContext } from "../root/control-bar-root-context";

/**
 * Props passed to the Trigger render function.
 */
export interface ControlBarTriggerRenderProps {
  /** Whether the control bar is currently open. */
  isOpen: boolean;
  /** Display-friendly hotkey string (e.g. "⌘K" or "Ctrl+K"). */
  hotkeyDisplay: string;
}

export type ControlBarTriggerProps = BasePropsWithChildrenOrRenderFunction<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  ControlBarTriggerRenderProps
>;

/**
 * Trigger primitive for the control bar.
 * Renders a button that toggles the dialog open state.
 * @returns The trigger button element
 */
export const ControlBarTrigger = React.forwardRef<
  HTMLButtonElement,
  ControlBarTriggerProps
>(function ControlBarTrigger({ asChild, ...props }, ref) {
  const { isOpen, setOpen, hotkeyDisplay } = useControlBarRootContext();

  const Comp = asChild ? Slot : "button";

  const { content, componentProps } = useRender(props, {
    isOpen,
    hotkeyDisplay,
  });

  return (
    <Comp
      ref={ref}
      type="button"
      data-slot="control-bar-trigger"
      data-state={isOpen ? "open" : "closed"}
      onClick={() => setOpen(!isOpen)}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
