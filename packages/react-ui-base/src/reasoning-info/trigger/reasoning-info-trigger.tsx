import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export type ReasoningInfoTriggerProps = BaseProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>
>;

/**
 * Trigger button for expanding/collapsing reasoning details.
 */
export const ReasoningInfoTrigger = React.forwardRef<
  HTMLButtonElement,
  ReasoningInfoTriggerProps
>(({ asChild, onClick, children, ...props }, ref) => {
  const { isExpanded, setIsExpanded, detailsId } =
    useReasoningInfoRootContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsExpanded(!isExpanded);
    onClick?.(e);
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      aria-expanded={isExpanded}
      aria-controls={detailsId}
      onClick={handleClick}
      data-slot="reasoning-info-trigger"
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {children}
    </Comp>
  );
});
ReasoningInfoTrigger.displayName = "ReasoningInfo.Trigger";
