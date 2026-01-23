/**
 * @tambo-ai/react/v1 - React SDK for Tambo v1 API
 *
 * Provides React hooks and providers for building AI-powered applications
 * using the v1 streaming API with AG-UI protocol.
 *
 * Types are not re-exported. Import directly from specific type files:
 * - Custom events: import from '@tambo-ai/react/v1/types/event'
 * - Thread state: import from '@tambo-ai/react/v1/types/thread'
 * - Messages: import from '@tambo-ai/react/v1/types/message'
 * - Components: import from '@tambo-ai/react/v1/types/component'
 * - Tools: import from '@tambo-ai/react/v1/types/tool'
 *
 * SDK types: import directly from @tambo-ai/typescript-sdk
 * AG-UI events: import directly from @ag-ui/core
 * @example
 * ```typescript
 * import { TamboV1Provider, useTamboV1 } from '@tambo-ai/react/v1';
 *
 * function App() {
 *   return (
 *     <TamboV1Provider apiKey="your-api-key">
 *       <ChatInterface />
 *     </TamboV1Provider>
 *   );
 * }
 *
 * function ChatInterface() {
 *   const { thread, sendMessage, isStreaming } = useTamboV1();
 *   // ... implementation
 * }
 * ```
 */

// Providers (TODO: implement in Phase 7)
// export { TamboV1Provider } from './providers/tambo-v1-provider';
// export { TamboRegistryProvider } from '../providers/tambo-registry-provider'; // Reused from beta

// Hooks (TODO: implement in Phase 7)
// export { useTamboV1 } from './hooks/use-tambo-v1';
// export { useTamboV1Thread } from './hooks/use-tambo-v1-thread';
// export { useTamboV1Messages } from './hooks/use-tambo-v1-messages';
// export { useTamboV1SendMessage } from './hooks/use-tambo-v1-send-message';
// export { useTamboV1ComponentState } from './hooks/use-tambo-v1-component-state';

// Utilities (TODO: implement in Phase 2-3)
// export { applyJsonPatch } from './utils/json-patch';
