"use client";

import type {
  PrimitiveSchemaDefinition as FieldSchema,
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { isSingleEntryMode } from "./utils/is-single-entry-mode";

export interface ElicitationField {
  name: string;
  schema: FieldSchema;
  value: unknown;
  required: boolean;
  validationError: string | null;
  autoFocus: boolean;
  setValue: (value: unknown) => void;
}

export interface ElicitationContextValue {
  request: TamboElicitationRequest;
  fields: ElicitationField[];
  isSingleEntry: boolean;
  isValid: boolean;
  handleAccept: () => void;
  handleDecline: () => void;
  handleCancel: () => void;
}

export const ElicitationContext =
  React.createContext<ElicitationContextValue | null>(null);

const validateField = (
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): { isValid: boolean; error: string | null } => {
  if (required && (value === undefined || value === null || value === "")) {
    return { isValid: false, error: "This field is required" };
  }

  if (!required && (value === undefined || value === null || value === "")) {
    return { isValid: true, error: null };
  }

  if (schema.type === "string") {
    const stringValue = `${value}`;

    if (
      "minLength" in schema &&
      schema.minLength !== undefined &&
      stringValue.length < schema.minLength
    ) {
      return {
        isValid: false,
        error: `Minimum length is ${schema.minLength} characters`,
      };
    }

    if (
      "maxLength" in schema &&
      schema.maxLength !== undefined &&
      stringValue.length > schema.maxLength
    ) {
      return {
        isValid: false,
        error: `Maximum length is ${schema.maxLength} characters`,
      };
    }

    if ("pattern" in schema && schema.pattern) {
      try {
        const regex = new RegExp(`${schema.pattern}`);
        if (!regex.test(stringValue)) {
          return {
            isValid: false,
            error: "Value does not match required pattern",
          };
        }
      } catch {
        return {
          isValid: false,
          error: "Value does not match required pattern",
        };
      }
    }

    if ("format" in schema && schema.format === "email") {
      const isEmail =
        stringValue.includes("@") &&
        stringValue.indexOf("@") > 0 &&
        stringValue.lastIndexOf(".") > stringValue.indexOf("@") + 1 &&
        !stringValue.includes(" ");
      if (!isEmail) {
        return { isValid: false, error: "Please enter a valid email address" };
      }
    }

    if ("format" in schema && schema.format === "uri") {
      try {
        new URL(stringValue);
      } catch {
        return { isValid: false, error: "Please enter a valid URL" };
      }
    }
  }

  if (schema.type === "number" || schema.type === "integer") {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return { isValid: false, error: "Please enter a valid number" };
    }

    if (schema.minimum !== undefined && numberValue < schema.minimum) {
      return { isValid: false, error: `Minimum value is ${schema.minimum}` };
    }

    if (schema.maximum !== undefined && numberValue > schema.maximum) {
      return { isValid: false, error: `Maximum value is ${schema.maximum}` };
    }

    if (schema.type === "integer" && !Number.isInteger(numberValue)) {
      return { isValid: false, error: "Please enter a whole number" };
    }
  }

  return { isValid: true, error: null };
};

export interface ElicitationProviderProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  children: React.ReactNode;
}

export const ElicitationProvider = ({
  request,
  onResponse,
  children,
}: ElicitationProviderProps) => {
  const fields = React.useMemo(
    () => Object.entries(request.requestedSchema.properties),
    [request.requestedSchema.properties],
  );
  const requiredFields = React.useMemo(
    () => request.requestedSchema.required ?? [],
    [request.requestedSchema.required],
  );
  const isSingleEntry = React.useMemo(
    () => isSingleEntryMode(request),
    [request],
  );

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
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(
    new Set(),
  );

  React.useEffect(() => {
    const initial: Record<string, unknown> = {};
    fields.forEach(([name, schema]) => {
      if (schema.default !== undefined) {
        initial[name] = schema.default;
      }
    });
    setFormData(initial);
    setTouchedFields(new Set());
  }, [fields]);

  const setFieldValue = React.useCallback(
    (name: string, value: unknown) => {
      const schemaEntry = fields.find(([fieldName]) => fieldName === name);
      if (!schemaEntry) {
        console.error(`Elicitation field "${name}" was not found`);
        return;
      }

      const [, schema] = schemaEntry;
      const required = requiredFields.includes(name);

      setFormData((previousFormData) => {
        const nextFormData = { ...previousFormData, [name]: value };

        if (isSingleEntry) {
          const fieldValidation = validateField(
            nextFormData[name],
            schema,
            required,
          );

          if (fieldValidation.isValid) {
            onResponse({ action: "accept", content: nextFormData });
          }
        }

        return nextFormData;
      });

      setTouchedFields((previousTouchedFields) => {
        const nextTouchedFields = new Set(previousTouchedFields);
        nextTouchedFields.add(name);
        return nextTouchedFields;
      });
    },
    [fields, isSingleEntry, onResponse, requiredFields],
  );

  const isValid = React.useMemo(
    () =>
      fields.every(
        ([name, schema]) =>
          validateField(formData[name], schema, requiredFields.includes(name))
            .isValid,
      ),
    [fields, formData, requiredFields],
  );

  const formattedFields = React.useMemo<ElicitationField[]>(
    () =>
      fields.map(([name, schema], index) => ({
        name,
        schema,
        value: formData[name],
        required: requiredFields.includes(name),
        validationError: touchedFields.has(name)
          ? validateField(formData[name], schema, requiredFields.includes(name))
              .error
          : null,
        autoFocus: index === 0,
        setValue: (value) => setFieldValue(name, value),
      })),
    [fields, formData, requiredFields, setFieldValue, touchedFields],
  );

  const handleAccept = React.useCallback(() => {
    if (!isValid) {
      setTouchedFields(new Set(fields.map(([name]) => name)));
      return;
    }
    onResponse({ action: "accept", content: formData });
  }, [fields, formData, isValid, onResponse]);

  const handleDecline = React.useCallback(() => {
    onResponse({ action: "decline" });
  }, [onResponse]);

  const handleCancel = React.useCallback(() => {
    onResponse({ action: "cancel" });
  }, [onResponse]);

  const contextValue = React.useMemo<ElicitationContextValue>(
    () => ({
      request,
      fields: formattedFields,
      isSingleEntry,
      isValid,
      handleAccept,
      handleDecline,
      handleCancel,
    }),
    [
      formattedFields,
      handleAccept,
      handleCancel,
      handleDecline,
      isSingleEntry,
      isValid,
      request,
    ],
  );

  return (
    <ElicitationContext.Provider value={contextValue}>
      {children}
    </ElicitationContext.Provider>
  );
};

export const useElicitationContext = (): ElicitationContextValue => {
  const context = React.useContext(ElicitationContext);
  if (!context) {
    throw new Error(
      "Elicitation components must be used within Elicitation.Root",
    );
  }
  return context;
};
