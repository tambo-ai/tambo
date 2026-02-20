import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { TamboComponentContent } from "@tambo-ai/react";
import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";

export interface MessageRenderedComponentContentRenderProps extends Record<
  string,
  unknown
> {
  renderedComponents: React.ReactNode[];
}

export type MessageRenderedComponentContentProps = useRender.ComponentProps<
  "div",
  MessageRenderedComponentContentRenderProps
>;

export const MessageRenderedComponentContent = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentContentProps
>((props, ref) => {
  const { message } = useMessageRootContext();

  const renderedComponents = message.content
    .filter(
      (block): block is TamboComponentContent => block.type === "component",
    )
    .map((block) => block.renderedComponent)
    .filter(Boolean);

  if (renderedComponents.length === 0) {
    return null;
  }

  const { render, ...componentProps } = props;
  const renderProps: MessageRenderedComponentContentRenderProps = {
    renderedComponents,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      children: renderedComponents,
      "data-slot": "message-rendered-component-content",
    }),
  });
});
MessageRenderedComponentContent.displayName =
  "Message.RenderedComponentContent";
