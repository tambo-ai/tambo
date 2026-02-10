import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export interface ReasoningInfoStatusTextRenderProps {
  text: string;
  isLoading: boolean | undefined;
  stepCount: number;
}

export type ReasoningInfoStatusTextProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLSpanElement>,
    ReasoningInfoStatusTextRenderProps
  >;

/**
 * Displays the reasoning status text.
 */
export const ReasoningInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ReasoningInfoStatusTextProps
>(({ asChild, ...props }, ref) => {
  const { statusText, isLoading, reasoning } = useReasoningInfoRootContext();

  const Comp = asChild ? Slot : "span";

  const renderProps: ReasoningInfoStatusTextRenderProps = {
    text: statusText,
    isLoading,
    stepCount: reasoning.length,
  };

  const { content, componentProps } = useRender(props, renderProps);
  const fallback = `${statusText} ${reasoning.length > 1 ? `(${reasoning.length} steps)` : ""}`;

  return (
    <Comp
      ref={ref}
      data-slot="reasoning-info-status-text"
      data-loading={isLoading || undefined}
      {...componentProps}
    >
      {content ?? fallback}
    </Comp>
  );
});
ReasoningInfoStatusText.displayName = "ReasoningInfo.StatusText";
