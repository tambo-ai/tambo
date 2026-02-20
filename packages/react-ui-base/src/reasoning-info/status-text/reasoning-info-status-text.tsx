import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export interface ReasoningInfoStatusTextRenderProps extends Record<
  string,
  unknown
> {
  text: string;
  isLoading: boolean | undefined;
  stepCount: number;
}

export type ReasoningInfoStatusTextProps = useRender.ComponentProps<
  "span",
  ReasoningInfoStatusTextRenderProps
>;

/**
 * Displays the reasoning status text.
 */
export const ReasoningInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ReasoningInfoStatusTextProps
>(({ ...props }, ref) => {
  const { statusText, isLoading, reasoning } = useReasoningInfoRootContext();

  const renderProps: ReasoningInfoStatusTextRenderProps = {
    text: statusText,
    isLoading,
    stepCount: reasoning.length,
  };
  const { render, ...componentProps } = props;

  const fallback = `${statusText} ${reasoning.length > 1 ? `(${reasoning.length} steps)` : ""}`;
  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: renderProps,
    props: mergeProps(
      {
        children: fallback,
      },
      componentProps,
      {
        "data-slot": "reasoning-info-status-text",
        "data-loading": isLoading || undefined,
      },
    ),
  });
});
ReasoningInfoStatusText.displayName = "ReasoningInfo.StatusText";
