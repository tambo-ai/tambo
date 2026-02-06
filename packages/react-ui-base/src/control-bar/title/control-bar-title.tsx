import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BaseProps } from "../../types/component-render-or-children";

export type ControlBarTitleProps = BaseProps<
  React.HTMLAttributes<HTMLHeadingElement>
>;

/**
 * Title primitive for the control bar dialog.
 * Provides an accessible title for the dialog (typically visually hidden).
 * @returns The title heading element
 */
export const ControlBarTitle = React.forwardRef<
  HTMLHeadingElement,
  ControlBarTitleProps
>(function ControlBarTitle({ asChild, children, ...props }, ref) {
  const Comp = asChild ? Slot : "h2";

  return (
    <Comp ref={ref} data-slot="control-bar-title" {...props}>
      {children}
    </Comp>
  );
});
