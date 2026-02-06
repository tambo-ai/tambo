"use client";

import { ElicitationUIActions } from "./actions/elicitation-ui-actions";
import { ElicitationUIBooleanField } from "./boolean-field/elicitation-ui-boolean-field";
import { ElicitationUIEnumField } from "./enum-field/elicitation-ui-enum-field";
import { ElicitationUIField } from "./field/elicitation-ui-field";
import { ElicitationUINumberField } from "./number-field/elicitation-ui-number-field";
import { ElicitationUIRoot } from "./root/elicitation-ui-root";
import { ElicitationUIStringField } from "./string-field/elicitation-ui-string-field";
import { ElicitationUITitle } from "./title/elicitation-ui-title";

/**
 * ElicitationUI namespace containing all elicitation UI base components.
 */
const ElicitationUIBase = {
  Root: ElicitationUIRoot,
  Title: ElicitationUITitle,
  Field: ElicitationUIField,
  BooleanField: ElicitationUIBooleanField,
  StringField: ElicitationUIStringField,
  NumberField: ElicitationUINumberField,
  EnumField: ElicitationUIEnumField,
  Actions: ElicitationUIActions,
};

export type {
  ElicitationUIActionsProps,
  ElicitationUIActionsRenderProps,
} from "./actions/elicitation-ui-actions";
export type {
  ElicitationUIBooleanFieldProps,
  ElicitationUIBooleanFieldRenderProps,
} from "./boolean-field/elicitation-ui-boolean-field";
export type {
  ElicitationUIEnumFieldProps,
  ElicitationUIEnumFieldRenderProps,
  ElicitationUIEnumOption,
} from "./enum-field/elicitation-ui-enum-field";
export type {
  ElicitationUIFieldProps,
  ElicitationUIFieldRenderProps,
  ElicitationUIFieldType,
} from "./field/elicitation-ui-field";
export type {
  ElicitationUINumberFieldProps,
  ElicitationUINumberFieldRenderProps,
} from "./number-field/elicitation-ui-number-field";
export type { ElicitationUIContextValue } from "./root/elicitation-ui-context";
export type { ElicitationUIRootProps } from "./root/elicitation-ui-root";
export type { FieldSchema } from "./root/validation";
export {
  getInputType,
  getValidationError,
  isSingleEntryMode,
  validateField,
} from "./root/validation";
export type {
  ElicitationUIStringFieldProps,
  ElicitationUIStringFieldRenderProps,
} from "./string-field/elicitation-ui-string-field";
export type {
  ElicitationUITitleProps,
  ElicitationUITitleRenderProps,
} from "./title/elicitation-ui-title";

export { ElicitationUIBase };
