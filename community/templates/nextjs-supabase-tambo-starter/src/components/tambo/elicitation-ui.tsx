"use client";

import { cn } from "@/lib/utils";
import {
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useId, useMemo, useState } from "react";

type FieldSchema =
  TamboElicitationRequest["requestedSchema"]["properties"][string];

interface FieldProps {
  name: string;
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
  autoFocus?: boolean;
  validationError?: string | null;
}
const opsButton =
  "px-4 py-2 border text-xs tracking-widest uppercase \
   transition-colors \
   focus:outline-none focus-visible:ring-1 focus-visible:ring-primary";

const opsInput =
  "w-full px-3 py-2 border bg-background text-sm \
   text-foreground \
   focus:outline-none focus-visible:ring-1 focus-visible:ring-primary";



/* ───────────────── Boolean Field ───────────────── */

const BooleanField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  const boolValue = value as boolean | undefined;

  return (
    <div className="space-y-2">
      <label className="block text-xs tracking-widest uppercase text-muted-foreground">
        {schema.description ?? name}
        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </label>

      <div
        role="group"
        aria-label={name}
        className="flex gap-2"
      >
        {/* YES */}
        <button
          type="button"
          autoFocus={autoFocus}
          aria-pressed={boolValue === true}
          onClick={() => onChange(true)}
          className={cn(
            opsButton,
            "min-w-[96px]",
            boolValue === true
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-foreground hover:bg-muted"
          )}
        >
          YES
        </button>

        {/* NO */}
        <button
          type="button"
          aria-pressed={boolValue === false}
          onClick={() => onChange(false)}
          className={cn(
            opsButton,
            "min-w-[96px]",
            boolValue === false
              ? "border-border bg-[#1a1d23] text-foreground"
              : "border-border bg-secondary text-muted-foreground hover:bg-muted"
          )}
        >
          NO
        </button>
      </div>
    </div>
  );
};

/* ───────────────── Enum Field ───────────────── */

const EnumField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  if (schema.type !== "string" || !("enum" in schema)) return null;

  const options = schema.enum ?? [];
  const optionNames =
    "enumNames" in schema ? (schema.enumNames ?? []) : options;

  const stringValue = value as string | undefined;

  return (
    <div className="space-y-2">
      <label className="block text-xs tracking-widest uppercase text-muted-foreground">
        {schema.description ?? name}
        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </label>

      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const active = stringValue === opt;

          return (
            <button
              key={opt}
              type="button"
              autoFocus={autoFocus && i === 0}
              aria-pressed={active}
              onClick={() => onChange(opt)}
              className={cn(
                opsButton,
                "min-w-[96px]",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:bg-muted"
              )}
            >
              {optionNames[i] ?? opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};


/* ───────────────── String Field ───────────────── */

const StringField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  validationError,
}) => {
  if (schema.type !== "string") return null;

  const inputId = useId();
  const stringValue = (value as string | undefined) ?? "";
  const hasError = !!validationError;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-xs tracking-widest uppercase text-muted-foreground"
      >
        {schema.description ?? name}
        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </label>

      <input
        id={inputId}
        value={stringValue}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={schema.description ?? name}
        className={cn(
          opsInput,
          hasError
            ? "border-destructive"
            : "border-border"
        )}
      />

      {hasError && (
        <p className="text-xs text-destructive">
          {validationError}
        </p>
      )}
    </div>
  );
};

/* ───────────────── Number Field ───────────────── */

const NumberField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  validationError,
}) => {
  if (schema.type !== "number" && schema.type !== "integer") return null;

  const inputId = useId();
  const hasError = !!validationError;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-xs tracking-widest uppercase text-muted-foreground"
      >
        {schema.description ?? name}
        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </label>

      <input
        id={inputId}
        type="number"
        autoFocus={autoFocus}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value === ""
              ? undefined
              : e.currentTarget.valueAsNumber
          )
        }
        className={cn(
          opsInput,
          hasError ? "border-destructive" : "border-border"
        )}
      />

      {hasError && (
        <p className="text-xs text-destructive">
          {validationError}
        </p>
      )}
    </div>
  );
};


/* ───────────────── Field Switch ───────────────── */

const Field: React.FC<FieldProps> = (props) => {
  const { schema } = props;

  if (schema.type === "boolean") {
    return <BooleanField {...props} />;
  }

  if (schema.type === "string" && "enum" in schema) {
    return <EnumField {...props} />;
  }

  if (schema.type === "string") {
    return <StringField {...props} />;
  }

  if (schema.type === "number" || schema.type === "integer") {
    return <NumberField {...props} />;
  }

  return null;
};

/* ───────────────── Main UI ───────────────── */

export interface ElicitationUIProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  className?: string;
}

export const ElicitationUI: React.FC<ElicitationUIProps> = ({
  request,
  onResponse,
  className,
}) => {
  const fields = useMemo(
    () => Object.entries(request.requestedSchema.properties),
    [request],
  );
  const requiredFields = request.requestedSchema.required ?? [];

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = (name: string, value: unknown) => {
    setFormData((p) => ({ ...p, [name]: value }));
    setTouched((p) => new Set(p).add(name));
  };

  const isValid = fields.every(([name]) => {
    const required = requiredFields.includes(name);
    if (required && formData[name] == null) return false;
    return true;
  });

  return (
    <section
      className={cn(
        "border border-border bg-card",
        className,
      )}
    >
      {/* ───── Header ───── */}
      <div className="border-b border-border bg-[#0c0e12] px-6 py-4">
        <h2 className="text-xs tracking-[0.35em] uppercase text-primary font-semibold">
          SYSTEM AUTHORIZATION
        </h2>
      </div>

      {/* ───── Message / Context ───── */}
      <div className="px-6 py-4 text-sm text-foreground border-b border-border bg-[#0f1115]">
        {request.message}
      </div>

      {/* ───── Fields ───── */}
      <div className="px-6 py-5 space-y-4">
        {fields.map(([name, schema], i) => (
          <Field
            key={name}
            name={name}
            schema={schema}
            value={formData[name]}
            required={requiredFields.includes(name)}
            autoFocus={i === 0}
            onChange={(v) => handleChange(name, v)}
          />
        ))}
      </div>

      {/* ───── Actions ───── */}
      <div className="flex justify-end gap-3 border-t border-border bg-[#0c0e12] px-6 py-4">
        {/* Cancel = destructive */}
        <button
          type="button"
          onClick={() => onResponse({ action: "cancel" })}
          className="
            border border-destructive
            px-4 py-2
            text-xs tracking-widest uppercase
            text-destructive
            hover:bg-destructive/10
            transition-colors
          "
        >
          Cancel
        </button>

        {/* Decline = neutral */}
        <button
          type="button"
          onClick={() => onResponse({ action: "decline" })}
          className="
            border border-border
            bg-secondary
            px-4 py-2
            text-xs tracking-widest uppercase
            text-foreground
            hover:bg-muted
            transition-colors
          "
        >
          Decline
        </button>

        {/* Confirm = authority */}
        <button
          type="button"
          disabled={!isValid}
          onClick={() =>
            onResponse({ action: "accept", content: formData })
          }
          className={cn(
            "border px-6 py-2 text-xs tracking-[0.25em] uppercase transition-opacity",
            isValid
              ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
              : "border-border text-muted-foreground opacity-40 cursor-not-allowed"
          )}
        >
          Confirm
        </button>
      </div>
    </section>
  );
};
