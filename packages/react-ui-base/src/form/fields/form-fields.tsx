import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import {
  FormFieldDefinition,
  useFormRootContext,
} from "../root/form-root-context";

/**
 * Props passed to the render function of FormFields.
 */
export interface FormFieldsRenderProps {
  /** The validated array of form field definitions. */
  fields: FormFieldDefinition[];
}

export type FormFieldsProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Fields container primitive that provides the validated fields list.
 * Uses a render prop to delegate field rendering to the consumer.
 * @returns The rendered fields container element
 */
export const FormFields = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<FormFieldsProps, FormFieldsRenderProps>
>(function FormFields({ asChild, ...props }, ref) {
  const { validFields } = useFormRootContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    fields: validFields,
  });

  return (
    <Comp ref={ref} data-slot="form-fields" {...componentProps}>
      {content}
    </Comp>
  );
});
