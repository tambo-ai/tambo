"use client";

import * as React from "react";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationMessageRenderProps {
  message: string;
}

export interface ElicitationMessageProps extends Omit<
  React.HTMLAttributes<HTMLParagraphElement>,
  "children"
> {
  children?:
    | React.ReactNode
    | ((props: ElicitationMessageRenderProps) => React.ReactNode);
}

export const ElicitationMessage = React.forwardRef<
  HTMLParagraphElement,
  ElicitationMessageProps
>(({ children, ...props }, ref) => {
  const { request } = useElicitationContext();
  const renderProps = React.useMemo<ElicitationMessageRenderProps>(
    () => ({
      message: request.message,
    }),
    [request.message],
  );

  return (
    <p ref={ref} data-slot="elicitation-message" {...props}>
      {typeof children === "function" ? children(renderProps) : request.message}
    </p>
  );
});
ElicitationMessage.displayName = "Elicitation.Message";
