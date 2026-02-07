import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageThreadCollapsibleContext } from "../root/message-thread-collapsible-context";

/**
 * Props passed to the Trigger render function.
 */
export interface MessageThreadCollapsibleTriggerRenderProps {
  /** Whether the collapsible thread is currently open. */
  isOpen: boolean;
  /** Display-friendly shortcut string (e.g. "⌘K" or "Ctrl+K"). */
  shortcutText: string;
}

export type MessageThreadCollapsibleTriggerProps =
  BasePropsWithChildrenOrRenderFunction<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    MessageThreadCollapsibleTriggerRenderProps
  >;

/**
 * Trigger primitive for the message thread collapsible.
 * Renders a button that toggles the collapsible open state.
 * @returns The trigger button element
 */
export const MessageThreadCollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  MessageThreadCollapsibleTriggerProps
>(function MessageThreadCollapsibleTrigger({ asChild, ...props }, ref) {
  const { isOpen, setIsOpen, shortcutText } =
    useMessageThreadCollapsibleContext();

  const Comp = asChild ? Slot : "button";

  const { content, componentProps } = useRender(props, {
    isOpen,
    shortcutText,
  });

  return (
    <Comp
      ref={ref}
      type="button"
      data-slot="message-thread-collapsible-trigger"
      data-state={isOpen ? "open" : "closed"}
      onClick={() => setIsOpen(!isOpen)}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
