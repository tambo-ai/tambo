import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export interface ReasoningInfoContentRenderProps extends Record<
  string,
  unknown
> {
  isExpanded: boolean;
}

type ReasoningInfoContentComponentProps = useRender.ComponentProps<
  "div",
  ReasoningInfoContentRenderProps
>;

export type ReasoningInfoContentProps = ReasoningInfoContentComponentProps & {
  /** Force visibility regardless of expanded state (for custom animations). */
  forceMount?: boolean;
};

/**
 * Collapsible content area for reasoning details.
 * Includes a ref for auto-scrolling behavior.
 */
export const ReasoningInfoContent = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoContentProps
>(({ forceMount, ...props }, ref) => {
  const { isExpanded, detailsId, scrollContainerRef } =
    useReasoningInfoRootContext();
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (
        scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
      ).current = node;
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      if (ref) {
        ref.current = node;
      }
    },
    [ref, scrollContainerRef],
  );

  if (!forceMount && !isExpanded) {
    return null;
  }

  const { render, ...componentProps } = props;
  const renderProps: ReasoningInfoContentRenderProps = {
    isExpanded,
  };

  return useRender({
    defaultTagName: "div",
    ref: combinedRef,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      id: detailsId,
      "data-slot": "reasoning-info-content",
      "data-state": isExpanded ? "open" : "closed",
    }),
  });
});
ReasoningInfoContent.displayName = "ReasoningInfo.Content";
