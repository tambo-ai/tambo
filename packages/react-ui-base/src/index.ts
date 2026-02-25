/**
 * @tambo-ai/react-ui-base
 *
 * Unstyled base components for building Tambo UI.
 * These primitives provide structure and behavior without styling,
 * allowing consumers to apply their own design system.
 */

// Elicitation components
export { Elicitation } from "./elicitation";
export type {
  ElicitationActionsProps,
  ElicitationActionsState,
  ElicitationContextValue,
  ElicitationField,
  ElicitationFieldsProps,
  ElicitationFieldsState,
  ElicitationMessageProps,
  ElicitationProviderProps,
  ElicitationRootProps,
} from "./elicitation";

// Message components
export { Message } from "./message";
export type {
  MessageContentProps,
  MessageContentState,
  MessageImageRenderFnProps,
  MessageImagesProps,
  MessageLoadingIndicatorProps,
  MessageRenderedComponentProps,
  MessageRootProps,
} from "./message";

// MessageInput components
export { IS_PASTED_IMAGE, MAX_IMAGES, MessageInput } from "./message-input";
export type {
  MessageInputContentProps,
  MessageInputContentState,
  MessageInputContextValue,
  MessageInputElicitationProps,
  MessageInputElicitationState,
  MessageInputErrorProps,
  MessageInputErrorState,
  MessageInputFileButtonProps,
  MessageInputFileButtonState,
  MessageInputRootProps,
  MessageInputStagedImagesProps,
  MessageInputStagedImagesState,
  MessageInputStopButtonProps,
  MessageInputStopButtonState,
  MessageInputSubmitButtonProps,
  MessageInputSubmitButtonState,
  MessageInputTextareaProps,
  MessageInputTextareaState,
  MessageInputToolbarProps,
  MessageInputValueAccessProps,
  MessageInputValueAccessState,
  PromptFormatOptions,
  PromptItem,
  PromptProvider,
  ResourceFormatOptions,
  ResourceItem,
  ResourceProvider,
  StagedImage,
  StagedImageState,
  TamboEditor,
} from "./message-input";

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

// Hooks
export { useRender } from "@base-ui/react/use-render";
