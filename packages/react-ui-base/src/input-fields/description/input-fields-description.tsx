import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useInputFieldsFieldContext } from "../field/input-fields-field-context";

export type InputFieldsDescriptionProps = BaseProps<
  React.HTMLAttributes<HTMLParagraphElement>
>;

/**
 * Description sub-component for an individual field.
 * Renders the field's description text if present.
 * Returns null when the field has no description.
 * @returns The description paragraph element, or null if no description exists
 */
export const InputFieldsDescription = React.forwardRef<
  HTMLParagraphElement,
  InputFieldsDescriptionProps
>(function InputFieldsDescription({ asChild, children, ...props }, ref) {
  const { field } = useInputFieldsFieldContext();

  if (!field.description && !children) {
    return null;
  }

  const Comp = asChild ? Slot : "p";

  return (
    <Comp ref={ref} data-slot="input-fields-description" {...props}>
      {children ?? field.description}
    </Comp>
  );
});
