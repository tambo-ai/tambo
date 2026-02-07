import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useElicitationUIContext } from "../root/elicitation-ui-context";
import type { FieldSchema } from "../root/validation";

/**
 * Props passed to the BooleanField render function.
 */
export interface ElicitationUIBooleanFieldRenderProps {
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
  /** The current boolean value, or undefined if not set. */
  value: boolean | undefined;
  /** Whether the "Yes" option is selected. */
  isYesSelected: boolean;
  /** Whether the "No" option is selected. */
  isNoSelected: boolean;
  /** Handler to select "Yes". */
  onSelectYes: () => void;
  /** Handler to select "No". */
  onSelectNo: () => void;
}

export type ElicitationUIBooleanFieldProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement> & {
      /** The field name key. */
      name: string;
      /** Whether this field should auto-focus. */
      autoFocus?: boolean;
    },
    ElicitationUIBooleanFieldRenderProps
  >;

/**
 * Boolean field primitive for the elicitation UI.
 * Renders a yes/no selection for boolean schema fields.
 * @returns A div element with yes/no button controls, or null if the field schema is not boolean
 */
export const ElicitationUIBooleanField = React.forwardRef<
  HTMLDivElement,
  ElicitationUIBooleanFieldProps
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
  if (schema.type !== "boolean") {
    return null;
  }

  const required = requiredFields.includes(name);
  const value = formData[name] as boolean | undefined;
  const label = schema.description ?? name;
  const onChange = isSingleEntry ? handleSingleEntryChange : handleFieldChange;

  const onSelectYes = () => onChange(name, true);
  const onSelectNo = () => onChange(name, false);

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    name,
    schema,
    label,
    required,
    autoFocus,
    value,
    isYesSelected: value === true,
    isNoSelected: value === false,
    onSelectYes,
    onSelectNo,
  });

  return (
    <Comp
      ref={ref}
      data-slot="elicitation-ui-boolean-field"
      data-field-name={name}
      data-value={value === undefined ? undefined : String(value)}
      {...componentProps}
    >
      {content ?? (
        <>
          <label data-slot="elicitation-ui-boolean-field-label">
            {label}
            {required && (
              <span data-slot="elicitation-ui-required-marker">*</span>
            )}
          </label>
          <div data-slot="elicitation-ui-boolean-field-options">
            <button
              type="button"
              autoFocus={autoFocus}
              onClick={onSelectYes}
              data-slot="elicitation-ui-boolean-field-option"
              data-selected={value === true || undefined}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onSelectNo}
              data-slot="elicitation-ui-boolean-field-option"
              data-selected={value === false || undefined}
            >
              No
            </button>
          </div>
        </>
      )}
    </Comp>
  );
});
ElicitationUIBooleanField.displayName = "ElicitationUI.BooleanField";
