"use client";

import {
  ElicitationActionCancel,
  ElicitationActionDecline,
  ElicitationActions,
  ElicitationActionSubmit,
} from "./elicitation-actions";
import { ElicitationFields } from "./elicitation-fields";
import { ElicitationMessage } from "./elicitation-message";
import { ElicitationRoot } from "./elicitation-root";

export const Elicitation = {
  Root: ElicitationRoot,
  Message: ElicitationMessage,
  Fields: ElicitationFields,
  Actions: ElicitationActions,
  ActionCancel: ElicitationActionCancel,
  ActionDecline: ElicitationActionDecline,
  ActionSubmit: ElicitationActionSubmit,
};

export type { ElicitationActionCancelProps } from "./elicitation-actions";
export type { ElicitationActionCancelRenderProps } from "./elicitation-actions";
export type { ElicitationActionDeclineProps } from "./elicitation-actions";
export type { ElicitationActionDeclineRenderProps } from "./elicitation-actions";
export type { ElicitationActionSubmitProps } from "./elicitation-actions";
export type { ElicitationActionSubmitRenderProps } from "./elicitation-actions";
export type { ElicitationActionsProps } from "./elicitation-actions";
export type { ElicitationActionsRenderProps } from "./elicitation-actions";
export type { ElicitationField } from "./elicitation-context";
export type { ElicitationFieldsProps } from "./elicitation-fields";
export type { ElicitationFieldsRenderProps } from "./elicitation-fields";
export type { ElicitationMessageProps } from "./elicitation-message";
export type { ElicitationMessageRenderProps } from "./elicitation-message";
export type { ElicitationRootProps } from "./elicitation-root";
