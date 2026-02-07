import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { ElicitationUIBooleanField } from "../boolean-field/elicitation-ui-boolean-field";
import { ElicitationUIEnumField } from "../enum-field/elicitation-ui-enum-field";
import { ElicitationUINumberField } from "../number-field/elicitation-ui-number-field";
import { useElicitationUIContext } from "../root/elicitation-ui-context";
import type { FieldSchema } from "../root/validation";
import { getValidationError } from "../root/validation";
import { ElicitationUIStringField } from "../string-field/elicitation-ui-string-field";

/**
 * The resolved field type for a given schema.
 */
export type ElicitationUIFieldType =
  | "boolean"
  | "enum"
  | "string"
  | "number"
  | "unknown";

/**
 * Props passed to the Field render function.
 */
export interface ElicitationUIFieldRenderProps {
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
  /** The resolved field type. */
  fieldType: ElicitationUIFieldType;
  /** The current field value. */
  value: unknown;
  /** The validation error message, or null if valid/untouched. */
  validationError: string | null;
}

export type ElicitationUIFieldProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The field name key. */
    name: string;
    /** Whether this field should auto-focus. */
    autoFocus?: boolean;
  },
  ElicitationUIFieldRenderProps
>;

/**
 * Resolves the field type from a schema definition.
 * @returns The field type string
 */
function resolveFieldType(schema: FieldSchema): ElicitationUIFieldType {
  if (schema.type === "boolean") {
    return "boolean";
  }
  if (schema.type === "string" && "enum" in schema) {
    return "enum";
  }
  if (schema.type === "string") {
    return "string";
  }
  if (schema.type === "number" || schema.type === "integer") {
    return "number";
  }
  return "unknown";
}

/**
 * Generic field primitive for the elicitation UI.
 * Dispatches to the correct field type component based on the schema.
 * When used with a render function or children, provides field metadata
 * without rendering a specific field type.
 * @returns A field component appropriate for the schema type, or null for unknown types
 */
export const ElicitationUIField = React.forwardRef<
  HTMLDivElement,
  ElicitationUIFieldProps
>(({ name, autoFocus = false, asChild, ...props }, ref) => {
  const { fields, requiredFields, formData, touchedFields } =
    useElicitationUIContext();

  const fieldEntry = fields.find(([fieldName]) => fieldName === name);
  if (!fieldEntry) {
    return null;
  }

  const [, schema] = fieldEntry;
  const fieldType = resolveFieldType(schema);
  const required = requiredFields.includes(name);
  const value = formData[name];
  const label = schema.description ?? name;
  const validationError = touchedFields.has(name)
    ? getValidationError(formData[name], schema, required)
    : null;

  const hasRenderOrChildren =
    ("render" in props && typeof props.render === "function") ||
    ("children" in props && props.children !== undefined);

  // If a render function or children are provided, use them directly
  if (hasRenderOrChildren) {
    const Comp = asChild ? Slot : "div";

    const { content, componentProps } = useRender(props, {
      name,
      schema,
      label,
      required,
      autoFocus,
      fieldType,
      value,
      validationError,
    });

    return (
      <Comp
        ref={ref}
        data-slot="elicitation-ui-field"
        data-field-name={name}
        data-field-type={fieldType}
        {...componentProps}
      >
        {content}
      </Comp>
    );
  }

  // Strip render/children before dispatching — sub-fields have their own render prop types
  const { children: _children, render: _render, ...restProps } = props;

  // Dispatch to the appropriate field type component
  switch (fieldType) {
    case "boolean":
      return (
        <ElicitationUIBooleanField
          ref={ref}
          name={name}
          autoFocus={autoFocus}
          {...restProps}
        />
      );
    case "enum":
      return (
        <ElicitationUIEnumField
          ref={ref}
          name={name}
          autoFocus={autoFocus}
          {...restProps}
        />
      );
    case "string":
      return (
        <ElicitationUIStringField
          ref={ref}
          name={name}
          autoFocus={autoFocus}
          {...restProps}
        />
      );
    case "number":
      return (
        <ElicitationUINumberField
          ref={ref}
          name={name}
          autoFocus={autoFocus}
          {...restProps}
        />
      );
    default:
      return null;
  }
});
ElicitationUIField.displayName = "ElicitationUI.Field";
