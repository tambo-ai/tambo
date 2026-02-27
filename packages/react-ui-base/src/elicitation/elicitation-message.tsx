"use client";

import { ComponentRenderFn, mergeProps, useRender } from "@base-ui/react";
import * as React from "react";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationMessageRenderProps {
  message?: string;
}

export type ElicitationMessageProps = useRender.ComponentProps<
  "p",
  unknown,
  ElicitationMessageRenderProps
>;

export const ElicitationMessage = React.forwardRef<
  HTMLParagraphElement,
  ElicitationMessageProps
>(({ render, children, ...props }: ElicitationMessageProps, ref) => {
  const { request } = useElicitationContext();

  return useRender({
    defaultTagName: "p",
    ref,
    render: render as ComponentRenderFn<ElicitationMessageProps, unknown>,
    state: {
      message: request.message,
    },
    stateAttributesMapping: {
      message: () => null,
    },
    props: mergeProps(props, {
      children: children ?? request.message,
    }),
  });
});
ElicitationMessage.displayName = "Elicitation.Message";
