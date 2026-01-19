"use client";

import { cn } from "@/lib/utils";
import { useTambo, useTamboComponentState } from "@tambo-ai/react";
import { cva } from "class-variance-authority";
import * as React from "react";
import { z } from "zod/v3";

/**
 * Zod schema for Field
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
 * Zod schema for InputFields component props
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

export const inputFieldsVariants = cva(
  "w-full rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background border border-border",
        solid: [
          "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20",
          "bg-background border border-border",
        ].join(" "),
        bordered: ["border-2", "border-border"].join(" "),
      },
      layout: {
        default: "space-y-4",
        compact: "space-y-2",
        relaxed: "space-y-6",
      },
    },
    defaultVariants: {
      variant: "default",
      layout: "default",
    },
  },
);

/**
 * Represents a field in an input fields component
 */
export type Field = z.infer<typeof fieldSchema>;

/**
 * Interface representing the state of the InputFields component
 */
export interface InputFieldsState {
  values: Record<string, string>;
}

/**
 * Props for the InputFields component type inferred from the Zod schema
 */
export type InputFieldsProps = z.infer<typeof inputFieldsSchema>;

/**
 * A component that renders a collection of form input fields with validation and accessibility features
 * @component
 * @example
 * ```tsx
 * <InputFields
 *   fields={[
 *     {
 *       id: "email",
 *       type: "email",
 *       label: "Email",
 *       required: true
 *     }
 *   ]}
 *   variant="solid"
 *   layout="compact"
 *   className="custom-styles"
 * />
 * ```
 */
export const InputFields = React.forwardRef<HTMLDivElement, InputFieldsProps>(
  ({ className, variant, layout, fields = [], ...props }, ref) => {
    const { isIdle } = useTambo();
    const isGenerating = !isIdle;

    const baseId = React.useId();
    const inputFieldsId = React.useMemo(() => {
      const ids = (fields ?? [])
        .map((f) => f.id)
        .filter(Boolean)
        .join("-");
      return ids ? `input-fields-${baseId}-${ids}` : `input-fields-${baseId}`;
    }, [baseId, fields]);

    /**
     * Component state managed by Tambo
     * Stores all input field values
     */
    const [state, setState] = useTamboComponentState<InputFieldsState>(
      inputFieldsId,
      {
        values: {},
      },
    );

    /**
     * Filtered list of valid input fields
     * Removes any fields with missing/invalid data and provides type safety
     */
    const validFields = React.useMemo(() => {
      return fields.filter((field): field is Field => {
        if (!field || typeof field !== "object") {
          console.warn("Invalid field object detected");
          return false;
        }
        if (!field.id || typeof field.id !== "string") {
          console.warn("Field missing required id property");
          return false;
        }
        return true;
      });
    }, [fields]);

    /**
     * Handles input value changes
     * @param {string} fieldId - The ID of the field being updated
     * @param {string} value - The new value
     */
    const handleInputChange = (fieldId: string, value: string) => {
      if (!state) return;
      setState({
        ...state,
        values: {
          ...state.values,
          [fieldId]: value,
        },
      });
    };

    if (!state) return null;

    return (
      <div
        ref={ref}
        className={cn(inputFieldsVariants({ variant, layout }), className)}
        {...props}
      >
        <div className="p-6 space-y-6">
          {validFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor={field.id}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.description && (
                <p className="text-sm text-muted-foreground">
                  {field.description}
                </p>
              )}

              <input
                type={field.type}
                id={field.id}
                name={field.id}
                value={state.values[field.id] ?? ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled ?? isGenerating}
                maxLength={field.maxLength}
                minLength={field.minLength}
                pattern={field.pattern}
                autoComplete={field.autoComplete}
                className="w-full px-3 py-2 rounded-lg 
                          bg-background border border-border
                          focus:ring-2 focus:ring-ring focus:border-input
                          placeholder:text-muted-foreground
                          transition-colors duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {field.error && (
                <p className="text-sm text-destructive">{field.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
InputFields.displayName = "InputFields";
