"use client";

import { ComponentRenderFn, mergeProps, useRender } from "@base-ui/react";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { Elicitation } from "../elicitation";
import { useMessageInputContext } from "./message-input-context";

export interface MessageInputElicitationState {
  slot: string;
  state: "hidden" | "visible";
  elicitation: TamboElicitationRequest | null;
  onResponse: ((response: TamboElicitationResponse) => void) | null;
}

export type MessageInputElicitationRenderProps = {
  request?: TamboElicitationRequest;
  onResponse?: (response: TamboElicitationResponse) => void;
  keepMounted?: boolean;
};

export type MessageInputElicitationProps = useRender.ComponentProps<
  "div",
  MessageInputElicitationState,
  MessageInputElicitationRenderProps
> &
  MessageInputElicitationRenderProps;

export const MessageInputElicitation = React.forwardRef<
  HTMLDivElement,
  MessageInputElicitationProps
>(({ children, render, keepMounted = false, ...props }, ref) => {
  const { elicitation, resolveElicitation } = useMessageInputContext();
  const hidden = !elicitation || !resolveElicitation;

  const defaultContent = !hidden ? (
    <Elicitation.Root request={elicitation} onResponse={resolveElicitation}>
      <Elicitation.Message />
      <Elicitation.Fields />
      <Elicitation.Actions />
    </Elicitation.Root>
  ) : null;

  return useRender({
    defaultTagName: "div",
    ref,
    enabled: !hidden || keepMounted,
    render: render as ComponentRenderFn<
      MessageInputElicitationProps,
      MessageInputElicitationState
    >,
    state: {
      slot: "message-input-elicitation",
      state: hidden ? ("hidden" as const) : ("visible" as const),
      elicitation,
      onResponse: resolveElicitation,
    },
    stateAttributesMapping: {
      elicitation: () => null,
      onResponse: () => null,
    },
    props: mergeProps(props, {
      "aria-hidden": hidden || undefined,
      children: children ?? defaultContent,
    }),
  });
});
MessageInputElicitation.displayName = "MessageInput.Elicitation";
