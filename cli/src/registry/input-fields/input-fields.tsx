"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputFieldsVariants = cva(
  "w-full rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "",
        solid: [
          "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20",
          "[&_input]:bg-muted",
        ].join(" "),
        bordered: ["[&_input]:border-2", "[&_input]:border-border"].join(" "),
      },
      size: {
        default: "[&_input]:p-2",
        sm: "[&_input]:p-1 [&_input]:text-sm",
        lg: "[&_input]:p-3 [&_input]:text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Represents a field in an input fields component
 * @property {string} id - Unique identifier for the field
 * @property {'text' | 'number' | 'email' | 'password'} type - Type of input field
 * @property {string} label - Display label for the field
 * @property {string} [placeholder] - Optional placeholder text
 * @property {string} value - Current value of the field
 * @property {(value: string) => void} onChange - Callback function for when the value changes
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
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  error?: string;
}

export interface InputFieldsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inputFieldsVariants> {
  fields: Field[];
}

const InputFields = React.forwardRef<HTMLDivElement, InputFieldsProps>(
  ({ className, variant, size, fields, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(inputFieldsVariants({ variant, size }), className)}
        {...props}
      >
        {fields.map((field) => (
          <div key={field.id} className="mb-4">
            <label
              className="block text-sm font-medium mb-1 text-foreground"
              htmlFor={field.id}
              id={`${field.id}-label`}
            >
              {field.label}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </label>
            {field.description && (
              <p
                className="text-sm text-muted-foreground mb-1"
                id={`${field.id}-description`}
              >
                {field.description}
              </p>
            )}
            <input
              type={field.type}
              id={field.id}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={field.disabled}
              maxLength={field.maxLength}
              minLength={field.minLength}
              pattern={field.pattern}
              autoComplete={field.autoComplete}
              aria-labelledby={`${field.id}-label`}
              aria-describedby={
                field.description ? `${field.id}-description` : undefined
              }
              aria-invalid={!!field.error}
              aria-errormessage={field.error ? `${field.id}-error` : undefined}
              className={cn(
                "w-full rounded-lg",
                "border border-input",
                "bg-background text-foreground",
                "focus:ring-2 focus:ring-ring focus:border-ring",
                "placeholder:text-muted-foreground/60",
                "transition-colors duration-200",
                field.disabled && "opacity-50 cursor-not-allowed",
                field.error && "border-destructive focus:ring-destructive",
              )}
            />
            {field.error && (
              <p
                className="mt-1 text-sm text-destructive"
                id={`${field.id}-error`}
              >
                {field.error}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  },
);
InputFields.displayName = "InputFields";

export { InputFields, inputFieldsVariants };
