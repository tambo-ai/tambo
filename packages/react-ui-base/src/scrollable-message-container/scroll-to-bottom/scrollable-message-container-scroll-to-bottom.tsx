import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useScrollableMessageContainerRootContext } from "../root/scrollable-message-container-root-context";

/**
 * Props passed to the render function of ScrollToBottom.
 */
export interface ScrollableMessageContainerScrollToBottomRenderProps {
  /** Whether the scroll position is currently at the bottom. */
  isAtBottom: boolean;
  /** Scroll the container to the bottom. */
  scrollToBottom: () => void;
}

export type ScrollableMessageContainerScrollToBottomProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement>,
    ScrollableMessageContainerScrollToBottomRenderProps
  >;

/**
 * ScrollToBottom primitive for the scrollable message container.
 * Provides render props with isAtBottom and scrollToBottom for building
 * scroll-to-bottom indicators or buttons.
 * @returns The scroll-to-bottom element, or null if no render content is provided
 */
export const ScrollableMessageContainerScrollToBottom = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerScrollToBottomProps
>(function ScrollableMessageContainerScrollToBottom(
  { asChild, ...props },
  ref,
) {
  const { isAtBottom, scrollToBottom } =
    useScrollableMessageContainerRootContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    isAtBottom,
    scrollToBottom,
  });

  return (
    <Comp
      ref={ref}
      data-slot="scrollable-message-container-scroll-to-bottom"
      data-at-bottom={isAtBottom || undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
