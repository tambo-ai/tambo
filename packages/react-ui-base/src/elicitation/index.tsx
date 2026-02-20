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
export type { ElicitationActionsRenderProps } from "./elicitation-actions";
export type { ElicitationField } from "./elicitation-context";
export type { ElicitationFieldsProps } from "./elicitation-fields";
export type { ElicitationFieldsRenderProps } from "./elicitation-fields";
export type { ElicitationMessageProps } from "./elicitation-message";
export type { ElicitationMessageRenderProps } from "./elicitation-message";
export type { ElicitationRootProps } from "./elicitation-root";
