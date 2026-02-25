"use client";

import { ComponentRenderFn, mergeProps, useRender } from "@base-ui/react";
import * as React from "react";
import type { ElicitationField as ElicitationContextField } from "./elicitation-context";
import { useElicitationContext } from "./elicitation-context";

export interface ElicitationFieldsState {
  single: boolean;
}

export interface ElicitationFieldsRenderProps {
  fields: ElicitationContextField[];
}

export type ElicitationFieldsProps = useRender.ComponentProps<
  "div",
  ElicitationFieldsState,
  ElicitationFieldsRenderProps
>;

export type ElicitationFieldKind =
  | "boolean"
  | "enum"
  | "string"
  | "number"
  | "unsupported";

export interface ElicitationFieldState {
  kind: ElicitationFieldKind;
  required: boolean;
  invalid: boolean;
}

export interface ElicitationFieldRenderProps {
  field: ElicitationContextField;
  kind: ElicitationFieldKind;
  label: string;
  inputId: string;
  errorId: string;
  required: boolean;
  invalid: boolean;
}

export type ElicitationFieldProps = useRender.ComponentProps<
  "div",
  ElicitationFieldState,
  ElicitationFieldRenderProps
> & {
  field: ElicitationContextField;
};

export type ElicitationFieldContextValue = ElicitationFieldRenderProps;

const ElicitationFieldContext =
  React.createContext<ElicitationFieldContextValue | null>(null);

export const useElicitationField = (): ElicitationFieldContextValue => {
  const context = React.useContext(ElicitationFieldContext);
  if (!context) {
    throw new Error(
      "Elicitation field components must be used within Elicitation.Field",
    );
  }
  return context;
};

export const ElicitationFields = React.forwardRef<
  HTMLDivElement,
  ElicitationFieldsProps
>(({ render, children, ...props }, ref) => {
  const { fields, isSingleEntry } = useElicitationContext();

  const defaultContent = React.useMemo(() => {
    return fields.map((field) => (
      <ElicitationField key={field.name} field={field} />
    ));
  }, [fields]);

  return useRender({
    defaultTagName: "div",
    ref,
    render: render as ComponentRenderFn<
      ElicitationFieldsProps,
      ElicitationFieldsState
    >,
    props: mergeProps(props, {
      fields,
      children: children ?? defaultContent,
    }),
    state: {
      single: isSingleEntry,
    },
  });
});
ElicitationFields.displayName = "Elicitation.Fields";

export const ElicitationField = React.forwardRef<
  HTMLDivElement,
  ElicitationFieldProps
>(({ field, render, children, ...props }, ref) => {
  const inputId = React.useId();
  const errorId = `${inputId}-error`;
  const kind = getFieldKind(field);
  const label = getFieldLabel(field);
  const invalid = !!field.validationError;

  const contextValue = React.useMemo<ElicitationFieldContextValue>(() => {
    return {
      field,
      kind,
      label,
      inputId,
      errorId,
      required: field.required,
      invalid,
    };
  }, [errorId, field, inputId, invalid, kind, label]);

  const defaultContent = (
    <>
      <ElicitationFieldLabel />
      <ElicitationFieldInput />
      <ElicitationFieldError />
    </>
  );

  const element = useRender({
    defaultTagName: "div",
    ref,
    render: render as ComponentRenderFn<
      useRender.ComponentProps<"div">,
      ElicitationFieldState
    >,
    props: mergeProps(props, {
      "data-slot": "elicitation-field",
      "data-name": field.name,
      "data-kind": kind,
      "data-required": field.required || undefined,
      "data-invalid": invalid || undefined,
      children: children ?? defaultContent,
    }),
    state: {
      kind,
      required: field.required,
      invalid,
    },
  });

  return (
    <ElicitationFieldContext.Provider value={contextValue}>
      {element}
    </ElicitationFieldContext.Provider>
  );
});
ElicitationField.displayName = "Elicitation.Field";

export interface ElicitationFieldLabelState {
  required: boolean;
}

export interface ElicitationFieldLabelRenderProps {
  label: string;
  required: boolean;
  inputId: string;
}

export type ElicitationFieldLabelProps = useRender.ComponentProps<
  "label",
  ElicitationFieldLabelState,
  ElicitationFieldLabelRenderProps
>;

export const ElicitationFieldLabel = React.forwardRef<
  HTMLLabelElement,
  ElicitationFieldLabelProps
>(({ render, children, ...props }, ref) => {
  const { label, required, inputId } = useElicitationField();

  return useRender({
    defaultTagName: "label",
    ref,
    render: render as ComponentRenderFn<
      ElicitationFieldLabelProps,
      ElicitationFieldLabelState
    >,
    props: mergeProps(props, {
      htmlFor: inputId,
      "data-slot": "elicitation-field-label",
      children: children ?? `${label}${required ? "*" : ""}`,
    }),
    state: {
      required,
    },
  });
});
ElicitationFieldLabel.displayName = "Elicitation.FieldLabel";

export interface ElicitationFieldErrorState {
  invalid: boolean;
}

export interface ElicitationFieldErrorRenderProps {
  error: string | null;
  errorId: string;
  invalid: boolean;
}

export type ElicitationFieldErrorProps = useRender.ComponentProps<
  "p",
  ElicitationFieldErrorState,
  ElicitationFieldErrorRenderProps
> & {
  keepMounted?: boolean;
};

export const ElicitationFieldError = React.forwardRef<
  HTMLParagraphElement,
  ElicitationFieldErrorProps
>(({ render, children, keepMounted = false, ...props }, ref) => {
  const { field, errorId, invalid } = useElicitationField();
  const enabled = invalid || keepMounted;

  return useRender({
    defaultTagName: "p",
    ref,
    enabled,
    render: render as ComponentRenderFn<
      ElicitationFieldErrorProps,
      ElicitationFieldErrorState
    >,
    props: mergeProps(props, {
      id: errorId,
      "data-slot": "elicitation-field-error",
      "aria-live": "polite",
      "aria-hidden": !invalid || undefined,
      hidden: keepMounted && !invalid,
      children: children ?? field.validationError,
    }),
    state: {
      invalid,
    },
  });
});
ElicitationFieldError.displayName = "Elicitation.FieldError";

export interface ElicitationFieldInputState {
  kind: ElicitationFieldKind;
}

export interface ElicitationFieldInputRenderProps {
  kind: ElicitationFieldKind;
}

export type ElicitationFieldInputProps = useRender.ComponentProps<
  "div",
  ElicitationFieldInputState,
  ElicitationFieldInputRenderProps
>;

export const ElicitationFieldInput = React.forwardRef<
  HTMLDivElement,
  ElicitationFieldInputProps
>(({ render, children, ...props }, ref) => {
  const { kind } = useElicitationField();

  const defaultContent = (
    <>
      <ElicitationFieldBooleanInput />
      <ElicitationFieldEnumInput />
      <ElicitationFieldStringInput />
      <ElicitationFieldNumberInput />
    </>
  );

  return useRender({
    defaultTagName: "div",
    ref,
    enabled: kind !== "unsupported",
    render: render as ComponentRenderFn<
      ElicitationFieldInputProps,
      ElicitationFieldInputState
    >,
    props: mergeProps(props, {
      "data-slot": "elicitation-field-control",
      "data-kind": kind,
      children: children ?? defaultContent,
    }),
    state: {
      kind,
    },
  });
});
ElicitationFieldInput.displayName = "Elicitation.FieldInput";

export interface ElicitationFieldBooleanInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  trueLabel?: React.ReactNode;
  falseLabel?: React.ReactNode;
  trueButtonProps?: Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "onClick" | "autoFocus"
  >;
  falseButtonProps?: Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "onClick"
  >;
}

export const ElicitationFieldBooleanInput = React.forwardRef<
  HTMLDivElement,
  ElicitationFieldBooleanInputProps
>(
  (
    {
      trueLabel = "Yes",
      falseLabel = "No",
      trueButtonProps,
      falseButtonProps,
      ...props
    },
    ref,
  ) => {
    const { field } = useElicitationField();
    if (field.schema.type !== "boolean") {
      return null;
    }

    const boolValue =
      typeof field.value === "boolean" ? field.value : undefined;

    return (
      <div ref={ref} data-slot="elicitation-field-boolean-options" {...props}>
        <button
          type="button"
          autoFocus={field.autoFocus}
          onClick={() => field.setValue(true)}
          aria-pressed={boolValue === true}
          data-slot="elicitation-field-boolean-true"
          data-state={boolValue === true ? "selected" : "unselected"}
          {...trueButtonProps}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          onClick={() => field.setValue(false)}
          aria-pressed={boolValue === false}
          data-slot="elicitation-field-boolean-false"
          data-state={boolValue === false ? "selected" : "unselected"}
          {...falseButtonProps}
        >
          {falseLabel}
        </button>
      </div>
    );
  },
);
ElicitationFieldBooleanInput.displayName = "Elicitation.FieldBooleanInput";

export interface ElicitationFieldEnumInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  getOptionLabel?: (option: string, index: number) => React.ReactNode;
  getOptionProps?: (
    option: string,
    index: number,
    selected: boolean,
  ) => Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "onClick" | "autoFocus" | "children"
  >;
}

export const ElicitationFieldEnumInput = React.forwardRef<
  HTMLDivElement,
  ElicitationFieldEnumInputProps
>(({ getOptionLabel, getOptionProps, ...props }, ref) => {
  const { field } = useElicitationField();
  if (!isEnumField(field)) {
    return null;
  }

  const options = field.schema.enum ?? [];
  const optionNames =
    "enumNames" in field.schema ? (field.schema.enumNames ?? []) : options;

  return (
    <div ref={ref} data-slot="elicitation-field-enum-options" {...props}>
      {options.map((option, index) => {
        const selected = field.value === option;
        const optionLabel = getOptionLabel
          ? getOptionLabel(option, index)
          : (optionNames[index] ?? option);
        const optionProps = getOptionProps
          ? getOptionProps(option, index, selected)
          : undefined;

        return (
          <button
            key={option}
            type="button"
            autoFocus={field.autoFocus && index === 0}
            onClick={() => field.setValue(option)}
            data-slot="elicitation-field-enum-option"
            data-state={selected ? "selected" : "unselected"}
            {...optionProps}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
});
ElicitationFieldEnumInput.displayName = "Elicitation.FieldEnumInput";

export type ElicitationFieldStringInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "value" | "autoFocus" | "required"
>;

export const ElicitationFieldStringInput = React.forwardRef<
  HTMLInputElement,
  ElicitationFieldStringInputProps
>(({ onChange, placeholder, ...props }, ref) => {
  const { field, inputId, errorId, invalid, label } = useElicitationField();
  if (field.schema.type !== "string" || isEnumField(field)) {
    return null;
  }

  const value = typeof field.value === "string" ? field.value : "";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) {
      return;
    }
    field.setValue(event.currentTarget.value);
  };

  return (
    <input
      ref={ref}
      id={inputId}
      autoFocus={field.autoFocus}
      type={getInputType(field)}
      value={value}
      onChange={handleChange}
      minLength={
        "minLength" in field.schema ? field.schema.minLength : undefined
      }
      maxLength={
        "maxLength" in field.schema ? field.schema.maxLength : undefined
      }
      required={field.required}
      placeholder={placeholder ?? label}
      data-slot="elicitation-field-input"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {...props}
    />
  );
});
ElicitationFieldStringInput.displayName = "Elicitation.FieldStringInput";

export type ElicitationFieldNumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "value" | "autoFocus" | "required"
>;

export const ElicitationFieldNumberInput = React.forwardRef<
  HTMLInputElement,
  ElicitationFieldNumberInputProps
>(({ onChange, placeholder, ...props }, ref) => {
  const { field, inputId, errorId, invalid, label } = useElicitationField();
  if (field.schema.type !== "number" && field.schema.type !== "integer") {
    return null;
  }

  const value = typeof field.value === "number" ? field.value : "";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) {
      return;
    }

    const nextValue = event.currentTarget.value;
    if (nextValue === "") {
      field.setValue(undefined);
      return;
    }

    field.setValue(+nextValue);
  };

  return (
    <input
      ref={ref}
      id={inputId}
      autoFocus={field.autoFocus}
      type="number"
      value={value}
      onChange={handleChange}
      step={field.schema.type === "integer" ? 1 : "any"}
      min={field.schema.minimum}
      max={field.schema.maximum}
      required={field.required}
      placeholder={placeholder ?? label}
      data-slot="elicitation-field-input"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {...props}
    />
  );
});
ElicitationFieldNumberInput.displayName = "Elicitation.FieldNumberInput";

const getFieldLabel = (field: ElicitationContextField): string => {
  return field.schema.description ?? field.name;
};

type ElicitationEnumSchema = Extract<
  ElicitationContextField["schema"],
  { type: "string" }
> & { enum: string[]; enumNames?: string[] };

const isEnumField = (
  field: ElicitationContextField,
): field is ElicitationContextField & { schema: ElicitationEnumSchema } => {
  if (field.schema.type !== "string") {
    return false;
  }
  if (!("enum" in field.schema)) {
    return false;
  }
  return Array.isArray(field.schema.enum);
};

const getFieldKind = (field: ElicitationContextField): ElicitationFieldKind => {
  if (field.schema.type === "boolean") {
    return "boolean";
  }

  if (isEnumField(field)) {
    return "enum";
  }

  if (field.schema.type === "string") {
    return "string";
  }

  if (field.schema.type === "number" || field.schema.type === "integer") {
    return "number";
  }

  return "unsupported";
};

const getInputType = (field: ElicitationContextField): string => {
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
