import * as React from "react";
import { useInputFieldsFieldContext } from "../field/input-fields-field-context";

export type InputFieldsInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "id" | "name" | "disabled"
>;

/**
 * Input sub-component for an individual field.
 * Automatically binds to the field's value, type, validation attributes,
 * and disabled state from context.
 * @returns The input element for the field
 */
export const InputFieldsInput = React.forwardRef<
  HTMLInputElement,
  InputFieldsInputProps
>(function InputFieldsInput(props, ref) {
  const { field, value, isDisabled, onChange } = useInputFieldsFieldContext();

  return (
    <input
      ref={ref}
      data-slot="input-fields-input"
      type={field.type}
      id={field.id}
      name={field.id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      disabled={isDisabled}
      maxLength={field.maxLength}
      minLength={field.minLength}
      pattern={field.pattern}
      autoComplete={field.autoComplete}
      {...props}
    />
  );
});
