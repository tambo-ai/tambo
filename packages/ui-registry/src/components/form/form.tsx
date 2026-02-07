"use client";

import { cn } from "@tambo-ai/ui-registry/utils";
import {
  Form as FormBase,
  type FormFieldDefinition,
  type FormRootProps,
  type FormSubmitRenderProps,
} from "@tambo-ai/react-ui-base/form";
import { cva } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { z } from "zod/v3";

/**
 * Zod schema for FormField
 */
export const formFieldSchema = z.object({
  id: z.string().describe("Unique identifier for the field"),
  type: z
    .enum([
      "text",
      "number",
      "select",
      "textarea",
      "radio",
      "checkbox",
      "slider",
      "yes-no",
    ])
    .describe("Type of form field"),
  label: z.string().describe("Display label for the field"),
  placeholder: z.string().optional().describe("Optional placeholder text"),
  options: z.array(z.string()).optional().describe("Options for select fields"),
  required: z.boolean().optional().describe("Whether the field is required"),
  description: z
    .string()
    .optional()
    .describe("Additional description text for the field"),
  sliderMin: z
    .number()
    .optional()
    .describe("The minimum value for slider fields"),
  sliderMax: z
    .number()
    .optional()
    .describe("The maximum value for slider fields"),
  sliderStep: z
    .number()
    .optional()
    .describe("The step value for slider fields"),
  sliderDefault: z
    .number()
    .optional()
    .describe("Default value for slider fields"),
  sliderLabels: z
    .array(z.string())
    .optional()
    .describe("Labels to display under slider"),
});

/**
 * Zod schema for Form component props
 */
export const formSchema = z.object({
  fields: z.array(formFieldSchema).describe("Array of form fields to display"),
  onSubmit: z
    .function()
    .describe(
      "Callback function called when the form is submitted with form data as argument",
    ),
  onError: z.string().optional().describe("Optional error message to display"),
  submitText: z
    .string()
    .optional()
    .describe("Text to display on the submit button (default: 'Submit')"),
  variant: z
    .enum(["default", "solid", "bordered"])
    .optional()
    .describe("Visual style variant of the form"),
  layout: z
    .enum(["default", "compact", "relaxed"])
    .optional()
    .describe("Spacing layout of the form fields"),
  className: z
    .string()
    .optional()
    .describe("Additional CSS classes for styling"),
});

/**
 * Variants for the Form component
 */
export const formVariants = cva(
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
 * TypeScript type inferred from the Zod schema
 */
export type FormField = z.infer<typeof formFieldSchema>;

/**
 * Interface representing the state of the form component
 */
export interface FormState {
  values: Record<string, string>;
  openDropdowns: Record<string, boolean>;
  selectedValues: Record<string, string>;
  yesNoSelections: Record<string, string>;
  checkboxSelections: Record<string, string[]>;
}

/**
 * Props for the Form component
 */
export type FormProps = z.infer<typeof formSchema>;

/**
 * Styled text/number input classes.
 */
const inputClassName =
  "w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent focus:border-input placeholder:text-muted-foreground transition-colors duration-200";

/**
 * Renders a styled field based on field type, using base component data attributes for structure.
 * @returns The rendered styled field element
 */
function StyledField({ field }: { field: FormFieldDefinition }) {
  return (
    <FormBase.Field field={field} className="space-y-2">
      <FormBase.FieldLabel
        field={field}
        className="block text-sm font-medium text-foreground"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </FormBase.FieldLabel>

      <FormBase.FieldDescription
        field={field}
        className="text-sm text-muted-foreground"
      />

      <StyledFieldInput field={field} />
    </FormBase.Field>
  );
}

/**
 * Renders the styled input for a specific field type.
 * @returns The rendered styled input element
 */
function StyledFieldInput({ field }: { field: FormFieldDefinition }) {
  switch (field.type) {
    case "text":
      return <StyledTextInput field={field} />;
    case "number":
      return <StyledNumberInput field={field} />;
    case "textarea":
      return <StyledTextareaInput field={field} />;
    case "select":
      return <StyledSelectInput field={field} />;
    case "radio":
      return <StyledRadioInput field={field} />;
    case "checkbox":
      return <StyledCheckboxInput field={field} />;
    case "slider":
      return <StyledSliderInput field={field} />;
    case "yes-no":
      return <StyledYesNoInput field={field} />;
  }
}

/**
 * Styled text input using the base FormFieldInput.
 */
function StyledTextInput({ field }: { field: FormFieldDefinition }) {
  return (
    <FormBase.FieldInput field={field}>
      <input
        type="text"
        id={field.id}
        name={field.id}
        placeholder={field.placeholder}
        required={field.required}
        className={inputClassName}
      />
    </FormBase.FieldInput>
  );
}

/**
 * Styled number input using the base FormFieldInput.
 */
function StyledNumberInput({ field }: { field: FormFieldDefinition }) {
  return (
    <FormBase.FieldInput field={field}>
      <input
        type="number"
        id={field.id}
        name={field.id}
        placeholder={field.placeholder}
        required={field.required}
        className={inputClassName}
      />
    </FormBase.FieldInput>
  );
}

/**
 * Styled textarea using the base FormFieldInput.
 */
function StyledTextareaInput({ field }: { field: FormFieldDefinition }) {
  return (
    <FormBase.FieldInput field={field}>
      <textarea
        id={field.id}
        name={field.id}
        placeholder={field.placeholder}
        required={field.required}
        rows={4}
        className={cn(inputClassName, "resize-y")}
      />
    </FormBase.FieldInput>
  );
}

/**
 * Styled select dropdown using the base FormFieldInput with context-driven state.
 */
function StyledSelectInput({ field }: { field: FormFieldDefinition }) {
  // We render FormFieldInput with custom children that use the base component's
  // internal sub-components for the dropdown behavior.
  return <FormBase.FieldInput field={field} />;
}

/**
 * Styled radio group using the base FormFieldInput.
 */
function StyledRadioInput({ field }: { field: FormFieldDefinition }) {
  return <FormBase.FieldInput field={field} />;
}

/**
 * Styled checkbox group using the base FormFieldInput.
 */
function StyledCheckboxInput({ field }: { field: FormFieldDefinition }) {
  return <FormBase.FieldInput field={field} />;
}

/**
 * Styled slider using the base FormFieldInput.
 */
function StyledSliderInput({ field }: { field: FormFieldDefinition }) {
  return <FormBase.FieldInput field={field} />;
}

/**
 * Styled yes/no toggle using the base FormFieldInput.
 */
function StyledYesNoInput({ field }: { field: FormFieldDefinition }) {
  return <FormBase.FieldInput field={field} />;
}

/**
 * A flexible form component that supports various field types and layouts
 * @component
 * @example
 * ```tsx
 * <Form
 *   fields={[
 *     {
 *       id: "name",
 *       type: "text",
 *       label: "Name",
 *       required: true
 *     },
 *     {
 *       id: "age",
 *       type: "number",
 *       label: "Age"
 *     }
 *   ]}
 *   onSubmit={(data) => console.log(data)}
 *   variant="solid"
 *   layout="compact"
 *   className="custom-styles"
 * />
 * ```
 */
export const FormComponent = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      variant,
      layout,
      fields = [],
      onSubmit,
      onError,
      submitText = "Submit",
      ...props
    },
    ref,
  ) => {
    return (
      <FormBase.Root
        ref={ref}
        className={cn(formVariants({ variant, layout }), className)}
        fields={fields as FormFieldDefinition[]}
        onSubmit={onSubmit}
        errorMessage={onError}
        submitText={submitText}
        {...(props as Omit<
          FormRootProps,
          "fields" | "onSubmit" | "errorMessage" | "submitText"
        >)}
      >
        <div className="p-6 space-y-6">
          <FormBase.Error className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">{onError}</p>
          </FormBase.Error>

          <FormBase.Fields
            render={({ fields: validFields }) =>
              validFields.map((field) => (
                <StyledField key={field.id} field={field} />
              ))
            }
          />

          <FormBase.Submit
            className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none font-medium transition-colors duration-200"
            render={({
              isGenerating,
              submitText: text,
            }: FormSubmitRenderProps) =>
              isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span>Updating form...</span>
                </div>
              ) : (
                text
              )
            }
          />
        </div>
      </FormBase.Root>
    );
  },
);

FormComponent.displayName = "Form";
