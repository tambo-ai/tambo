import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BaseProps } from "../../types/component-render-or-children";
import { useControlBarRootContext } from "../root/control-bar-root-context";

export type ControlBarOverlayProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Overlay primitive for the control bar dialog.
 * Renders a backdrop element and closes the dialog when clicked.
 * @returns The overlay element
 */
export const ControlBarOverlay = React.forwardRef<
  HTMLDivElement,
  ControlBarOverlayProps
>(function ControlBarOverlay({ asChild, children, onClick, ...props }, ref) {
  const { setOpen } = useControlBarRootContext();

  const Comp = asChild ? Slot : "div";

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpen(false);
    onClick?.(e);
  };

  return (
    <Comp
      ref={ref}
      data-slot="control-bar-overlay"
      onClick={handleClick}
      {...props}
    >
      {children}
    </Comp>
  );
});
