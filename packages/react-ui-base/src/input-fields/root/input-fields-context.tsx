import * as React from "react";
import { z } from "zod/v3";

/**
 * Zod schema for a single input field configuration.
 */
export const fieldSchema = z.object({
  id: z.string().describe("Unique identifier for the field"),
  type: z
    .enum(["text", "number", "email", "password"])
    .describe("Type of input field"),
  label: z.string().describe("Display label for the field"),
  placeholder: z.string().optional().describe("Optional placeholder text"),
  required: z.boolean().optional().describe("Whether the field is required"),
  description: z
    .string()
    .optional()
    .describe("Additional description text for the field"),
  disabled: z.boolean().optional().describe("Whether the field is disabled"),
  maxLength: z.number().optional().describe("Maximum length of the field"),
  minLength: z.number().optional().describe("Minimum length of the field"),
  pattern: z
    .string()
    .optional()
    .describe("Regular expression pattern for validation"),
  autoComplete: z.string().optional().describe("Autocomplete attribute value"),
  error: z.string().optional().describe("Error message for the field"),
});

/**
 * Zod schema for InputFields component props.
 */
export const inputFieldsSchema = z.object({
  fields: z
    .array(fieldSchema)
    .describe("Array of field configurations to render"),
  variant: z
    .enum(["default", "solid", "bordered"])
    .optional()
    .describe("Visual style variant"),
  layout: z
    .enum(["default", "compact", "relaxed"])
    .optional()
    .describe("Spacing layout"),
  className: z
    .string()
    .optional()
    .describe("Additional CSS classes for styling"),
});

/**
 * Represents a single field configuration.
 */
export type Field = z.infer<typeof fieldSchema>;

/**
 * Interface representing the state of the InputFields component,
 * managed by Tambo.
 */
export interface InputFieldsState {
  values: Record<string, string>;
}

/**
 * Props inferred from the InputFields Zod schema.
 */
export type InputFieldsProps = z.infer<typeof inputFieldsSchema>;

/**
 * Context value shared among InputFields sub-components.
 */
export interface InputFieldsRootContextValue {
  /** The validated array of field configurations. */
  validFields: Field[];
  /** Current values for all fields, keyed by field ID. */
  values: Record<string, string>;
  /** Whether the AI is currently generating (fields should be disabled). */
  isGenerating: boolean;
  /**
   * Handler for field value changes.
   * @param fieldId - The ID of the field being updated
   * @param value - The new value
   */
  handleInputChange: (fieldId: string, value: string) => void;
}

const InputFieldsRootContext =
  React.createContext<InputFieldsRootContextValue | null>(null);

/**
 * Hook to access the InputFields root context.
 * @internal This hook is for internal use by base components only.
 * @returns The InputFields root context value
 * @throws Error if used outside of InputFields.Root
 */
function useInputFieldsRootContext(): InputFieldsRootContextValue {
  const context = React.useContext(InputFieldsRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: InputFieldsRootContext is missing. InputFields parts must be used within <InputFields.Root>",
    );
  }
  return context;
}

export { InputFieldsRootContext, useInputFieldsRootContext };
