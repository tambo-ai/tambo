/** Exports for the library. Only publically available exports are re-exported here. Anything not exported here is not supported and may change or break at any time. */

export { useTamboComponentState } from "./hooks/use-component-state.js";
export {
  TamboMessageProvider,
  useTamboCurrentComponent,
  useTamboCurrentMessage,
  type TamboCurrentComponent,
} from "./hooks/use-current-message.js";
export {
  useMessageImages,
  type StagedImage,
} from "./hooks/use-message-images.js";
export { useTamboStreamingProps } from "./hooks/use-streaming-props.js";
export * from "./hooks/use-suggestions.js";
export {
  useTamboStreamStatus,
  type PropStatus,
  type StreamStatus,
} from "./hooks/use-tambo-stream-status.js";
export { useTamboVoice } from "./hooks/use-tambo-voice.js";

// Re-export provider components
export {
  TamboClientProvider,
  TamboComponentProvider,
  TamboContextAttachmentProvider,
  TamboContextHelpersProvider,
  TamboPropStreamProvider,
  TamboProvider,
  TamboRegistryProvider,
  TamboStubProvider,
  TamboThreadInputProvider,
  TamboThreadProvider,
  useIsTamboTokenUpdating,
  useTambo,
  useTamboClient,
  useTamboContextAttachment,
  useTamboContextHelpers,
  useTamboGenerationStage,
  useTamboMcpServerInfos,
  useTamboStream,
  useTamboThread,
  useTamboThreadInput,
  type ContextAttachment,
  type ContextAttachmentState,
  type RegisterToolFn,
  type RegisterToolsFn,
  type TamboComponent,
  type TamboContextAttachmentProviderProps,
  type TamboContextHelpersContextProps,
  type TamboContextHelpersProviderProps,
  type TamboRegistryContext,
  type TamboStubProviderProps,
  type TamboThreadInputContextProps,
  type TamboThreadProviderProps,
} from "./providers/index.js";

// Re-export types from Tambo Node SDK
export type {
  APIError,
  RateLimitError,
  TamboAIError,
} from "@tambo-ai/typescript-sdk";
export type {
  Suggestion,
  SuggestionGenerateParams,
  SuggestionGenerateResponse,
  SuggestionListResponse,
} from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
export {
  withTamboInteractable as withInteractable,
  type InteractableConfig,
  type WithTamboInteractableProps,
} from "./hoc/with-tambo-interactable.js";
export { useTamboThreadList } from "./hooks/use-tambo-threads.js";
export {
  type ComponentContextToolMetadata,
  type ComponentRegistry,
  type ParameterSpec,
  type RegisteredComponent,
  type TamboTool,
  type ToolAnnotations,
} from "./model/component-metadata.js";
export {
  GenerationStage,
  type InteractableMetadata,
  type TamboThreadMessage,
} from "./model/generate-component-response.js";
export type {
  TamboInteractableComponent as InteractableComponent,
  TamboInteractableContext,
} from "./model/tambo-interactable.js";
export { type TamboThread } from "./model/tambo-thread.js";
export {
  useCurrentInteractablesSnapshot,
  useTamboInteractable,
} from "./providers/tambo-interactable-provider.js";
export { type InitialTamboThreadMessage } from "./providers/tambo-thread-provider.js";
export { defineTool } from "./util/registry.js";

// Context helpers exports
export {
  currentPageContextHelper,
  currentTimeContextHelper,
} from "./context-helpers/index.js";
export type {
  AdditionalContext,
  ContextHelperFn,
  ContextHelpers,
} from "./context-helpers/index.js";

// MCP server metadata types (used by TamboProvider / registry / MCP provider)
export { MCPTransport } from "./model/mcp-server-info.js";
export type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "./model/mcp-server-info.js";

// Resource types for registry resource registration
export type {
  ListResourceItem,
  ReadResourceResult,
  ResourceSource,
} from "./model/resource-info.js";

// Note: Full MCP exports like TamboMcpProvider are available separately in the
// @tambo-ai/react/mcp package
