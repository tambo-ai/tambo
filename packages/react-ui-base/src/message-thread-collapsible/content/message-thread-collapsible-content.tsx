import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageThreadCollapsibleContext } from "../root/message-thread-collapsible-context";

/**
 * Props passed to the Content render function.
 */
export interface MessageThreadCollapsibleContentRenderProps {
  /** Whether the collapsible thread is currently open. */
  isOpen: boolean;
}

export type MessageThreadCollapsibleContentProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement>,
    MessageThreadCollapsibleContentRenderProps
  >;

/**
 * Content primitive for the message thread collapsible.
 * Wraps content that is only visible when the collapsible is open.
 * @returns The content container element, or null when closed.
 */
export const MessageThreadCollapsibleContent = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleContentProps
>(function MessageThreadCollapsibleContent({ asChild, ...props }, ref) {
  const { isOpen, contentId } = useMessageThreadCollapsibleContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    isOpen,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Comp
      ref={ref}
      id={contentId}
      role="region"
      data-slot="message-thread-collapsible-content"
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
MessageThreadCollapsibleContent.displayName =
  "MessageThreadCollapsible.Content";
