"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

/**
 * Props for the MessageInput.Toolbar component.
 */
export type MessageInputToolbarProps = useRender.ComponentProps<"div">;

/**
 * Container for the toolbar components (like submit button and file button).
 * A simple container that provides proper semantic markup.
 */
export const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  MessageInputToolbarProps
>(({ children, ...props }, ref) => {
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    props: mergeProps(componentProps, {
      children,
      "data-slot": "message-input-toolbar",
    }),
  });
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";
