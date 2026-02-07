import * as React from "react";
import type { Field } from "../root/input-fields-context";

/**
 * Context value for an individual field within InputFields.
 */
export interface InputFieldsFieldContextValue {
  /** The field configuration. */
  field: Field;
  /** The current value of this field. */
  value: string;
  /** Whether this field's input should be disabled. */
  isDisabled: boolean;
  /**
   * Handler for this field's value changes.
   * @param value - The new value
   */
  onChange: (value: string) => void;
}

const InputFieldsFieldContext =
  React.createContext<InputFieldsFieldContextValue | null>(null);

/**
 * Hook to access the per-field context.
 * @internal This hook is for internal use by base components only.
 * @returns The field context value
 * @throws Error if used outside of InputFields.Field
 */
function useInputFieldsFieldContext(): InputFieldsFieldContextValue {
  const context = React.useContext(InputFieldsFieldContext);
  if (!context) {
    throw new Error(
      "React UI Base: InputFieldsFieldContext is missing. Field parts must be used within <InputFields.Field>",
    );
  }
  return context;
}

export { InputFieldsFieldContext, useInputFieldsFieldContext };
