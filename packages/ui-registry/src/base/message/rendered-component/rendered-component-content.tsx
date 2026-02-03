import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";

export const MessageRenderedComponentContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { message } = useMessageRootContext();

  if (!message.renderedComponent) {
    return null;
  }

  return (
    <div ref={ref} data-slot="message-rendered-component-content" {...props}>
      {message.renderedComponent}
    </div>
  );
});
MessageRenderedComponentContent.displayName =
  "Message.RenderedComponentContent";
