/**
 * @tambo-ai/react-ui-base
 *
 * Unstyled base components for building Tambo UI.
 * These primitives provide structure and behavior without styling,
 * allowing consumers to apply their own design system.
 */

// Message components
export { Message } from "./message";
export type {
  MessageContentProps,
  MessageContentRenderProps,
  MessageImageRenderFnProps,
  MessageImagesProps,
  MessageLoadingIndicatorProps,
  MessageRenderedComponentProps,
  MessageRootProps,
} from "./message";

// ReasoningInfo components
export { ReasoningInfo } from "./reasoning-info";
export type {
  ReasoningInfoContentProps,
  ReasoningInfoRootProps,
  ReasoningInfoStatusTextProps,
  ReasoningInfoStepsProps,
  ReasoningInfoStepsRenderFunctionProps,
  ReasoningInfoTriggerProps,
} from "./reasoning-info";

// ToolcallInfo components
export { ToolcallInfo } from "./toolcall-info";
export type {
  ToolcallInfoContentProps,
  ToolcallInfoContentRenderProps,
  ToolcallInfoParametersProps,
  ToolcallInfoParametersRenderProps,
  ToolcallInfoResultProps,
  ToolcallInfoResultRenderProps,
  ToolcallInfoRootProps,
  ToolcallInfoStatusIconProps,
  ToolcallInfoStatusIconRenderProps,
  ToolcallInfoStatusTextProps,
  ToolcallInfoToolNameProps,
  ToolcallInfoToolNameRenderProps,
  ToolcallInfoToolStatus,
  ToolcallInfoTriggerProps,
} from "./toolcall-info";

// ElicitationUI components
export {
  ElicitationUIBase,
  getInputType,
  getValidationError,
  isSingleEntryMode,
  validateField,
} from "./elicitation-ui";
export type {
  ElicitationUIActionsProps,
  ElicitationUIActionsRenderProps,
  ElicitationUIBooleanFieldProps,
  ElicitationUIBooleanFieldRenderProps,
  ElicitationUIContextValue,
  ElicitationUIEnumFieldProps,
  ElicitationUIEnumFieldRenderProps,
  ElicitationUIEnumOption,
  ElicitationUIFieldProps,
  ElicitationUIFieldRenderProps,
  ElicitationUIFieldType,
  ElicitationUINumberFieldProps,
  ElicitationUINumberFieldRenderProps,
  ElicitationUIRootProps,
  ElicitationUIStringFieldProps,
  ElicitationUIStringFieldRenderProps,
  ElicitationUITitleProps,
  ElicitationUITitleRenderProps,
  FieldSchema,
} from "./elicitation-ui";

// Types
export type {
  BaseProps,
  BasePropsWithChildrenOrRenderFunction,
  PropsWithChildrenOrRenderFunction,
} from "./types/component-render-or-children";

// Hooks
export { useRender } from "./use-render/use-render";
