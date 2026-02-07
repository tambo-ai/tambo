import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useFormRootContext } from "../root/form-root-context";

/**
 * Props passed to the render function of FormSubmit.
 */
export interface FormSubmitRenderProps {
  /** Whether the form is currently generating (not idle). */
  isGenerating: boolean;
  /** The text for the submit button. */
  submitText: string;
}

export type FormSubmitProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

/**
 * Submit button primitive for the form.
 * Automatically disables when the form is generating.
 * Supports a render prop to customize the button content based on loading state.
 * @returns The rendered submit button element
 */
export const FormSubmit = React.forwardRef<
  HTMLButtonElement,
  BasePropsWithChildrenOrRenderFunction<FormSubmitProps, FormSubmitRenderProps>
>(function FormSubmit({ asChild, disabled, ...props }, ref) {
  const { isGenerating, submitText } = useFormRootContext();

  const Comp = asChild ? Slot : "button";

  const { content, componentProps } = useRender(props, {
    isGenerating,
    submitText,
  });

  return (
    <Comp
      ref={ref}
      type="submit"
      disabled={disabled ?? isGenerating}
      data-slot="form-submit"
      data-generating={isGenerating || undefined}
      {...componentProps}
    >
      {content ?? submitText}
    </Comp>
  );
});
