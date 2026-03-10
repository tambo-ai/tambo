/**
 * @tambo-ai/react-ui-base
 *
 * Unstyled base components for building Tambo UI.
 * These primitives provide structure and behavior without styling,
 * allowing consumers to apply their own design system.
 */

// GenerationStage components
export { GenerationStage } from "./generation-stage";
export type {
  GenerationStageContentProps,
  GenerationStageContentState,
  GenerationStageContextValue,
  GenerationStageRootProps,
  GenerationStageRootState,
  GenerationStageStreamingProps,
  GenerationStageStreamingState,
  GenerationStageWaitingProps,
  GenerationStageWaitingState,
} from "./generation-stage";

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

// ThreadDropdown components
export { ThreadDropdown } from "./thread-dropdown";
export type {
  ThreadDropdownContentProps,
  ThreadDropdownContentState,
  ThreadDropdownContextValue,
  ThreadDropdownNewThreadProps,
  ThreadDropdownNewThreadState,
  ThreadDropdownRootProps,
  ThreadDropdownRootState,
  ThreadDropdownThreadItemProps,
  ThreadDropdownThreadItemState,
  ThreadDropdownTriggerProps,
  ThreadDropdownTriggerState,
} from "./thread-dropdown";

// ThreadHistory components
export { ThreadHistory } from "./thread-history";
export type {
  ThreadHistoryContextValue,
  ThreadHistoryItemProps,
  ThreadHistoryItemState,
  ThreadHistoryListProps,
  ThreadHistoryListState,
  ThreadHistoryNewThreadButtonProps,
  ThreadHistoryNewThreadButtonState,
  ThreadHistoryRootProps,
  ThreadHistoryRootState,
  ThreadHistorySearchProps,
  ThreadHistorySearchState,
  ThreadListItem,
} from "./thread-history";

// ThreadContent components
export { ThreadContent, useThreadContentContext } from "./thread-content";
export type {
  ThreadContentContextValue,
  ThreadContentEmptyProps,
  ThreadContentEmptyState,
  ThreadContentLoadingProps,
  ThreadContentLoadingState,
  ThreadContentMessagesProps,
  ThreadContentMessagesState,
  ThreadContentRootProps,
  ThreadContentRootState,
} from "./thread-content";

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

// McpPrompts components
export { McpPrompts } from "./mcp-prompts";
export type {
  McpPromptsContextValue,
  McpPromptsErrorProps,
  McpPromptsErrorState,
  McpPromptsItemProps,
  McpPromptsItemState,
  McpPromptsListProps,
  McpPromptsListState,
  McpPromptsRootProps,
  McpPromptsRootState,
  McpPromptsStatus,
  McpPromptsTriggerProps,
  McpPromptsTriggerState,
} from "./mcp-prompts";

// McpResources components
export { McpResources } from "./mcp-resources";
export type {
  McpResourcesContextValue,
  McpResourcesItemProps,
  McpResourcesItemState,
  McpResourcesListProps,
  McpResourcesListState,
  McpResourcesRootProps,
  McpResourcesRootState,
  McpResourcesSearchProps,
  McpResourcesSearchState,
  McpResourcesTriggerProps,
  McpResourcesTriggerState,
} from "./mcp-resources";
