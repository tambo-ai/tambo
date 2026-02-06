import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useElicitationUIContext } from "../root/elicitation-ui-context";

/**
 * Props passed to the Title render function.
 */
export interface ElicitationUITitleRenderProps {
  /** The elicitation message text. */
  message: string;
}

export type ElicitationUITitleProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  ElicitationUITitleRenderProps
>;

/**
 * Title primitive for the elicitation UI.
 * Displays the elicitation message/prompt text.
 * @returns A div element containing the elicitation title
 */
export const ElicitationUITitle = React.forwardRef<
  HTMLDivElement,
  ElicitationUITitleProps
>(({ asChild, ...props }, ref) => {
  const { request } = useElicitationUIContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    message: request.message,
  });

  return (
    <Comp ref={ref} data-slot="elicitation-ui-title" {...componentProps}>
      {content ?? request.message}
    </Comp>
  );
});
ElicitationUITitle.displayName = "ElicitationUI.Title";
