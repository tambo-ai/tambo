import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageThreadCollapsibleContext } from "../root/message-thread-collapsible-context";

/**
 * Props passed to the Header render function.
 */
export interface MessageThreadCollapsibleHeaderRenderProps {
  /** Whether the collapsible thread is currently open. */
  isOpen: boolean;
  /** Display-friendly shortcut string (e.g. "⌘K" or "Ctrl+K"). */
  shortcutText: string;
  /** Callback to close the collapsible. */
  onClose: () => void;
}

export type MessageThreadCollapsibleHeaderProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement>,
    MessageThreadCollapsibleHeaderRenderProps
  >;

/**
 * Header primitive for the message thread collapsible.
 * Renders the header area shown when the collapsible is open.
 * @returns The header element
 */
export const MessageThreadCollapsibleHeader = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleHeaderProps
>(function MessageThreadCollapsibleHeader({ asChild, ...props }, ref) {
  const { isOpen, setIsOpen, shortcutText } =
    useMessageThreadCollapsibleContext();

  const onClose = React.useCallback(() => setIsOpen(false), [setIsOpen]);

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    isOpen,
    shortcutText,
    onClose,
  });

  return (
    <Comp
      ref={ref}
      data-slot="message-thread-collapsible-header"
      data-state={isOpen ? "open" : "closed"}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
MessageThreadCollapsibleHeader.displayName =
  "MessageThreadCollapsible.Header";
