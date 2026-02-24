import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

export type MessageLoadingIndicatorProps = useRender.ComponentProps<"div">;

/**
 * MessageLoadingIndicator base component for showing loading state.
 * Renders three span elements with data-dot attributes for styling.
 */
export const MessageLoadingIndicator = React.forwardRef<
  HTMLDivElement,
  MessageLoadingIndicatorProps
>(({ children, ...props }, ref) => {
  const { render, ...componentProps } = props;
  return useRender({
    defaultTagName: "div",
    ref,
    render,
    props: mergeProps(componentProps, {
      children: children ?? (
        <>
          <span data-dot="1" />
          <span data-dot="2" />
          <span data-dot="3" />
        </>
      ),
      "data-slot": "loading-indicator",
    }),
  });
});
MessageLoadingIndicator.displayName = "Message.LoadingIndicator";
