import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useControlBarRootContext } from "../root/control-bar-root-context";

/**
 * Props passed to the Content render function.
 */
export interface ControlBarContentRenderProps {
  /** Whether the thread has messages to display. */
  hasMessages: boolean;
}

export type ControlBarContentProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  ControlBarContentRenderProps
>;

/**
 * Content primitive for the control bar dialog.
 * Renders the main dialog content area. Handles Escape key to close.
 * @returns The content container element
 */
export const ControlBarContent = React.forwardRef<
  HTMLDivElement,
  ControlBarContentProps
>(function ControlBarContent({ asChild, ...props }, ref) {
  const { setOpen, hasMessages } = useControlBarRootContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    hasMessages,
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  return (
    <Comp
      ref={ref}
      role="dialog"
      data-slot="control-bar-content"
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
