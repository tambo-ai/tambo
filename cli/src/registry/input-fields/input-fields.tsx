"use client";

import { cn } from "@/lib/utils";
import { useTambo, useTamboComponentState } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const inputFieldsVariants = cva(
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
 * @property {string} id - Unique identifier for the field
 * @property {'text' | 'number' | 'email' | 'password'} type - Type of input field
 * @property {string} label - Display label for the field
 * @property {string} [placeholder] - Optional placeholder text
 * @property {boolean} [required] - Whether the field is required
 * @property {string} [description] - Additional description text for the field
 * @property {boolean} [disabled] - Whether the field is disabled
 * @property {number} [maxLength] - Maximum length of the field
 * @property {number} [minLength] - Minimum length of the field
 * @property {string} [pattern] - Regular expression pattern for validation
 * @property {string} [autoComplete] - Autocomplete attribute value
 * @property {string} [error] - Error message for the field
 */
export interface Field {
  id: string;
  type: "text" | "number" | "email" | "password";
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  error?: string;
}

export interface InputFieldsState {
  values: Record<string, string>;
}

/**
 * Props for the InputFields component
 * @interface
 */
export interface InputFieldsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inputFieldsVariants> {
  /** Array of field configurations to render */
  fields: Field[];
}

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

    /**
     * Generates a unique identifier for the input fields based on field IDs
     * This ensures persistence of state between re-renders
     */
    const inputFieldsId = React.useMemo(() => {
      try {
        // Safely create an input fields ID, handling any potential issues with fields
        const validFields = fields.filter(
          (f) => f && typeof f === "object" && f.id,
        );
        return `input-fields-${validFields.map((f) => f.id).join("-")}`;
      } catch (err) {
        console.error("Error generating input fields ID:", err);
        return `input-fields-${Date.now()}`;
      }
    }, [fields]);

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
                className="block text-sm font-medium text-primary"
                htmlFor={field.id}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.description && (
                <p className="text-sm text-secondary">{field.description}</p>
              )}

              <input
                type={field.type}
                id={field.id}
                name={field.id}
                value={state.values[field.id] || ""}
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

export { inputFieldsVariants };
