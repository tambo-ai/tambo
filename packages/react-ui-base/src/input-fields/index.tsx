"use client";

import { InputFieldsDescription } from "./description/input-fields-description";
import { InputFieldsError } from "./error/input-fields-error";
import { InputFieldsField } from "./field/input-fields-field";
import { InputFieldsInput } from "./input/input-fields-input";
import { InputFieldsLabel } from "./label/input-fields-label";
import { InputFieldsRoot } from "./root/input-fields-root";

/**
 * InputFields namespace containing all input fields base components.
 */
const InputFields = {
  Root: InputFieldsRoot,
  Field: InputFieldsField,
  Label: InputFieldsLabel,
  Description: InputFieldsDescription,
  Input: InputFieldsInput,
  Error: InputFieldsError,
};

export type { InputFieldsDescriptionProps } from "./description/input-fields-description";
export type { InputFieldsErrorProps } from "./error/input-fields-error";
export type { InputFieldsFieldProps } from "./field/input-fields-field";
export type { InputFieldsInputProps } from "./input/input-fields-input";
export type { InputFieldsLabelProps } from "./label/input-fields-label";
export type {
  Field,
  InputFieldsProps,
  InputFieldsState,
} from "./root/input-fields-context";
export type { InputFieldsRootProps } from "./root/input-fields-root";
export {
  fieldSchema,
  inputFieldsSchema,
  useInputFieldsRootContext,
} from "./root/input-fields-context";

export { InputFields };
