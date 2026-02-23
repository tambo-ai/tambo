"use client";

import { ComponentRenderFn, mergeProps, useRender } from "@base-ui/react";
import * as React from "react";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationMessageState {
  message: string;
}

interface ElicitationMessageRenderProps {
  message: string;
}

export type ElicitationMessageProps = useRender.ComponentProps<
  "p",
  ElicitationMessageState,
  useRender.ElementProps<"p"> & ElicitationMessageRenderProps
>;

export const ElicitationMessage = React.forwardRef<
  HTMLParagraphElement,
  ElicitationMessageProps
>(({ render, children, ...props }, ref) => {
  const { request } = useElicitationContext();

  return useRender({
    defaultTagName: "p",
    ref,
    render: render as ComponentRenderFn<
      ElicitationMessageProps,
      ElicitationMessageState
    >,
    props: mergeProps(props, {
      message: request.message,
      children: children ?? request.message,
    }),
    state: {
      message: request.message,
    },
  });
});
ElicitationMessage.displayName = "Elicitation.Message";
