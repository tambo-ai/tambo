"use client";

import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { Elicitation } from "../elicitation";
import { useMessageInputContext } from "./message-input-context";

export interface MessageInputElicitationRenderProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
}

export interface MessageInputElicitationProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  keepMounted?: boolean;
  children?:
    | React.ReactNode
    | ((props: MessageInputElicitationRenderProps) => React.ReactNode);
}

export const MessageInputElicitation = React.forwardRef<
  HTMLDivElement,
  MessageInputElicitationProps
>(({ children, keepMounted = false, ...props }, ref) => {
  const { elicitation, resolveElicitation } = useMessageInputContext();
  const hidden = !elicitation || !resolveElicitation;

  if (hidden && !keepMounted) {
    return null;
  }

  if (!elicitation || !resolveElicitation) {
    return (
      <div
        ref={ref}
        data-slot="message-input-elicitation"
        data-hidden={hidden || undefined}
        hidden={hidden && keepMounted}
        {...props}
      />
    );
  }

  const renderProps = React.useMemo<MessageInputElicitationRenderProps>(
    () => ({
      request: elicitation,
      onResponse: resolveElicitation,
    }),
    [elicitation, resolveElicitation],
  );

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children(renderProps);
  } else if (children === undefined || children === null) {
    content = (
      <Elicitation.Root request={elicitation} onResponse={resolveElicitation}>
        <Elicitation.Message />
        <Elicitation.Fields />
        <Elicitation.Actions />
      </Elicitation.Root>
    );
  } else {
    content = children;
  }

  return (
    <div
      ref={ref}
      data-slot="message-input-elicitation"
      data-hidden={hidden || undefined}
      hidden={hidden && keepMounted}
      {...props}
    >
      {content}
    </div>
  );
});
MessageInputElicitation.displayName = "MessageInput.Elicitation";
