/** Exports for the library. Only publically available exports are re-exported here. Anything not exported here is not supported and may change or break at any time. */
export { useTamboComponentState } from "./hooks/use-component-state";
export {
  TamboMessageProvider,
  useTamboCurrentMessage,
  useTamboMessageContext,
} from "./hooks/use-current-message";
export { useTamboStreamingProps } from "./hooks/use-streaming-props";
export * from "./hooks/use-suggestions";
export { useTamboThreadInput } from "./hooks/use-thread-input";

// Re-export provider components
export {
  TamboClientProvider,
  TamboComponentProvider,
  TamboProvider,
  TamboThreadProvider,
  useTambo,
  useTamboClient,
  useTamboThread,
  type TamboComponent,
  type TamboRegistryContext,
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
