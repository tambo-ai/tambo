import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useEditWithTamboButtonContext } from "../root/edit-with-tambo-button-context";

/**
 * Props passed to the Status render function.
 */
export interface EditWithTamboButtonStatusRenderProps {
  /** Whether the AI is currently generating. */
  isGenerating: boolean;
  /** Whether an onOpenThread callback is available. */
  hasOpenThread: boolean;
  /** The onOpenThread callback, if provided. */
  onOpenThread: (() => void) | undefined;
}

export type EditWithTamboButtonStatusProps =
  BasePropsWithChildrenOrRenderFunction<
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    EditWithTamboButtonStatusRenderProps
  >;

/**
 * Status area that displays generation state or helper text.
 * Supports render props for custom status rendering.
 * Exposes generating state via data attributes.
 * @returns A div element showing the current status.
 */
export const EditWithTamboButtonStatus = React.forwardRef<
  HTMLDivElement,
  EditWithTamboButtonStatusProps
>(({ asChild, ...props }, ref) => {
  const { isGenerating, onOpenThread } = useEditWithTamboButtonContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    isGenerating,
    hasOpenThread: !!onOpenThread,
    onOpenThread,
  });

  return (
    <Comp
      ref={ref}
      data-slot="edit-with-tambo-button-status"
      data-generating={isGenerating || undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
EditWithTamboButtonStatus.displayName = "EditWithTamboButton.Status";
