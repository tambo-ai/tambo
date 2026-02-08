import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";

export interface MessageRenderedComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
}

/**
 * RenderedComponent base for displaying AI-generated components.
 * Only renders for assistant messages with component content blocks.
 */
export const MessageRenderedComponent = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentProps
>(({ asChild, children, ...props }, ref) => {
  const { message, role } = useMessageRootContext();

  const hasComponent = message.content.some(
    (block) =>
      block.type === "component" &&
      "renderedComponent" in block &&
      block.renderedComponent,
  );

  if (!hasComponent || role !== "assistant") {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="message-rendered-component-area" {...props}>
      {children}
    </Comp>
  );
});
MessageRenderedComponent.displayName = "Message.RenderedComponent";
