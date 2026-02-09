/**
 * @tambo-ai/react-ui-base
 *
 * Unstyled base components for building Tambo UI.
 * These primitives provide structure and behavior without styling,
 * allowing consumers to apply their own design system.
 */

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

// EditWithTamboButton components
export { EditWithTamboButtonBase } from "./edit-with-tambo-button";
export type {
  EditWithTamboButtonContextValue,
  EditWithTamboButtonPopoverProps,
  EditWithTamboButtonRootProps,
  EditWithTamboButtonRootRenderProps,
  EditWithTamboButtonSendButtonProps,
  EditWithTamboButtonSendButtonRenderProps,
  EditWithTamboButtonSendMode,
  EditWithTamboButtonSendModeDropdownProps,
  EditWithTamboButtonSendModeOptionProps,
  EditWithTamboButtonStatusProps,
  EditWithTamboButtonStatusRenderProps,
  EditWithTamboButtonTextareaProps,
  EditWithTamboButtonTriggerProps,
} from "./edit-with-tambo-button";

// CanvasSpace components
export { CanvasSpace } from "./canvas-space";
export type {
  CanvasSpaceContentProps,
  CanvasSpaceContentRenderProps,
  CanvasSpaceEmptyStateProps,
  CanvasSpaceRootProps,
  CanvasSpaceViewportProps,
} from "./canvas-space";

// MessageThreadCollapsible components
export { MessageThreadCollapsible } from "./message-thread-collapsible";
export type {
  MessageThreadCollapsibleContentProps,
  MessageThreadCollapsibleContentRenderProps,
  MessageThreadCollapsibleContextValue,
  MessageThreadCollapsibleHeaderProps,
  MessageThreadCollapsibleHeaderRenderProps,
  MessageThreadCollapsibleRootProps,
  MessageThreadCollapsibleRootRenderProps,
  MessageThreadCollapsibleTriggerProps,
  MessageThreadCollapsibleTriggerRenderProps,
} from "./message-thread-collapsible";

// ControlBar components
export { ControlBar } from "./control-bar";
export type {
  ControlBarContentProps,
  ControlBarContentRenderProps,
  ControlBarOverlayProps,
  ControlBarPortalProps,
  ControlBarRootContextValue,
  ControlBarRootProps,
  ControlBarRootRenderProps,
  ControlBarTitleProps,
  ControlBarTriggerProps,
  ControlBarTriggerRenderProps,
} from "./control-bar";

// Graph components
export { Graph, validateGraphData } from "./graph";
export type {
  GraphChartProps,
  GraphChartRenderProps,
  GraphData,
  GraphDataset,
  GraphDataState,
  GraphErrorBoundaryProps,
  GraphLoadingProps,
  GraphLoadingRenderProps,
  GraphLoadingStatus,
  GraphRootContextValue,
  GraphRootProps,
  GraphTitleProps,
  GraphTitleRenderProps,
} from "./graph";

// Form components
export { Form } from "./form";
export type {
  FormErrorProps,
  FormFieldDefinition,
  FormFieldDescriptionProps,
  FormFieldInputProps,
  FormFieldLabelProps,
  FormFieldProps,
  FormFieldsProps,
  FormFieldsRenderProps,
  FormFieldType,
  FormRootContextValue,
  FormRootProps,
  FormState,
  FormSubmitProps,
  FormSubmitRenderProps,
} from "./form";

// InputFields components
export { fieldSchema, InputFields, inputFieldsSchema } from "./input-fields";
export type {
  Field,
  InputFieldsDescriptionProps,
  InputFieldsErrorProps,
  InputFieldsFieldProps,
  InputFieldsInputProps,
  InputFieldsLabelProps,
  InputFieldsProps,
  InputFieldsRootProps,
  InputFieldsRootRenderProps,
  InputFieldsState,
} from "./input-fields";

// MessageSuggestions components
export { MessageSuggestions } from "./message-suggestions";
export type {
  MessageSuggestionsContextValue,
  MessageSuggestionsGenerationStageProps,
  MessageSuggestionsGenerationStageRenderProps,
  MessageSuggestionsItemProps,
  MessageSuggestionsListProps,
  MessageSuggestionsListRenderProps,
  MessageSuggestionsRootProps,
  MessageSuggestionsStatusProps,
  MessageSuggestionsStatusRenderProps,
} from "./message-suggestions";

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
export { IS_PASTED_IMAGE, MAX_IMAGES, MessageInput } from "./message-input";
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

// ThreadContent components
export { ThreadContent } from "./thread-content";
export type {
  ThreadContentMessageListProps,
  ThreadContentMessageListRenderProps,
  ThreadContentMessageProps,
  ThreadContentRootContextValue,
  ThreadContentRootProps,
} from "./thread-content";

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

// ThreadHistory components
export { ThreadHistory } from "./thread-history";
export type {
  ThreadHistoryCollapseToggleProps,
  ThreadHistoryHeaderProps,
  ThreadHistoryHeaderRenderProps,
  ThreadHistoryItemProps,
  ThreadHistoryItemRenderProps,
  ThreadHistoryListProps,
  ThreadHistoryListRenderProps,
  ThreadHistoryNewThreadButtonProps,
  ThreadHistoryNewThreadButtonRenderProps,
  ThreadHistoryRootContextValue,
  ThreadHistoryRootProps,
  ThreadHistoryRootRenderProps,
  ThreadHistorySearchInputProps,
  ThreadHistorySearchInputRenderProps,
} from "./thread-history";

// Map components
export { MapBase } from "./map";
export type {
  HeatData,
  MapContainerProps,
  MapContainerRenderProps,
  MapErrorProps,
  MapErrorRenderProps,
  MapHeatmapProps,
  MapHeatmapRenderProps,
  MapLoadingProps,
  MapLoadingRenderProps,
  MapMarkersProps,
  MapMarkersRenderProps,
  MapRootContextValue,
  MapRootProps,
  MarkerData,
  TileTheme,
  ValidatedHeatDataTuple,
  ValidatedMarkerData,
} from "./map";

// ScrollableMessageContainer components
export { ScrollableMessageContainer } from "./scrollable-message-container";
export type {
  ScrollableMessageContainerRootContextValue,
  ScrollableMessageContainerRootProps,
  ScrollableMessageContainerScrollToBottomProps,
  ScrollableMessageContainerScrollToBottomRenderProps,
  ScrollableMessageContainerViewportProps,
} from "./scrollable-message-container";

// MessageThreadFull components
export { MessageThreadFull } from "./message-thread-full";
export type {
  MessageThreadFullContainerProps,
  MessageThreadFullContainerRenderProps,
  MessageThreadFullContextValue,
  MessageThreadFullRootProps,
  MessageThreadFullRootRenderProps,
  MessageThreadFullSidebarProps,
} from "./message-thread-full";

// MessageThreadPanel components
export { MessageThreadPanel } from "./message-thread-panel";
export type {
  MessageThreadPanelContentProps,
  MessageThreadPanelContextValue,
  MessageThreadPanelResizableProps,
  MessageThreadPanelResizableRenderProps,
  MessageThreadPanelRootProps,
  MessageThreadPanelRootRenderProps,
  MessageThreadPanelSidebarProps,
} from "./message-thread-panel";

// Types
export type {
  BaseProps,
  BasePropsWithChildrenOrRenderFunction,
  PropsWithChildrenOrRenderFunction,
} from "./types/component-render-or-children";

// Hooks
export { useRender } from "./use-render/use-render";
