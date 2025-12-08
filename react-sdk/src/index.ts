/** Exports for the library. Only publically available exports are re-exported here. Anything not exported here is not supported and may change or break at any time. */

export { useTamboComponentState } from "./hooks/use-component-state";
export {
  TamboMessageProvider,
  useTamboCurrentMessage,
} from "./hooks/use-current-message";
export { useMessageImages, type StagedImage } from "./hooks/use-message-images";
export { useTamboStreamingProps } from "./hooks/use-streaming-props";
export * from "./hooks/use-suggestions";
export {
  useTamboStreamStatus,
  type PropStatus,
  type StreamStatus,
} from "./hooks/use-tambo-stream-status";
export { useTamboVoice } from "./hooks/use-tambo-voice";

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
  type ContextHelperData,
  type TamboComponent,
  type TamboContextAttachmentProviderProps,
  type TamboContextHelpersContextProps,
  type TamboContextHelpersProviderProps,
  type TamboRegistryContext,
  type TamboStubProviderProps,
  type TamboThreadInputContextProps,
  type TamboThreadProviderProps,
} from "./providers";

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
export { useTamboThreadList } from "./hooks/use-tambo-threads";
export {
  type ComponentContextToolMetadata,
  type ComponentRegistry,
  type ParameterSpec,
  type RegisteredComponent,
  type TamboTool,
} from "./model/component-metadata";
export {
  GenerationStage,
  type TamboThreadMessage,
} from "./model/generate-component-response";
export { type TamboThread } from "./model/tambo-thread";
export { type InitialTamboThreadMessage } from "./providers/tambo-thread-provider";

export type {
  TamboInteractableComponent as InteractableComponent,
  TamboInteractableContext,
} from "./model/tambo-interactable";
export { useTamboInteractableComponent } from "./providers/hoc/tambo-interactable-component-context";
export {
  withTamboInteractable as withInteractable,
  type InteractableConfig,
  type WithTamboInteractableProps,
} from "./providers/hoc/with-tambo-interactable";
export {
  useCurrentInteractablesSnapshot,
  useTamboInteractable,
} from "./providers/tambo-interactable-provider";

// Context helpers exports
export {
  currentPageContextHelper,
  currentTimeContextHelper,
} from "./context-helpers";
export type {
  AdditionalContext,
  ContextHelperFn,
  ContextHelpers,
} from "./context-helpers";

// MCP server metadata types (used by TamboProvider / registry / MCP provider)
export type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "./model/mcp-server-info";
export { MCPTransport } from "./model/mcp-server-info";

// Note: Full MCP exports like TamboMcpProvider are available separately in the
// @tambo-ai/react/mcp package
