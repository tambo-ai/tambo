// Client
export { getTamboClient, resetTamboClient } from "./client.js";

// Context and hooks
export {
  createTamboContext,
  getTamboContext,
  useTambo,
  useTamboInput,
  useTamboStatus,
  useTamboRegistry,
  type TamboContext,
} from "./context.js";

// Stores
export {
  createThreadStore,
  type ThreadStore,
  type ThreadStoreOptions,
} from "./stores/thread.svelte.js";
export { createInputStore, type InputStore } from "./stores/input.svelte.js";
export {
  createStreamStatusStore,
  type StreamStatusStore,
} from "./stores/stream-status.svelte.js";
export {
  createRegistryStore,
  type RegistryStore,
} from "./stores/registry.svelte.js";

// Types
export type {
  MessageRole,
  TextContentPart,
  ImageContentPart,
  ContentPart,
  TamboThreadMessage,
  TamboThread,
  TamboComponent,
  TamboTool,
  GenerationStage,
  StagedImage,
  Suggestion,
} from "./types.js";
