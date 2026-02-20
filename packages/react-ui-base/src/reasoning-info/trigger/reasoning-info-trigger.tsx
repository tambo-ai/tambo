import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export interface ReasoningInfoTriggerRenderProps extends Record<
  string,
  unknown
> {
  isExpanded: boolean;
}

export type ReasoningInfoTriggerProps = useRender.ComponentProps<
  "button",
  ReasoningInfoTriggerRenderProps
>;

/**
 * Trigger button for expanding/collapsing reasoning details.
 */
export const ReasoningInfoTrigger = React.forwardRef<
  HTMLButtonElement,
  ReasoningInfoTriggerProps
>(({ children, ...props }, ref) => {
  const { isExpanded, setIsExpanded, detailsId } =
    useReasoningInfoRootContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsExpanded(!isExpanded);
    e.preventDefault();
  };
  const { render, ...componentProps } = props;
  const renderProps: ReasoningInfoTriggerRenderProps = {
    isExpanded,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      type: "button",
      "aria-expanded": isExpanded,
      "aria-controls": detailsId,
      onClick: handleClick,
      children,
      "data-slot": "reasoning-info-trigger",
      "data-state": isExpanded ? "open" : "closed",
    }),
  });
});
ReasoningInfoTrigger.displayName = "ReasoningInfo.Trigger";
