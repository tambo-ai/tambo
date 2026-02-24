import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { TamboComponentContent } from "@tambo-ai/react";
import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";

export interface MessageRenderedComponentCanvasButtonRenderProps extends Record<
  string,
  unknown
> {
  canvasExists: boolean;
  hasRenderedComponent: boolean;
}

export type MessageRenderedComponentCanvasButtonProps =
  useRender.ComponentProps<
    "button",
    MessageRenderedComponentCanvasButtonRenderProps
  >;

export const MessageRenderedComponentCanvasButton = React.forwardRef<
  HTMLButtonElement,
  MessageRenderedComponentCanvasButtonProps
>(({ children, ...props }, ref) => {
  const { message } = useMessageRootContext();
  const [canvasExists, setCanvasExists] = React.useState(false);

  // Check if canvas exists on mount and window resize
  React.useEffect(() => {
    const checkCanvasExists = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setCanvasExists(!!canvas);
    };

    checkCanvasExists();
    window.addEventListener("resize", checkCanvasExists);
    return () => window.removeEventListener("resize", checkCanvasExists);
  }, []);

  const firstRenderedComponent = React.useMemo(() => {
    const componentBlock = message.content.find(
      (block): block is TamboComponentContent =>
        block.type === "component" && !!block.renderedComponent,
    );
    return componentBlock?.renderedComponent;
  }, [message.content]);

  const onShowInCanvas = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tambo:showComponent", {
          detail: {
            messageId: message.id,
            component: firstRenderedComponent,
          },
        }),
      );
    }
  }, [message.id, firstRenderedComponent]);

  if (!canvasExists) return null;
  const { render, ...componentProps } = props;
  const renderProps: MessageRenderedComponentCanvasButtonRenderProps = {
    canvasExists,
    hasRenderedComponent: !!firstRenderedComponent,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      type: "button",
      onClick: onShowInCanvas,
      children,
      "data-slot": "rendered-component-canvas-button",
    }),
  });
});
MessageRenderedComponentCanvasButton.displayName =
  "Message.RenderedComponentCanvasButton";
