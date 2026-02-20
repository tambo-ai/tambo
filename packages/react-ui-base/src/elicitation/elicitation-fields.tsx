"use client";

import type { ElicitationField } from "./elicitation-context";
import * as React from "react";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationFieldsRenderProps {
  fields: ElicitationField[];
  isSingleEntry: boolean;
}

export interface ElicitationFieldsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children?:
    | React.ReactNode
    | ((props: ElicitationFieldsRenderProps) => React.ReactNode);
}

const getInputType = (field: ElicitationField): string => {
  if (field.schema.type !== "string" || !("format" in field.schema)) {
    return "text";
  }

  switch (field.schema.format) {
    case "email":
      return "email";
    case "uri":
      return "url";
    case "date":
      return "date";
    case "date-time":
      return "datetime-local";
    default:
      return "text";
  }
};

const ElicitationFieldInput = ({
  field,
  inputId,
}: {
  field: ElicitationField;
  inputId: string;
}) => {
  if (field.schema.type === "boolean") {
    const boolValue =
      typeof field.value === "boolean" ? field.value : undefined;

    return (
      <div data-slot="elicitation-field-boolean-options">
        <button
          type="button"
          onClick={() => field.setValue(true)}
          data-slot="elicitation-field-boolean-true"
          data-state={boolValue === true ? "selected" : "unselected"}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => field.setValue(false)}
          data-slot="elicitation-field-boolean-false"
          data-state={boolValue === false ? "selected" : "unselected"}
        >
          No
        </button>
      </div>
    );
  }

  if (field.schema.type === "string" && "enum" in field.schema) {
    const options = field.schema.enum ?? [];
    const optionNames =
      "enumNames" in field.schema ? (field.schema.enumNames ?? []) : options;

    return (
      <div data-slot="elicitation-field-enum-options">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            autoFocus={field.autoFocus && index === 0}
            onClick={() => field.setValue(option)}
            data-slot="elicitation-field-enum-option"
            data-state={field.value === option ? "selected" : "unselected"}
          >
            {optionNames[index] ?? option}
          </button>
        ))}
      </div>
    );
  }

  if (field.schema.type === "string") {
    const value = typeof field.value === "string" ? field.value : "";

    return (
      <input
        id={inputId}
        autoFocus={field.autoFocus}
        type={getInputType(field)}
        value={value}
        onChange={(event) => field.setValue(event.currentTarget.value)}
        data-slot="elicitation-field-input"
        aria-invalid={!!field.validationError}
      />
    );
  }

  if (field.schema.type === "number" || field.schema.type === "integer") {
    const value = typeof field.value === "number" ? field.value : "";

    return (
      <input
        id={inputId}
        autoFocus={field.autoFocus}
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          field.setValue(nextValue === "" ? undefined : +nextValue);
        }}
        step={field.schema.type === "integer" ? 1 : "any"}
        data-slot="elicitation-field-input"
        aria-invalid={!!field.validationError}
      />
    );
  }

  return null;
};

const renderDefaultFields = (fields: ElicitationField[]) => {
  return fields.map((field) => (
    <div key={field.name} data-slot="elicitation-field" data-name={field.name}>
      <label
        htmlFor={`${field.name}-field`}
        data-slot="elicitation-field-label"
      >
        {field.schema.description ?? field.name}
        {field.required ? "*" : ""}
      </label>
      <ElicitationFieldInput field={field} inputId={`${field.name}-field`} />
      {field.validationError ? (
        <p data-slot="elicitation-field-error">{field.validationError}</p>
      ) : null}
    </div>
  ));
};

export const ElicitationFields = React.forwardRef<
  HTMLDivElement,
  ElicitationFieldsProps
>(({ children, ...props }, ref) => {
  const { fields, isSingleEntry } = useElicitationContext();
  const renderProps = React.useMemo<ElicitationFieldsRenderProps>(
    () => ({
      fields,
      isSingleEntry,
    }),
    [fields, isSingleEntry],
  );

  return (
    <div ref={ref} data-slot="elicitation-fields" {...props}>
      {typeof children === "function"
        ? children(renderProps)
        : renderDefaultFields(fields)}
    </div>
  );
});
ElicitationFields.displayName = "Elicitation.Fields";
