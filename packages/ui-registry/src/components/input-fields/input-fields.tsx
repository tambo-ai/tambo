"use client";

import {
  InputFields as InputFieldsBase,
  type InputFieldsProps as InputFieldsBaseProps,
  type InputFieldsRootProps,
  type InputFieldsRootRenderProps,
  fieldSchema,
  inputFieldsSchema,
} from "@tambo-ai/react-ui-base/input-fields";
import { cn } from "@tambo-ai/ui-registry/utils";
import { cva } from "class-variance-authority";
import * as React from "react";

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

export type {
  Field,
  InputFieldsState,
} from "@tambo-ai/react-ui-base/input-fields";

/**
 * Props for the InputFields component type inferred from the Zod schema.
 */
export type InputFieldsProps = InputFieldsBaseProps;

/**
 * Renders the styled field list from render props.
 * @returns The styled field list
 */
function InputFieldsContent({ validFields }: InputFieldsRootRenderProps) {
  return (
    <div className="p-6 space-y-6">
      {validFields.map((field) => (
        <InputFieldsBase.Field
          key={field.id}
          field={field}
          className="space-y-2"
        >
          <InputFieldsBase.Label className="block text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </InputFieldsBase.Label>

          <InputFieldsBase.Description className="text-sm text-muted-foreground" />

          <InputFieldsBase.Input className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-ring focus:border-input placeholder:text-muted-foreground transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" />

          <InputFieldsBase.Error className="text-sm text-destructive" />
        </InputFieldsBase.Field>
      ))}
    </div>
  );
}

/**
 * A component that renders a collection of form input fields with validation and accessibility features.
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
 * @returns The styled input fields component
 */
export const InputFields = React.forwardRef<
  HTMLDivElement,
  InputFieldsProps & Pick<InputFieldsRootProps, "asChild">
>(({ className, variant, layout, fields = [], ...props }, ref) => {
  return (
    <InputFieldsBase.Root
      ref={ref}
      className={cn(inputFieldsVariants({ variant, layout }), className)}
      fields={fields}
      render={(renderProps) => <InputFieldsContent {...renderProps} />}
      {...props}
    />
  );
});
InputFields.displayName = "InputFields";

export { fieldSchema, inputFieldsSchema };
