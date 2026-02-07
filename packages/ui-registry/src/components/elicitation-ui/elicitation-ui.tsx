"use client";

import {
  ElicitationUIBase,
  type ElicitationUIActionsRenderProps,
  type ElicitationUIBooleanFieldRenderProps,
  type ElicitationUIEnumFieldRenderProps,
  type ElicitationUINumberFieldRenderProps,
  type ElicitationUIStringFieldRenderProps,
  type FieldSchema,
} from "@tambo-ai/react-ui-base/elicitation-ui";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cn } from "@tambo-ai/ui-registry/utils";
import * as React from "react";

/**
 * Styled boolean field using render props from the base component.
 * @returns A styled yes/no button group
 */
const StyledBooleanField: React.FC<{
  name: string;
  autoFocus?: boolean;
}> = ({ name, autoFocus }) => (
  <ElicitationUIBase.BooleanField name={name} autoFocus={autoFocus}>
    {(props: ElicitationUIBooleanFieldRenderProps) => (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            autoFocus={props.autoFocus}
            onClick={props.onSelectYes}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg border transition-colors",
              props.isYesSelected
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={props.onSelectNo}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg border transition-colors",
              props.isNoSelected
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            No
          </button>
        </div>
      </div>
    )}
  </ElicitationUIBase.BooleanField>
);

/**
 * Styled enum field using render props from the base component.
 * @returns A styled button group for enum options
 */
const StyledEnumField: React.FC<{
  name: string;
  autoFocus?: boolean;
}> = ({ name, autoFocus }) => (
  <ElicitationUIBase.EnumField name={name} autoFocus={autoFocus}>
    {(props: ElicitationUIEnumFieldRenderProps) => (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {props.options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              autoFocus={props.autoFocus && index === 0}
              onClick={option.onSelect}
              className={cn(
                "px-4 py-2 rounded-lg border transition-colors",
                option.isSelected
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background border-border hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    )}
  </ElicitationUIBase.EnumField>
);

/**
 * Styled string field using render props from the base component.
 * @returns A styled text input with validation feedback
 */
const StyledStringField: React.FC<{
  name: string;
  autoFocus?: boolean;
}> = ({ name, autoFocus }) => (
  <ElicitationUIBase.StringField name={name} autoFocus={autoFocus}>
    {(props: ElicitationUIStringFieldRenderProps) => (
      <div className="space-y-2">
        <label
          htmlFor={props.inputId}
          className="text-sm font-medium text-foreground"
        >
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <input
          id={props.inputId}
          type={props.inputType}
          autoFocus={props.autoFocus}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
            props.hasError
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-accent",
          )}
          placeholder={props.label}
          minLength={props.minLength}
          maxLength={props.maxLength}
          required={props.required}
          aria-invalid={props.hasError || undefined}
          aria-describedby={props.hasError ? props.errorId : undefined}
        />
        {props.validationError && (
          <p
            id={props.errorId}
            className="text-xs text-destructive"
            aria-live="polite"
          >
            {props.validationError}
          </p>
        )}
      </div>
    )}
  </ElicitationUIBase.StringField>
);

/**
 * Styled number field using render props from the base component.
 * @returns A styled number input with validation feedback
 */
const StyledNumberField: React.FC<{
  name: string;
  autoFocus?: boolean;
}> = ({ name, autoFocus }) => (
  <ElicitationUIBase.NumberField name={name} autoFocus={autoFocus}>
    {(props: ElicitationUINumberFieldRenderProps) => (
      <div className="space-y-2">
        <label
          htmlFor={props.inputId}
          className="text-sm font-medium text-foreground"
        >
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <input
          id={props.inputId}
          type="number"
          autoFocus={props.autoFocus}
          value={props.value ?? ""}
          onChange={(e) => {
            const { value, valueAsNumber } = e.currentTarget;
            props.onChange(
              value === "" || Number.isNaN(valueAsNumber)
                ? undefined
                : valueAsNumber,
            );
          }}
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
            props.hasError
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-accent",
          )}
          placeholder={props.label}
          min={props.min}
          max={props.max}
          step={props.step}
          required={props.required}
          aria-invalid={props.hasError || undefined}
          aria-describedby={props.hasError ? props.errorId : undefined}
        />
        {props.validationError && (
          <p
            id={props.errorId}
            className="text-xs text-destructive"
            aria-live="polite"
          >
            {props.validationError}
          </p>
        )}
      </div>
    )}
  </ElicitationUIBase.NumberField>
);

/**
 * Styled field dispatcher that delegates to the correct styled field type.
 * @returns The appropriate styled field component
 */
const StyledField: React.FC<{
  name: string;
  schema: FieldSchema;
  autoFocus?: boolean;
}> = ({ name, schema, autoFocus }) => {
  if (schema.type === "boolean") {
    return <StyledBooleanField name={name} autoFocus={autoFocus} />;
  }

  if (schema.type === "string" && "enum" in schema) {
    return <StyledEnumField name={name} autoFocus={autoFocus} />;
  }

  if (schema.type === "string") {
    return <StyledStringField name={name} autoFocus={autoFocus} />;
  }

  if (schema.type === "number" || schema.type === "integer") {
    return <StyledNumberField name={name} autoFocus={autoFocus} />;
  }

  return null;
};

/**
 * Styled actions bar using render props from the base component.
 * @returns A styled action button container with cancel, decline, and optional submit
 */
const StyledActions: React.FC = () => (
  <ElicitationUIBase.Actions>
    {(props: ElicitationUIActionsRenderProps) => (
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={props.onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={props.onDecline}
          className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        >
          Decline
        </button>
        {!props.isSingleEntry && (
          <button
            type="button"
            onClick={props.onAccept}
            disabled={!props.isValid}
            className="px-6 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit
          </button>
        )}
      </div>
    )}
  </ElicitationUIBase.Actions>
);

/**
 * Props for the ElicitationUI component.
 */
export interface ElicitationUIProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  className?: string;
}

/**
 * Styled elicitation UI component.
 * Handles both single-entry and multiple-entry modes for MCP elicitation requests.
 * @returns A styled elicitation form with fields and action buttons
 */
export const ElicitationUI: React.FC<ElicitationUIProps> = ({
  request,
  onResponse,
  className,
}) => {
  const fields = Object.entries(request.requestedSchema.properties);

  return (
    <ElicitationUIBase.Root
      request={request}
      onResponse={onResponse}
      className={cn(
        "flex flex-col rounded-xl bg-background border border-border p-4 space-y-4",
        className,
      )}
    >
      <ElicitationUIBase.Title className="text-base font-semibold text-foreground" />
      <div className="space-y-3">
        {fields.map(([name, schema], index) => (
          <StyledField
            key={name}
            name={name}
            schema={schema}
            autoFocus={index === 0}
          />
        ))}
      </div>
      <StyledActions />
    </ElicitationUIBase.Root>
  );
};
