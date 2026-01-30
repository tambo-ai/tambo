import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";

export type MessageLoadingIndicatorProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * MessageLoadingIndicator base component for showing loading state.
 * Renders three span elements with data-dot attributes for styling.
 */
export const MessageLoadingIndicator = React.forwardRef<
  HTMLDivElement,
  MessageLoadingIndicatorProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp ref={ref} data-slot="loading-indicator" {...props}>
      {children ?? (
        <>
          <span data-dot="1" />
          <span data-dot="2" />
          <span data-dot="3" />
        </>
      )}
    </Comp>
  );
});
MessageLoadingIndicator.displayName = "Message.LoadingIndicator";
