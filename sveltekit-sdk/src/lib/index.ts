/**
 * @tambo-ai/svelte - Svelte SDK for Tambo AI
 *
 * Build AI-powered generative UI applications with SvelteKit.
 */

// === Providers ===
export { default as TamboProvider } from "./providers/TamboProvider.svelte";
export { default as TamboMessageProvider } from "./providers/TamboMessageProvider.svelte";
export { default as TamboMcpProvider } from "./providers/TamboMcpProvider.svelte";
export type { TamboProviderProps } from "./providers/TamboProvider.svelte";
export type { TamboMessageContext } from "./providers/TamboMessageProvider.svelte";
export type {
  TamboMcpContext,
  McpTool,
  McpResource,
  McpPrompt,
  McpServer,
  ConnectedMcpServer,
  FailedMcpServer,
} from "./providers/TamboMcpProvider.svelte";

// === Hooks ===
export {
  useTambo,
  type TamboContext,
  type TamboConfig,
} from "./hooks/useTambo.js";
export { useTamboClient } from "./hooks/useTamboClient.js";
export { useTamboThread } from "./hooks/useTamboThread.js";
export {
  useTamboThreadInput,
  type TamboThreadInputContext,
} from "./hooks/useTamboThreadInput.js";
export { useTamboRegistry } from "./hooks/useTamboRegistry.js";
export {
  useTamboStreamStatus,
  type StreamStatus,
  type PropStatus,
} from "./hooks/useTamboStreamStatus.js";
export { useTamboInteractable } from "./hooks/useTamboInteractable.js";
export {
  useTamboCurrentMessage,
  useTamboCurrentComponent,
} from "./hooks/useTamboCurrentMessage.js";
export {
  createTamboComponentState,
  type ComponentStateResult,
} from "./hooks/useTamboComponentState.js";
export {
  createTamboVoice,
  type TamboVoiceResult,
} from "./hooks/useTamboVoice.svelte.js";
export {
  useTamboMcpServers,
  useTamboMcpPrompt,
  useTamboMcpResource,
} from "./hooks/useTamboMcp.js";

// === Stores ===
export {
  createThreadStore,
  type ThreadStore,
  type ThreadStoreOptions,
  type SendMessageOptions,
} from "./stores/thread.svelte.js";
export {
  createRegistryStore,
  type RegistryStore,
} from "./stores/registry.svelte.js";
export { createInputStore, type InputStore } from "./stores/input.svelte.js";
export {
  createStreamStatusStore,
  type StreamStatusStore,
} from "./stores/stream-status.svelte.js";
export {
  createInteractableStore,
  type InteractableStore,
} from "./stores/interactable.svelte.js";

// === Client ===
export { createTamboClient, isTamboClient } from "./client.js";

// === Types ===
export type {
  TamboThread,
  TamboThreadMessage,
  TamboComponent,
  TamboTool,
  GenerationStage,
  MessageRole,
  ContentPart,
  TextContentPart,
  ImageContentPart,
  AudioContentPart,
  StagedImage,
  Suggestion,
  InteractableMetadata,
  MessageComponent,
  TamboInteractableComponent,
  TamboClientOptions,
  TamboProviderOptions,
  ContextHelperFn,
  ContextHelpers,
  AdditionalContext,
  SupportedSchema,
  ToolAnnotations,
  McpServerInfo,
  McpTransport,
  ComponentRegistry,
  TamboToolRegistry,
  TamboToolAssociations,
  JSONSchema7,
} from "./types.js";

// === Utilities ===
export { defineTool, assertValidName } from "./util/registry.js";
export {
  toText,
  extractTextFromContent,
  hasImages,
  isTextContentPart,
} from "./util/content-parts.js";
export {
  createDebouncedCallback,
  type DebouncedCallback,
} from "./util/debounce.js";

// === Context Helpers ===
export {
  currentPageContextHelper,
  currentTimeContextHelper,
} from "./context-helpers/index.js";

// === Context Keys (for advanced use cases) ===
export {
  TAMBO_CLIENT_KEY,
  TAMBO_THREAD_KEY,
  TAMBO_REGISTRY_KEY,
  TAMBO_INPUT_KEY,
  TAMBO_STATUS_KEY,
  TAMBO_INTERACTABLE_KEY,
  TAMBO_MESSAGE_KEY,
  TAMBO_CONFIG_KEY,
  TAMBO_MCP_KEY,
  TAMBO_CONTEXT_HELPERS_KEY,
  CONTEXT_KEYS,
} from "./context.js";

// === Re-exports from Tambo TypeScript SDK ===
export type {
  APIError,
  RateLimitError,
  TamboAIError,
} from "@tambo-ai/typescript-sdk";
