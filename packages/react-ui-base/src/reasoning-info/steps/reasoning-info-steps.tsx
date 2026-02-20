import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export interface ReasoningInfoStepsRenderFunctionProps extends Record<
  string,
  unknown
> {
  steps: string[];
  showStepNumbers: boolean;
}

export type ReasoningInfoStepsProps = useRender.ComponentProps<
  "div",
  ReasoningInfoStepsRenderFunctionProps
>;

/**
 * Provides reasoning steps data for rendering.
 */
export const ReasoningInfoSteps = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoStepsProps
>(({ ...props }, ref) => {
  const { reasoning } = useReasoningInfoRootContext();
  const renderProps: ReasoningInfoStepsRenderFunctionProps = {
    steps: reasoning,
    showStepNumbers: reasoning.length > 1,
  };
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "reasoning-info-steps",
    }),
  });
});
ReasoningInfoSteps.displayName = "ReasoningInfo.Steps";
