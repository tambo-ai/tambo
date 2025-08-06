/** Exports for the library. Only publically available exports are re-exported here. Anything not exported here is not supported and may change or break at any time. */

export { useTamboComponentState } from "./hooks/use-component-state";
export {
  TamboMessageProvider,
  useTamboCurrentMessage,
  useTamboMessageContext,
} from "./hooks/use-current-message";
export { useTamboStreamingProps } from "./hooks/use-streaming-props";
export * from "./hooks/use-suggestions";
export {
  useTamboStreamStatus,
  type PropStatus,
  type StreamStatus,
} from "./hooks/use-tambo-stream-status";
export { useTamboThreadInput } from "./hooks/use-thread-input";

// Re-export provider components
export {
  TamboClientProvider,
  TamboComponentProvider,
  TamboContextHelpersProvider,
  TamboPropStreamProvider,
  TamboProvider,
  TamboStubProvider,
  TamboThreadProvider,
  useTambo,
  useTamboClient,
  useTamboContextHelpers,
  useTamboStream,
  useTamboThread,
  type TamboComponent,
  type TamboContextHelpersContextProps,
  type TamboContextHelpersProviderProps,
  type TamboRegistryContext,
  type TamboStubProviderProps,
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

export type {
  TamboInteractableComponent as InteractableComponent,
  TamboInteractableContext,
} from "./model/tambo-interactable";
export {
  withTamboInteractable as withInteractable,
  type InteractableConfig,
  type WithTamboInteractableProps,
} from "./providers/hoc/with-tambo-interactable";
export { useTamboInteractable } from "./providers/tambo-interactable-provider";

// Context helpers exports
export {
  createContextHelper,
  DEFAULT_CONTEXT_HELPERS,
  getUserPageContext,
  getUserTimeContext,
} from "./context-helpers";
export type {
  AdditionalContext,
  AdditionalContextHelper,
  ContextHelpersConfig,
  CustomContextHelperConfig,
} from "./context-helpers";
