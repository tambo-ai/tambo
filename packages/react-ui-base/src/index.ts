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

// MessageInput components
export { MessageInput } from "./message-input";
export type {
  MessageInputContentProps,
  MessageInputContentRenderProps,
  MessageInputContextValue,
  MessageInputErrorProps,
  MessageInputErrorRenderProps,
  MessageInputFileButtonProps,
  MessageInputFileButtonRenderProps,
  MessageInputRootProps,
  MessageInputStagedImagesProps,
  MessageInputStagedImagesRenderProps,
  MessageInputSubmitButtonProps,
  MessageInputSubmitButtonRenderProps,
  MessageInputTextareaProps,
  MessageInputTextareaRenderProps,
  MessageInputToolbarProps,
  MessageInputValueAccessProps,
  MessageInputValueAccessRenderProps,
  PromptFormatOptions,
  PromptItem,
  PromptProvider,
  ResourceFormatOptions,
  ResourceItem,
  ResourceProvider,
  StagedImage,
  StagedImageRenderProps,
  TamboEditor,
} from "./message-input";
export { IS_PASTED_IMAGE, MAX_IMAGES } from "./message-input";

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

// ThreadDropdown components
export { ThreadDropdown } from "./thread-dropdown";
export type {
  ThreadDropdownContextValue,
  ThreadDropdownMenuProps,
  ThreadDropdownMenuRenderProps,
  ThreadDropdownNewThreadItemProps,
  ThreadDropdownNewThreadItemRenderProps,
  ThreadDropdownRootProps,
  ThreadDropdownThread,
  ThreadDropdownThreadItemProps,
  ThreadDropdownThreadItemRenderProps,
  ThreadDropdownTriggerProps,
} from "./thread-dropdown";

// Types
export type {
  BaseProps,
  BasePropsWithChildrenOrRenderFunction,
  PropsWithChildrenOrRenderFunction,
} from "./types/component-render-or-children";

// Hooks
export { useRender } from "./use-render/use-render";
