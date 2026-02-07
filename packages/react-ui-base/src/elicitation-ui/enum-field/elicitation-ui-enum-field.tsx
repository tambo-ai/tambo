import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useElicitationUIContext } from "../root/elicitation-ui-context";
import type { FieldSchema } from "../root/validation";

/**
 * A single enum option with its value and display name.
 */
export interface ElicitationUIEnumOption {
  /** The enum value. */
  value: string;
  /** The display label (from enumNames or the value itself). */
  label: string;
  /** Whether this option is currently selected. */
  isSelected: boolean;
  /** Handler to select this option. */
  onSelect: () => void;
}

/**
 * Props passed to the EnumField render function.
 */
export interface ElicitationUIEnumFieldRenderProps {
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
  /** The current string value, or undefined if not set. */
  value: string | undefined;
  /** The enum options with selection state and handlers. */
  options: ElicitationUIEnumOption[];
}

export type ElicitationUIEnumFieldProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The field name key. */
    name: string;
    /** Whether this field should auto-focus. */
    autoFocus?: boolean;
  },
  ElicitationUIEnumFieldRenderProps
>;

/**
 * Enum field primitive for the elicitation UI.
 * Renders selectable options for string enum schema fields.
 * @returns A div element with option buttons, or null if the field schema is not a string enum
 */
export const ElicitationUIEnumField = React.forwardRef<
  HTMLDivElement,
  ElicitationUIEnumFieldProps
>(({ name, autoFocus = false, asChild, ...props }, ref) => {
  const {
    fields,
    requiredFields,
    formData,
    isSingleEntry,
    handleFieldChange,
    handleSingleEntryChange,
  } = useElicitationUIContext();

  const fieldEntry = fields.find(([fieldName]) => fieldName === name);
  if (!fieldEntry) {
    return null;
  }

  const [, schema] = fieldEntry;
  if (schema.type !== "string" || !("enum" in schema)) {
    return null;
  }

  const required = requiredFields.includes(name);
  const value = formData[name] as string | undefined;
  const label = schema.description ?? name;
  const enumValues = schema.enum ?? [];
  const enumNames =
    "enumNames" in schema ? (schema.enumNames ?? []) : enumValues;
  const onChange = isSingleEntry ? handleSingleEntryChange : handleFieldChange;

  const options: ElicitationUIEnumOption[] = enumValues.map(
    (optionValue, index) => ({
      value: optionValue,
      label: enumNames[index] ?? optionValue,
      isSelected: value === optionValue,
      onSelect: () => onChange(name, optionValue),
    }),
  );

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    name,
    schema,
    label,
    required,
    autoFocus,
    value,
    options,
  });

  return (
    <Comp
      ref={ref}
      data-slot="elicitation-ui-enum-field"
      data-field-name={name}
      {...componentProps}
    >
      {content ?? (
        <>
          <label data-slot="elicitation-ui-enum-field-label">
            {label}
            {required && (
              <span data-slot="elicitation-ui-required-marker">*</span>
            )}
          </label>
          <div data-slot="elicitation-ui-enum-field-options">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                autoFocus={autoFocus && index === 0}
                onClick={option.onSelect}
                data-slot="elicitation-ui-enum-field-option"
                data-selected={option.isSelected || undefined}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </Comp>
  );
});
ElicitationUIEnumField.displayName = "ElicitationUI.EnumField";
