import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export interface ReasoningInfoStepsRenderFunctionProps {
  steps: string[];
  showStepNumbers: boolean;
}

export type ReasoningInfoStepsProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  ReasoningInfoStepsRenderFunctionProps
>;

/**
 * Provides reasoning steps data for rendering.
 */
export const ReasoningInfoSteps = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoStepsProps
>(({ asChild, ...props }, ref) => {
  const { reasoning } = useReasoningInfoRootContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    steps: reasoning,
    showStepNumbers: reasoning.length > 1,
  });

  if (!content) return null;

  return (
    <Comp ref={ref} data-slot="reasoning-info-steps" {...componentProps}>
      {content}
    </Comp>
  );
});
ReasoningInfoSteps.displayName = "ReasoningInfo.Steps";
