"use client";

import { Elicitation as ElicitationBase } from "@tambo-ai/react-ui-base/elicitation";
import type {
  ElicitationField,
  ElicitationFieldsState,
} from "@tambo-ai/react-ui-base/elicitation";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cn } from "@tambo-ai/ui-registry/utils";
import { cva } from "class-variance-authority";
import * as React from "react";

const elicitationRootStyles = cva(
  "flex flex-col rounded-xl bg-background border border-border p-4 gap-4 data-[mode=single]:gap-3",
);

const fieldsStyles = cva("flex flex-col gap-3");
const fieldRowStyles = cva("flex flex-col gap-2");
const fieldLabelStyles = cva("text-sm font-medium text-foreground");
const requiredMarkStyles = cva("text-destructive");
const fieldErrorStyles = cva("text-xs text-destructive");
const choiceGroupStyles = cva("flex gap-2");
const choiceListStyles = cva("flex flex-wrap gap-2");

const choiceButtonStyles = cva(
  "px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
  {
    variants: {
      fill: {
        true: "flex-1",
        false: "",
      },
      selected: {
        true: "bg-accent text-accent-foreground border-accent",
        false: "bg-background border-border hover:bg-muted",
      },
    },
    defaultVariants: {
      fill: false,
      selected: false,
    },
  },
);

const inputStyles = cva(
  "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
  {
    variants: {
      hasError: {
        true: "border-destructive focus:ring-destructive",
        false: "border-border focus:ring-accent",
      },
    },
    defaultVariants: {
      hasError: false,
    },
  },
);

const actionsStyles = cva("flex justify-end gap-2 pt-2");
const cancelActionStyles = cva(
  "px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors",
);
const declineActionStyles = cva(
  "px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors",
);
const submitActionStyles = cva(
  "px-6 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
);

const getLabelText = (field: ElicitationField): string => {
  return field.schema.description ?? field.name;
};

const getStringInputType = (field: ElicitationField): string => {
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

const ElicitationFieldControl = ({
  field,
  inputId,
  errorId,
}: {
  field: ElicitationField;
  inputId: string;
  errorId: string;
}) => {
  const hasError = !!field.validationError;

  if (field.schema.type === "boolean") {
    const value = typeof field.value === "boolean" ? field.value : undefined;

    return (
      <div className={choiceGroupStyles()}>
        <button
          type="button"
          autoFocus={field.autoFocus}
          onClick={() => field.setValue(true)}
          className={choiceButtonStyles({
            fill: true,
            selected: value === true,
          })}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => field.setValue(false)}
          className={choiceButtonStyles({
            fill: true,
            selected: value === false,
          })}
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
      <div className={choiceListStyles()}>
        {options.map((option, index) => {
          const isSelected = field.value === option;
          return (
            <button
              key={option}
              type="button"
              autoFocus={field.autoFocus && index === 0}
              onClick={() => field.setValue(option)}
              className={choiceButtonStyles({ selected: isSelected })}
            >
              {optionNames[index] ?? option}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.schema.type === "string") {
    const value = typeof field.value === "string" ? field.value : "";

    return (
      <input
        id={inputId}
        type={getStringInputType(field)}
        autoFocus={field.autoFocus}
        value={value}
        onChange={(event) => field.setValue(event.currentTarget.value)}
        minLength={
          "minLength" in field.schema ? field.schema.minLength : undefined
        }
        maxLength={
          "maxLength" in field.schema ? field.schema.maxLength : undefined
        }
        required={field.required}
        placeholder={getLabelText(field)}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={inputStyles({ hasError })}
      />
    );
  }

  if (field.schema.type === "number" || field.schema.type === "integer") {
    const value = typeof field.value === "number" ? field.value : "";

    return (
      <input
        id={inputId}
        type="number"
        autoFocus={field.autoFocus}
        value={value}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          const parsedValue = event.currentTarget.valueAsNumber;
          if (nextValue === "" || Number.isNaN(parsedValue)) {
            field.setValue(undefined);
            return;
          }
          field.setValue(parsedValue);
        }}
        min={field.schema.minimum}
        max={field.schema.maximum}
        step={field.schema.type === "integer" ? 1 : "any"}
        required={field.required}
        placeholder={getLabelText(field)}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={inputStyles({ hasError })}
      />
    );
  }

  return null;
};

const ElicitationFieldRow = ({ field }: { field: ElicitationField }) => {
  const inputId = React.useId();
  const errorId = `${inputId}-error`;

  return (
    <div className={fieldRowStyles()}>
      <label htmlFor={inputId} className={fieldLabelStyles()}>
        {getLabelText(field)}
        {field.required ? (
          <span className={requiredMarkStyles()}>{" *"}</span>
        ) : null}
      </label>
      <ElicitationFieldControl
        field={field}
        inputId={inputId}
        errorId={errorId}
      />
      {field.validationError ? (
        <p id={errorId} className={fieldErrorStyles()} aria-live="polite">
          {field.validationError}
        </p>
      ) : null}
    </div>
  );
};

/**
 * Props for the ElicitationUI component.
 */
export interface ElicitationUIProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  className?: string;
}

/**
 * Styled wrapper around react-ui-base Elicitation primitives.
 * Business logic (validation, mode handling, actions) is owned by react-ui-base.
 */
export const ElicitationUI: React.FC<ElicitationUIProps> = ({
  request,
  onResponse,
  className,
}) => {
  return (
    <ElicitationBase.Root
      request={request}
      onResponse={onResponse}
      className={cn(elicitationRootStyles(), className)}
    >
      <ElicitationBase.Message className="text-base font-semibold text-foreground" />
      <ElicitationBase.Fields
        className={fieldsStyles()}
        render={(_props, { fields }: ElicitationFieldsState) => {
          return (
            <>
              {fields.map((field) => (
                <ElicitationFieldRow key={field.name} field={field} />
              ))}
            </>
          );
        }}
      />
      <ElicitationBase.Actions className={actionsStyles()}>
        <ElicitationBase.ActionCancel className={cancelActionStyles()} />
        <ElicitationBase.ActionDecline className={declineActionStyles()} />
        <ElicitationBase.ActionSubmit className={submitActionStyles()} />
      </ElicitationBase.Actions>
    </ElicitationBase.Root>
  );
};
