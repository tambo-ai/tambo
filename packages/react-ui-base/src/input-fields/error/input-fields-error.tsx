import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useInputFieldsFieldContext } from "../field/input-fields-field-context";

export type InputFieldsErrorProps = BaseProps<
  React.HTMLAttributes<HTMLParagraphElement>
>;

/**
 * Error sub-component for an individual field.
 * Renders the field's error message if present.
 * Returns null when the field has no error.
 * @returns The error paragraph element, or null if no error exists
 */
export const InputFieldsError = React.forwardRef<
  HTMLParagraphElement,
  InputFieldsErrorProps
>(function InputFieldsError({ asChild, children, ...props }, ref) {
  const { field } = useInputFieldsFieldContext();

  if (!field.error && !children) {
    return null;
  }

  const Comp = asChild ? Slot : "p";

  return (
    <Comp ref={ref} data-slot="input-fields-error" {...props}>
      {children ?? field.error}
    </Comp>
  );
});
