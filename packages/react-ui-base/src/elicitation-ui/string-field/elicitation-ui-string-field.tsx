import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useElicitationUIContext } from "../root/elicitation-ui-context";
import {
  getInputType,
  getValidationError,
  type FieldSchema,
} from "../root/validation";

/**
 * Props passed to the StringField render function.
 */
export interface ElicitationUIStringFieldRenderProps {
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
  /** The current string value. */
  value: string;
  /** The HTML input type derived from the schema format. */
  inputType: string;
  /** The validation error message, or null if valid. */
  validationError: string | null;
  /** Whether the field currently has a validation error. */
  hasError: boolean;
  /** The generated input element ID for label association. */
  inputId: string;
  /** The generated error element ID for aria-describedby. */
  errorId: string;
  /** Change handler for the input value. */
  onChange: (value: string) => void;
  /** Min length constraint from schema, if any. */
  minLength: number | undefined;
  /** Max length constraint from schema, if any. */
  maxLength: number | undefined;
}

export type ElicitationUIStringFieldProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement> & {
      /** The field name key. */
      name: string;
      /** Whether this field should auto-focus. */
      autoFocus?: boolean;
    },
    ElicitationUIStringFieldRenderProps
  >;

/**
 * String field primitive for the elicitation UI.
 * Renders a text input with format and validation support.
 * @returns A div element with a labeled text input, or null if the field schema is not a plain string
 */
export const ElicitationUIStringField = React.forwardRef<
  HTMLDivElement,
  ElicitationUIStringFieldProps
>(({ name, autoFocus = false, asChild, ...props }, ref) => {
  const inputId = React.useId();
  const { fields, requiredFields, formData, touchedFields, handleFieldChange } =
    useElicitationUIContext();

  const fieldEntry = fields.find(([fieldName]) => fieldName === name);
  if (!fieldEntry) {
    return null;
  }

  const [, schema] = fieldEntry;
  if (schema.type !== "string") {
    return null;
  }

  // Enum strings are handled by EnumField
  if ("enum" in schema) {
    return null;
  }

  const required = requiredFields.includes(name);
  const value = (formData[name] as string | undefined) ?? "";
  const label = schema.description ?? name;
  const inputType = getInputType(schema);
  const validationError = touchedFields.has(name)
    ? getValidationError(formData[name], schema, required)
    : null;
  const hasError = !!validationError;
  const errorId = `${inputId}-error`;
  const minLength = "minLength" in schema ? schema.minLength : undefined;
  const maxLength = "maxLength" in schema ? schema.maxLength : undefined;

  const onChange = (newValue: string) => handleFieldChange(name, newValue);

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    name,
    schema,
    label,
    required,
    autoFocus,
    value,
    inputType,
    validationError,
    hasError,
    inputId,
    errorId,
    onChange,
    minLength,
    maxLength,
  });

  return (
    <Comp
      ref={ref}
      data-slot="elicitation-ui-string-field"
      data-field-name={name}
      data-has-error={hasError || undefined}
      {...componentProps}
    >
      {content ?? (
        <>
          <label
            htmlFor={inputId}
            data-slot="elicitation-ui-string-field-label"
          >
            {label}
            {required && (
              <span data-slot="elicitation-ui-required-marker">*</span>
            )}
          </label>
          <input
            id={inputId}
            type={inputType}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            minLength={minLength}
            maxLength={maxLength}
            required={required}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            data-slot="elicitation-ui-string-field-input"
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
ElicitationUIStringField.displayName = "ElicitationUI.StringField";
