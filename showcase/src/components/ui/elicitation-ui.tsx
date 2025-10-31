"use client";

import { cn } from "@/lib/utils";
import {
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";

/**
 * JSON Schema types for elicitation fields
 */
interface BaseFieldSchema {
  type: "string" | "number" | "integer" | "boolean";
  description?: string;
  default?: unknown;
}

interface StringFieldSchema extends BaseFieldSchema {
  type: "string";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "uri" | "date" | "date-time";
  enum?: string[];
  enumNames?: string[];
}

interface NumberFieldSchema extends BaseFieldSchema {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
}

interface BooleanFieldSchema extends BaseFieldSchema {
  type: "boolean";
}

type FieldSchema = StringFieldSchema | NumberFieldSchema | BooleanFieldSchema;

/**
 * Props for individual field components
 */
interface FieldProps {
  name: string;
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
  autoFocus?: boolean;
  showValidation?: boolean;
}

/**
 * Boolean field component - renders yes/no buttons
 */
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
      <label className="text-sm font-medium text-foreground">
        {schema.description || name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          autoFocus={autoFocus}
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg border transition-colors",
            boolValue === true
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted",
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg border transition-colors",
            boolValue === false
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
};

/**
 * Enum field component - renders button for each choice
 */
const EnumField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  const stringSchema = schema as StringFieldSchema;
  const options = stringSchema.enum || [];
  const optionNames = stringSchema.enumNames || options;
  const stringValue = value as string | undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {schema.description || name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            autoFocus={autoFocus && index === 0}
            onClick={() => onChange(option)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              stringValue === option
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            {optionNames[index] || option}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * String field component - renders text input with validation
 */
const StringField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  showValidation,
}) => {
  const stringSchema = schema as StringFieldSchema;
  const stringValue = (value as string | undefined) || "";

  // Map JSON Schema format to HTML5 input type
  const getInputType = (): string => {
    switch (stringSchema.format) {
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

  const inputType = getInputType();
  const isValid = validateField(value, schema, required);
  const showError = showValidation && !isValid;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {schema.description || name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={name}
        type={inputType}
        autoFocus={autoFocus}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
          showError
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-primary",
        )}
        placeholder={schema.description || name}
        minLength={stringSchema.minLength}
        maxLength={stringSchema.maxLength}
        pattern={stringSchema.pattern}
        required={required}
      />
      {showError && (
        <p className="text-xs text-destructive">
          {required && !stringValue
            ? "This field is required"
            : "Please enter a valid value"}
        </p>
      )}
    </div>
  );
};

/**
 * Number field component - renders number input with validation
 */
const NumberField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  showValidation,
}) => {
  const numberSchema = schema as NumberFieldSchema;
  const numberValue = value as number | undefined;

  const isValid = validateField(value, schema, required);
  const showError = showValidation && !isValid;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {schema.description || name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={name}
        type="number"
        autoFocus={autoFocus}
        value={numberValue ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : Number(val));
        }}
        className={cn(
          "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
          showError
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-primary",
        )}
        placeholder={schema.description || name}
        min={numberSchema.minimum}
        max={numberSchema.maximum}
        step={numberSchema.type === "integer" ? 1 : "any"}
        required={required}
      />
      {showError && (
        <p className="text-xs text-destructive">
          {required && numberValue === undefined
            ? "This field is required"
            : "Please enter a valid number"}
        </p>
      )}
    </div>
  );
};

/**
 * Generic field component that renders the appropriate input based on schema type
 */
const Field: React.FC<FieldProps> = (props) => {
  const { schema } = props;

  if (schema.type === "boolean") {
    return <BooleanField {...props} />;
  }

  if (schema.type === "string" && (schema as StringFieldSchema).enum) {
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

/**
 * Determines if the elicitation should use single-entry mode
 * (one field that is boolean or enum)
 */
function isSingleEntryMode(request: TamboElicitationRequest): boolean {
  const fields = Object.entries(request.requestedSchema.properties);

  if (fields.length !== 1) {
    return false;
  }

  const [, schema] = fields[0];

  return (
    schema.type === "boolean" ||
    (schema.type === "string" && !!(schema as StringFieldSchema).enum)
  );
}

/**
 * Validates a field value against its schema constraints
 */
function validateField(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): boolean {
  // Check required
  if (required && (value === undefined || value === "" || value === null)) {
    return false;
  }

  // If empty and not required, it's valid
  if (!required && (value === undefined || value === "" || value === null)) {
    return true;
  }

  // String validation
  if (schema.type === "string") {
    const stringSchema = schema as StringFieldSchema;
    const stringValue = value as string;

    if (stringSchema.minLength && stringValue.length < stringSchema.minLength) {
      return false;
    }

    if (stringSchema.maxLength && stringValue.length > stringSchema.maxLength) {
      return false;
    }

    if (stringSchema.pattern) {
      try {
        const regex = new RegExp(stringSchema.pattern);
        if (!regex.test(stringValue)) {
          return false;
        }
      } catch {
        // Invalid regex pattern, skip validation
      }
    }

    // Format validation (basic checks)
    if (stringSchema.format) {
      switch (stringSchema.format) {
        case "email":
          // Basic email validation
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
            return false;
          }
          break;
        case "uri":
          try {
            new URL(stringValue);
          } catch {
            return false;
          }
          break;
        // date and date-time are validated by the input type
      }
    }
  }

  // Number validation
  if (schema.type === "number" || schema.type === "integer") {
    const numberSchema = schema as NumberFieldSchema;
    const numberValue = value as number;

    if (isNaN(numberValue)) {
      return false;
    }

    if (
      numberSchema.minimum !== undefined &&
      numberValue < numberSchema.minimum
    ) {
      return false;
    }

    if (
      numberSchema.maximum !== undefined &&
      numberValue > numberSchema.maximum
    ) {
      return false;
    }

    if (schema.type === "integer" && !Number.isInteger(numberValue)) {
      return false;
    }
  }

  return true;
}

/**
 * Props for the ElicitationUI component
 */
export interface ElicitationUIProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  className?: string;
}

/**
 * Main elicitation UI component
 * Handles both single-entry and multiple-entry modes
 */
export const ElicitationUI: React.FC<ElicitationUIProps> = ({
  request,
  onResponse,
  className,
}) => {
  const singleEntry = isSingleEntryMode(request);
  const fields = Object.entries(request.requestedSchema.properties);
  const requiredFields = new Set(request.requestedSchema.required || []);

  // Initialize form data with defaults
  const [formData, setFormData] = React.useState<Record<string, unknown>>(
    () => {
      const initial: Record<string, unknown> = {};
      fields.forEach(([name, schema]) => {
        if (schema.default !== undefined) {
          initial[name] = schema.default;
        }
      });
      return initial;
    },
  );

  // Track whether to show validation errors
  const [showValidation, setShowValidation] = React.useState(false);

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Show validation as user types if already attempted submit
    if (showValidation) {
      setShowValidation(true);
    }
  };

  const handleAccept = () => {
    // Check if valid before submitting
    if (!isValid) {
      setShowValidation(true);
      return;
    }
    onResponse({ action: "accept", content: formData });
  };

  const handleDecline = () => {
    onResponse({ action: "decline" });
  };

  const handleCancel = () => {
    onResponse({ action: "cancel" });
  };

  // For single-entry mode with boolean/enum, clicking the option submits immediately
  const handleSingleEntryChange = (name: string, value: unknown) => {
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    // Submit immediately
    onResponse({ action: "accept", content: updatedData });
  };

  // Check if form is valid (all fields pass validation)
  const isValid = React.useMemo(() => {
    return fields.every(([fieldName, fieldSchema]) => {
      const value = formData[fieldName];
      const isRequired = requiredFields.has(fieldName);
      return validateField(value, fieldSchema, isRequired);
    });
  }, [formData, fields, requiredFields]);

  if (singleEntry) {
    const [fieldName, fieldSchema] = fields[0];
    return (
      <div
        className={cn(
          "flex flex-col rounded-xl bg-background border border-border p-4 space-y-3",
          className,
        )}
      >
        <div className="text-base font-semibold text-foreground mb-2">
          {request.message}
        </div>
        <Field
          name={fieldName}
          schema={fieldSchema}
          value={formData[fieldName]}
          onChange={(value) => handleSingleEntryChange(fieldName, value)}
          required={requiredFields.has(fieldName)}
          autoFocus
          showValidation={showValidation}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Multiple-entry mode
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-background border border-border p-4 space-y-4",
        className,
      )}
    >
      <div className="text-base font-semibold text-foreground">
        {request.message}
      </div>
      <div className="space-y-3">
        {fields.map(([name, schema], index) => (
          <Field
            key={name}
            name={name}
            schema={schema}
            value={formData[name]}
            onChange={(value) => handleFieldChange(name, value)}
            required={requiredFields.has(name)}
            autoFocus={index === 0}
            showValidation={showValidation}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={!isValid}
          className="px-6 py-2 text-sm rounded-lg bg-black/80 text-white hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
};
