import type { TamboComponentContent } from "@tambo-ai/react";
import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";

export const MessageRenderedComponentContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
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

  return (
    <div ref={ref} data-slot="message-rendered-component-content" {...props}>
      {renderedComponents}
    </div>
  );
});
MessageRenderedComponentContent.displayName =
  "Message.RenderedComponentContent";
