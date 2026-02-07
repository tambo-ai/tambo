import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useScrollableMessageContainerRootContext } from "../root/scrollable-message-container-root-context";

export type ScrollableMessageContainerViewportProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Viewport primitive for the scrollable message container.
 * This is the scrollable div that holds the message content.
 * Connects to the root context to enable scroll tracking and auto-scroll behavior.
 * @returns The scrollable viewport element
 */
export const ScrollableMessageContainerViewport = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerViewportProps
>(function ScrollableMessageContainerViewport(
  { children, asChild, ...props },
  ref,
) {
  const { viewportRef } = useScrollableMessageContainerRootContext();

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={(node: HTMLDivElement | null) => {
        // Assign to the context ref
        (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;

        // Forward the external ref
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      data-slot="scrollable-message-container-viewport"
      {...props}
    >
      {children}
    </Comp>
  );
});
