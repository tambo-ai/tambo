import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";

export interface MessageRenderedComponentRenderProps extends Record<
  string,
  unknown
> {
  hasRenderedComponent: boolean;
  role: "user" | "assistant";
}

export type MessageRenderedComponentProps = useRender.ComponentProps<
  "div",
  MessageRenderedComponentRenderProps
>;

/**
 * RenderedComponent base for displaying AI-generated components.
 * Only renders for assistant messages with component content blocks.
 */
export const MessageRenderedComponent = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentProps
>(({ children, ...props }, ref) => {
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

  const { render, ...componentProps } = props;
  const renderProps: MessageRenderedComponentRenderProps = {
    hasRenderedComponent: hasComponent,
    role,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      children,
      "data-slot": "message-rendered-component-area",
    }),
  });
});
MessageRenderedComponent.displayName = "Message.RenderedComponent";
