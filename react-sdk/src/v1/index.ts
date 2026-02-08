/**
 * `@tambo-ai/react` - React SDK for Tambo AI
 *
 * Provides React hooks and providers for building AI-powered applications
 * using the streaming API with AG-UI protocol.
 *
 * ## Authentication & Thread Ownership
 *
 * All thread operations require user identification. Provide ONE of:
 * - `userKey` - Direct user identifier (for server-side or trusted environments)
 * - `userToken` - OAuth bearer token containing the userKey (for client-side apps)
 *
 * Threads are scoped to the userKey - each user only sees their own threads.
 *
 * ## Quick Start
 *
 * ```tsx
 * import {
 *   TamboProvider,
 *   useTambo,
 *   useTamboThreadInput,
 * } from '@tambo-ai/react';
 *
 * function App() {
 *   return (
 *     <TamboProvider
 *       apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
 *       userKey={currentUserId} // Required: identifies thread owner
 *       components={[WeatherCard]}
 *       tools={[searchTool]}
 *     >
 *       <ChatInterface />
 *     </TamboProvider>
 *   );
 * }
 *
 * function ChatInterface() {
 *   const [threadId, setThreadId] = useState<string>();
 *   const { messages, isStreaming } = useTambo();
 *   const { value, setValue, submit, isPending } = useTamboThreadInput();
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     const result = await submit();
 *     if (!threadId) setThreadId(result.threadId);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {messages.map(msg => <Message key={msg.id} message={msg} />)}
 *       {isStreaming && <LoadingIndicator />}
 *       <input value={value} onChange={(e) => setValue(e.target.value)} />
 *       <button disabled={isPending}>Send</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * ## Type Imports
 *
 * Types are imported directly:
 * - Thread state: `import type { TamboThread } from '@tambo-ai/react'`
 * - Messages: `import type { TamboThreadMessage } from '@tambo-ai/react'`
 *
 * SDK types: `import type { ... } from '@tambo-ai/typescript-sdk'`
 * AG-UI events: `import { EventType, type BaseEvent } from '@ag-ui/core'`
 */

// =============================================================================
// Providers
// =============================================================================

export {
  TamboProvider,
  type TamboProviderProps,
  useTamboConfig,
  type TamboConfig,
} from "./providers/tambo-v1-provider";

// Re-export registry provider
export { TamboRegistryProvider } from "../providers/tambo-registry-provider";

// Re-export client provider
export {
  TamboClientProvider,
  useIsTamboTokenUpdating,
} from "../providers/tambo-client-provider";

// Re-export context helpers
export {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "../providers/tambo-context-helpers-provider";

// Re-export context attachment hook
export { useTamboContextAttachment } from "../providers/tambo-context-attachment-provider";

// Export thread input provider for advanced composition
export {
  TamboThreadInputProvider,
  type TamboThreadInputContextProps,
  type SubmitOptions,
} from "./providers/tambo-v1-thread-input-provider";

// Export stub provider for testing
export {
  TamboStubProvider,
  type TamboStubProviderProps,
} from "./providers/tambo-v1-stub-provider";

// =============================================================================
// Components
// =============================================================================

export {
  ComponentRenderer,
  type ComponentRendererProps,
} from "./components/v1-component-renderer";

// =============================================================================
// Hooks
// =============================================================================

export { useTambo, type UseTamboReturn } from "./hooks/use-tambo-v1";

export type { TamboAuthState } from "./types/auth";

export type { ToolChoice } from "./types/tool-choice";

export { useTamboThreadInput } from "./hooks/use-tambo-v1-thread-input";

export { useTamboThread } from "./hooks/use-tambo-v1-thread";

export { useTamboThreadList } from "./hooks/use-tambo-v1-thread-list";

export { useTamboComponentState } from "./hooks/use-tambo-v1-component-state";

export {
  useTamboStreamStatus,
  type StreamStatus,
  type PropStatus,
} from "./hooks/use-tambo-v1-stream-status";

export {
  useTamboSuggestions,
  type UseTamboSuggestionsOptions,
  type UseTamboSuggestionsReturn,
  type AcceptSuggestionOptions,
} from "./hooks/use-tambo-v1-suggestions";

// Re-export client hook
export { useTamboClient } from "../providers/tambo-client-provider";

// Re-export image handling hook (pure React, API-agnostic)
export {
  useMessageImages,
  type StagedImage,
} from "../hooks/use-message-images";

// Re-export voice input hook (uses standalone transcription API)
export { useTamboVoice } from "../hooks/use-tambo-voice";

// =============================================================================
// Message Context (for components rendered by the AI)
// =============================================================================

export {
  TamboMessageProvider,
  useTamboCurrentMessage,
  useTamboCurrentComponent,
  type TamboCurrentComponent,
} from "./hooks/use-tambo-current-message";

// =============================================================================
// Re-exports from SDK
// =============================================================================

// Tool definition helper
export { defineTool } from "../util/registry";

// Built-in context helpers
export {
  currentPageContextHelper,
  currentTimeContextHelper,
} from "../context-helpers";

// Context helper types
export type {
  AdditionalContext,
  ContextHelperFn,
  ContextHelpers,
} from "../context-helpers";

// Component and tool types
export type {
  ComponentContextToolMetadata,
  ComponentRegistry,
  ParameterSpec,
  RegisteredComponent,
  TamboComponent,
  TamboTool,
  ToolAnnotations,
} from "../model/component-metadata";

// MCP server types
export { MCPTransport } from "../model/mcp-server-info";
export type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "../model/mcp-server-info";

// Resource types
export type {
  ListResourceItem,
  ReadResourceResult,
  ResourceSource,
} from "../model/resource-info";

// Error types from Tambo TypeScript SDK
export type {
  APIError,
  RateLimitError,
  TamboAIError,
} from "@tambo-ai/typescript-sdk";

// Suggestion types from Tambo TypeScript SDK
export type {
  Suggestion,
  SuggestionGenerateParams,
  SuggestionGenerateResponse,
  SuggestionListResponse,
} from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";

// Extended content types with computed state
export type {
  TamboToolUseContent,
  TamboToolDisplayProps,
} from "./types/message";

// Thread message type
export type { TamboThreadMessage } from "./types/message";

// Content types
export type {
  Content,
  TamboComponentContent,
  ComponentStreamingState,
  MessageRole,
  TextContent,
  ToolResultContent,
  ResourceContent,
  InputMessage,
  InitialInputMessage,
  MessageListResponse,
  MessageGetResponse,
} from "./types/message";

// Thread types
export type {
  TamboThread,
  RunStatus,
  StreamingState,
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
} from "./types/thread";

// Component content context
export {
  ComponentContentProvider,
  useComponentContent,
  type ComponentContentContext,
} from "./utils/component-renderer";

// =============================================================================
// Interactable Components
// =============================================================================

// HOC for making components interactable by the AI
export {
  withTamboInteractable,
  type InteractableConfig,
  type WithTamboInteractableProps,
} from "../hoc/with-tambo-interactable";

// Interactable provider hooks
export {
  useTamboInteractable,
  useCurrentInteractablesSnapshot,
} from "../providers/tambo-interactable-provider";

// Interactable types
export type {
  TamboInteractableComponent as InteractableComponent,
  TamboInteractableContext,
} from "../model/tambo-interactable";
