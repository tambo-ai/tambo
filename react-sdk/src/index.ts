/** Exports for the library. Only publically available exports are re-exported here. Anything not exported here is not supported and may change or break at any time. */

export { useTamboComponentState } from "./hooks/use-component-state";
export {
  TamboMessageProvider,
  useTamboCurrentMessage,
} from "./hooks/use-current-message";
export { useTamboStreamingProps } from "./hooks/use-streaming-props";
export * from "./hooks/use-suggestions";
export {
  useTamboStreamStatus,
  type PropStatus,
  type StreamStatus,
} from "./hooks/use-tambo-stream-status";

// Re-export provider components
export {
  TamboClientProvider,
  TamboComponentProvider,
  TamboContextHelpersProvider,
  TamboPropStreamProvider,
  TamboProvider,
  TamboStubProvider,
  TamboThreadInputProvider,
  TamboThreadProvider,
  useTambo,
  useTamboClient,
  useTamboContextHelpers,
  useTamboGenerationStage,
  useTamboStream,
  useTamboThread,
  useTamboThreadInput,
  type TamboComponent,
  type TamboContextHelpersContextProps,
  type TamboContextHelpersProviderProps,
  type TamboRegistryContext,
  type TamboStubProviderProps,
  type TamboThreadInputContextProps,
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
  currentPageContextHelper,
  currentTimeContextHelper,
} from "./context-helpers";
export type {
  AdditionalContext,
  ContextHelperFn,
  ContextHelpers,
} from "./context-helpers";
