import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import type { Field } from "../root/input-fields-context";
import { useInputFieldsRootContext } from "../root/input-fields-context";
import { InputFieldsFieldContext } from "./input-fields-field-context";

export type InputFieldsFieldProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The field configuration to render. */
    field: Field;
  }
>;

/**
 * Wraps a single field within the InputFields compound component.
 * Provides per-field context (value, disabled state, onChange handler)
 * to child sub-components like Label, Input, Description, and Error.
 * @returns The field container element with per-field context provider
 */
export const InputFieldsField = React.forwardRef<
  HTMLDivElement,
  InputFieldsFieldProps
>(function InputFieldsField({ asChild, children, field, ...props }, ref) {
  const { values, isGenerating, handleInputChange } =
    useInputFieldsRootContext();

  const value = values[field.id] ?? "";
  const isDisabled = field.disabled ?? isGenerating;

  const onChange = React.useCallback(
    (newValue: string) => {
      handleInputChange(field.id, newValue);
    },
    [handleInputChange, field.id],
  );

  const contextValue = React.useMemo(
    () => ({
      field,
      value,
      isDisabled,
      onChange,
    }),
    [field, value, isDisabled, onChange],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <InputFieldsFieldContext.Provider value={contextValue}>
      <Comp
        ref={ref}
        data-slot="input-fields-field"
        data-field-id={field.id}
        data-field-type={field.type}
        {...props}
      >
        {children}
      </Comp>
    </InputFieldsFieldContext.Provider>
  );
});
