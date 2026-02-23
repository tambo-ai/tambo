"use client";

import { ElicitationActions } from "./elicitation-actions";
import { ElicitationFields } from "./elicitation-fields";
import { ElicitationMessage } from "./elicitation-message";
import { ElicitationRoot } from "./elicitation-root";

export const Elicitation = {
  Root: ElicitationRoot,
  Message: ElicitationMessage,
  Fields: ElicitationFields,
  Actions: ElicitationActions,
};

export type { ElicitationActionsProps } from "./elicitation-actions";
export type { ElicitationField } from "./elicitation-context";
export type {
  ElicitationFieldsProps,
  ElicitationFieldsState,
} from "./elicitation-fields";
export type {
  ElicitationMessageProps,
  ElicitationMessageState,
} from "./elicitation-message";
export type { ElicitationRootProps } from "./elicitation-root";
