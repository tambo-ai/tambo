/**
 * `@tambo-ai/react/v1` - React SDK for Tambo v1 API
 *
 * Provides React hooks and providers for building AI-powered applications
 * using the v1 streaming API with AG-UI protocol.
 *
 * ## Quick Start
 *
 * ```tsx
 * import {
 *   TamboV1Provider,
 *   useTamboV1,
 *   useTamboV1SendMessage,
 * } from '@tambo-ai/react/v1';
 *
 * function App() {
 *   return (
 *     <TamboV1Provider
 *       apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
 *       components={[WeatherCard]}
 *       tools={[searchTool]}
 *     >
 *       <ChatInterface />
 *     </TamboV1Provider>
 *   );
 * }
 *
 * function ChatInterface() {
 *   const [threadId, setThreadId] = useState<string>();
 *   const { messages, isStreaming } = useTamboV1(threadId);
 *   const sendMessage = useTamboV1SendMessage(threadId);
 *
 *   const handleSend = async (text: string) => {
 *     const result = await sendMessage.mutateAsync({
 *       message: { role: 'user', content: [{ type: 'text', text }] },
 *     });
 *     if (!threadId) setThreadId(result.threadId);
 *   };
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <Message key={msg.id} message={msg} />)}
 *       {isStreaming && <LoadingIndicator />}
 *       <MessageInput onSend={handleSend} />
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Type Imports
 *
 * Types are imported directly from specific files:
 * - Thread state: `import type { TamboV1Thread } from '@tambo-ai/react/v1/types/thread'`
 * - Messages: `import type { TamboV1Message } from '@tambo-ai/react/v1/types/message'`
 * - Custom events: `import type { ComponentStartEvent } from '@tambo-ai/react/v1/types/event'`
 *
 * SDK types: `import type { ... } from '@tambo-ai/typescript-sdk'`
 * AG-UI events: `import { EventType, type BaseEvent } from '@ag-ui/core'`
 */

// =============================================================================
// Providers
// =============================================================================

export {
  TamboV1Provider,
  type TamboV1ProviderProps,
} from "./providers/tambo-v1-provider";

export {
  TamboV1StreamProvider,
  useStreamState,
  useStreamDispatch,
  useThreadManagement,
  type ThreadManagement,
} from "./providers/tambo-v1-stream-context";

// Re-export registry provider from beta SDK (works with v1)
export { TamboRegistryProvider } from "../providers/tambo-registry-provider";

// =============================================================================
// Hooks
// =============================================================================

export { useTamboV1, type UseTamboV1Return } from "./hooks/use-tambo-v1";

export {
  useTamboV1Messages,
  type UseTamboV1MessagesReturn,
} from "./hooks/use-tambo-v1-messages";

export {
  useTamboV1SendMessage,
  type SendMessageOptions,
} from "./hooks/use-tambo-v1-send-message";

export { useTamboV1Thread } from "./hooks/use-tambo-v1-thread";

export { useTamboV1ThreadList } from "./hooks/use-tambo-v1-thread-list";

// =============================================================================
// Utilities
// =============================================================================

export { applyJsonPatch } from "./utils/json-patch";

export {
  toAvailableComponent,
  toAvailableComponents,
  toAvailableTool,
  toAvailableTools,
} from "./utils/registry-conversion";

export {
  executeClientTool,
  executeAllPendingTools,
  type PendingToolCall,
} from "./utils/tool-executor";

export { handleEventStream } from "./utils/stream-handler";
