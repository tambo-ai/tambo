"use client";

import { EditWithTamboButtonPopover } from "./popover/edit-with-tambo-button-popover";
import { EditWithTamboButtonRoot } from "./root/edit-with-tambo-button-root";
import { EditWithTamboButtonSendButton } from "./send-button/edit-with-tambo-button-send-button";
import { EditWithTamboButtonSendModeDropdown } from "./send-button/edit-with-tambo-button-send-mode-dropdown";
import { EditWithTamboButtonSendModeOption } from "./send-button/edit-with-tambo-button-send-mode-option";
import { EditWithTamboButtonStatus } from "./status/edit-with-tambo-button-status";
import { EditWithTamboButtonTextarea } from "./textarea/edit-with-tambo-button-textarea";
import { EditWithTamboButtonTrigger } from "./trigger/edit-with-tambo-button-trigger";

/**
 * EditWithTamboButton namespace containing all base components.
 */
const EditWithTamboButtonBase = {
  Root: EditWithTamboButtonRoot,
  Trigger: EditWithTamboButtonTrigger,
  Popover: EditWithTamboButtonPopover,
  Textarea: EditWithTamboButtonTextarea,
  SendButton: EditWithTamboButtonSendButton,
  SendModeDropdown: EditWithTamboButtonSendModeDropdown,
  SendModeOption: EditWithTamboButtonSendModeOption,
  Status: EditWithTamboButtonStatus,
};

export type { EditWithTamboButtonPopoverProps } from "./popover/edit-with-tambo-button-popover";
export type {
  EditWithTamboButtonContextValue,
  EditWithTamboButtonSendMode,
} from "./root/edit-with-tambo-button-context";
export type {
  EditWithTamboButtonRootProps,
  EditWithTamboButtonRootRenderProps,
} from "./root/edit-with-tambo-button-root";
export type {
  EditWithTamboButtonSendButtonProps,
  EditWithTamboButtonSendButtonRenderProps,
} from "./send-button/edit-with-tambo-button-send-button";
export type { EditWithTamboButtonSendModeDropdownProps } from "./send-button/edit-with-tambo-button-send-mode-dropdown";
export type { EditWithTamboButtonSendModeOptionProps } from "./send-button/edit-with-tambo-button-send-mode-option";
export type {
  EditWithTamboButtonStatusProps,
  EditWithTamboButtonStatusRenderProps,
} from "./status/edit-with-tambo-button-status";
export type { EditWithTamboButtonTextareaProps } from "./textarea/edit-with-tambo-button-textarea";
export type { EditWithTamboButtonTriggerProps } from "./trigger/edit-with-tambo-button-trigger";

export { EditWithTamboButtonBase };
