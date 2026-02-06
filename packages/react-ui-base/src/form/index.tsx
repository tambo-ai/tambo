"use client";

import { FormError } from "./error/form-error";
import {
  FormField,
  FormFieldDescription,
  FormFieldInput,
  FormFieldLabel,
} from "./field/form-field";
import { FormFields } from "./fields/form-fields";
import { FormRoot } from "./root/form-root";
import { FormSubmit } from "./submit/form-submit";

/**
 * Form namespace containing all form base components.
 */
const Form = {
  Root: FormRoot,
  Error: FormError,
  Fields: FormFields,
  Field: FormField,
  FieldLabel: FormFieldLabel,
  FieldDescription: FormFieldDescription,
  FieldInput: FormFieldInput,
  Submit: FormSubmit,
};

export type { FormErrorProps } from "./error/form-error";
export type {
  FormFieldDescriptionProps,
  FormFieldInputProps,
  FormFieldLabelProps,
  FormFieldProps,
} from "./field/form-field";
export type {
  FormFieldsProps,
  FormFieldsRenderProps,
} from "./fields/form-fields";
export type {
  FormFieldDefinition,
  FormFieldType,
  FormRootContextValue,
  FormState,
} from "./root/form-root-context";
export type { FormRootProps } from "./root/form-root";
export type {
  FormSubmitProps,
  FormSubmitRenderProps,
} from "./submit/form-submit";

export { Form };
