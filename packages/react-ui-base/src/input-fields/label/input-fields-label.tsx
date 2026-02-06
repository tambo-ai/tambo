import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useInputFieldsFieldContext } from "../field/input-fields-field-context";

export type InputFieldsLabelProps = BaseProps<
  React.LabelHTMLAttributes<HTMLLabelElement>
>;

/**
 * Label sub-component for an individual field.
 * Automatically sets the `htmlFor` attribute to match the field ID.
 * Renders the field's label text and a required indicator when applicable.
 * @returns The label element for the field
 */
export const InputFieldsLabel = React.forwardRef<
  HTMLLabelElement,
  InputFieldsLabelProps
>(function InputFieldsLabel({ asChild, children, ...props }, ref) {
  const { field } = useInputFieldsFieldContext();

  const Comp = asChild ? Slot : "label";

  return (
    <Comp
      ref={ref}
      data-slot="input-fields-label"
      data-required={field.required || undefined}
      htmlFor={field.id}
      {...props}
    >
      {children ?? (
        <>
          {field.label}
          {field.required && <span data-slot="input-fields-required">*</span>}
        </>
      )}
    </Comp>
  );
});
