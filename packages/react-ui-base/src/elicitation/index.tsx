"use client";

import {
  ElicitationActions,
  ElicitationActionCancel,
  ElicitationActionDecline,
  ElicitationActionSubmit,
} from "./elicitation-actions";
import {
  ElicitationField,
  ElicitationFieldBooleanInput,
  ElicitationFieldEnumInput,
  ElicitationFieldError,
  ElicitationFieldInput,
  ElicitationFieldLabel,
  ElicitationFieldNumberInput,
  ElicitationFields,
  ElicitationFieldStringInput,
} from "./elicitation-fields";
import { ElicitationMessage } from "./elicitation-message";
import { ElicitationRoot } from "./elicitation-root";

export const Elicitation = {
  Root: ElicitationRoot,
  Message: ElicitationMessage,
  Fields: ElicitationFields,
  Field: ElicitationField,
  FieldLabel: ElicitationFieldLabel,
  FieldError: ElicitationFieldError,
  FieldInput: ElicitationFieldInput,
  FieldBooleanInput: ElicitationFieldBooleanInput,
  FieldEnumInput: ElicitationFieldEnumInput,
  FieldStringInput: ElicitationFieldStringInput,
  FieldNumberInput: ElicitationFieldNumberInput,
  Actions: ElicitationActions,
  ActionCancel: ElicitationActionCancel,
  ActionDecline: ElicitationActionDecline,
  ActionSubmit: ElicitationActionSubmit,
};

export type {
  ElicitationActionCancelProps,
  ElicitationActionCancelRenderProps,
  ElicitationActionDeclineProps,
  ElicitationActionDeclineRenderProps,
  ElicitationActionSubmitProps,
  ElicitationActionSubmitRenderProps,
  ElicitationActionsProps,
  ElicitationActionsState,
} from "./elicitation-actions";
export type {
  ElicitationContextValue,
  ElicitationField,
  ElicitationProviderProps,
} from "./elicitation-context";
export type {
  ElicitationFieldBooleanInputProps,
  ElicitationFieldContextValue,
  ElicitationFieldEnumInputProps,
  ElicitationFieldErrorProps,
  ElicitationFieldErrorRenderProps,
  ElicitationFieldErrorState,
  ElicitationFieldInputProps,
  ElicitationFieldInputRenderProps,
  ElicitationFieldInputState,
  ElicitationFieldKind,
  ElicitationFieldLabelProps,
  ElicitationFieldLabelRenderProps,
  ElicitationFieldLabelState,
  ElicitationFieldNumberInputProps,
  ElicitationFieldProps,
  ElicitationFieldRenderProps,
  ElicitationFieldState,
  ElicitationFieldStringInputProps,
  ElicitationFieldsProps,
  ElicitationFieldsRenderProps,
  ElicitationFieldsState,
} from "./elicitation-fields";
export { useElicitationField } from "./elicitation-fields";
export type {
  ElicitationMessageProps,
  ElicitationMessageRenderProps,
} from "./elicitation-message";
export type { ElicitationRootProps } from "./elicitation-root";
