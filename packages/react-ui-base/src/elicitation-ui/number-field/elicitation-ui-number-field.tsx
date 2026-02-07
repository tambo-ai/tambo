import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useElicitationUIContext } from "../root/elicitation-ui-context";
import { getValidationError, type FieldSchema } from "../root/validation";

/**
 * Props passed to the NumberField render function.
 */
export interface ElicitationUINumberFieldRenderProps {
  /** The field name. */
  name: string;
  /** The field schema. */
  schema: FieldSchema;
  /** The label text (schema description or field name). */
  label: string;
  /** Whether the field is required. */
  required: boolean;
  /** Whether this field should auto-focus. */
  autoFocus: boolean;
  /** The current number value, or undefined if not set. */
  value: number | undefined;
  /** The validation error message, or null if valid. */
  validationError: string | null;
  /** Whether the field currently has a validation error. */
  hasError: boolean;
  /** The generated input element ID for label association. */
  inputId: string;
  /** The generated error element ID for aria-describedby. */
  errorId: string;
  /** Change handler accepting a number or undefined (for empty input). */
  onChange: (value: number | undefined) => void;
  /** Minimum value constraint from schema, if any. */
  min: number | undefined;
  /** Maximum value constraint from schema, if any. */
  max: number | undefined;
  /** Step value: 1 for integers, "any" for numbers. */
  step: number | "any";
}

export type ElicitationUINumberFieldProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement> & {
      /** The field name key. */
      name: string;
      /** Whether this field should auto-focus. */
      autoFocus?: boolean;
    },
    ElicitationUINumberFieldRenderProps
  >;

/**
 * Number field primitive for the elicitation UI.
 * Renders a number input with constraints and validation support.
 * @returns A div element with a labeled number input, or null if the field schema is not number/integer
 */
export const ElicitationUINumberField = React.forwardRef<
  HTMLDivElement,
  ElicitationUINumberFieldProps
>(({ name, autoFocus = false, asChild, ...props }, ref) => {
  const inputId = React.useId();
  const { fields, requiredFields, formData, touchedFields, handleFieldChange } =
    useElicitationUIContext();

  const fieldEntry = fields.find(([fieldName]) => fieldName === name);
  if (!fieldEntry) {
    return null;
  }

  const [, schema] = fieldEntry;
  if (schema.type !== "number" && schema.type !== "integer") {
    return null;
  }

  const required = requiredFields.includes(name);
  const value = formData[name] as number | undefined;
  const label = schema.description ?? name;
  const validationError = touchedFields.has(name)
    ? getValidationError(formData[name], schema, required)
    : null;
  const hasError = !!validationError;
  const errorId = `${inputId}-error`;
  const min = schema.minimum;
  const max = schema.maximum;
  const step: number | "any" = schema.type === "integer" ? 1 : "any";

  const onChange = (newValue: number | undefined) =>
    handleFieldChange(name, newValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: rawValue, valueAsNumber } = e.currentTarget;
    onChange(
      rawValue === "" || Number.isNaN(valueAsNumber)
        ? undefined
        : valueAsNumber,
    );
  };

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    name,
    schema,
    label,
    required,
    autoFocus,
    value,
    validationError,
    hasError,
    inputId,
    errorId,
    onChange,
    min,
    max,
    step,
  });

  return (
    <Comp
      ref={ref}
      data-slot="elicitation-ui-number-field"
      data-field-name={name}
      data-has-error={hasError || undefined}
      {...componentProps}
    >
      {content ?? (
        <>
          <label
            htmlFor={inputId}
            data-slot="elicitation-ui-number-field-label"
          >
            {label}
            {required && (
              <span data-slot="elicitation-ui-required-marker">*</span>
            )}
          </label>
          <input
            id={inputId}
            type="number"
            autoFocus={autoFocus}
            value={value ?? ""}
            onChange={handleInputChange}
            placeholder={label}
            min={min}
            max={max}
            step={step}
            required={required}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            data-slot="elicitation-ui-number-field-input"
          />
          {validationError && (
            <p
              id={errorId}
              aria-live="polite"
              data-slot="elicitation-ui-field-error"
            >
              {validationError}
            </p>
          )}
        </>
      )}
    </Comp>
  );
});
ElicitationUINumberField.displayName = "ElicitationUI.NumberField";
