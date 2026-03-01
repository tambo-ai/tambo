import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { checkHasContent } from "../../utils/check-has-content";
import { useMessageRootContext } from "../root/message-root-context";

export interface MessageLoadingIndicatorOwnProps {
  /**
   * Keep the element mounted when not loading. When false (default),
   * the component returns null unless the message is in a loading state
   * with no content.
   * @default false
   */
  keepMounted?: boolean;
}

export type MessageLoadingIndicatorProps = MessageLoadingIndicatorOwnProps &
  useRender.ComponentProps<"div">;

/**
 * MessageLoadingIndicator base component for showing loading state.
 * Renders three span elements with data-dot attributes for styling.
 * Only visible when the parent Message.Root has isLoading=true and no content.
 */
export const MessageLoadingIndicator = React.forwardRef<
  HTMLDivElement,
  MessageLoadingIndicatorProps
>(({ children, keepMounted = false, ...props }, ref) => {
  const { message, isLoading } = useMessageRootContext();
  const hasContent = React.useMemo(
    () => checkHasContent(message.content),
    [message.content],
  );
  const showLoading = !!isLoading && !hasContent && !message.reasoning;

  const { render, ...componentProps } = props;
  return useRender({
    defaultTagName: "div",
    ref,
    render,
    enabled: keepMounted || showLoading,
    state: { slot: "loading-indicator" },
    props: mergeProps(componentProps, {
      children: children ?? (
        <>
          <span data-dot="1" />
          <span data-dot="2" />
          <span data-dot="3" />
        </>
      ),
    }),
  });
});
MessageLoadingIndicator.displayName = "Message.LoadingIndicator";
