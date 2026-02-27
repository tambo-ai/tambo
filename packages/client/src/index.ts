/**
 * `@tambo-ai/client` - Framework-agnostic client for Tambo AI
 *
 * Provides streaming, tool execution, and thread management
 * without React dependencies.
 * @packageDocumentation
 */

/** Client version constant. */
export const CLIENT_VERSION = "1.0.0";

// -- Core classes --
export { TamboClient } from "./tambo-client";
export type {
  TamboClientOptions,
  RunOptions,
  ClientState,
  BeforeRunContext,
  ContextHelperFn,
} from "./tambo-client";
export { TamboStream } from "./tambo-stream";
export type { StreamEvent, TamboStreamOptions } from "./tambo-stream";

// -- Send message utilities --
export {
  createRunStream,
  dispatchUserMessage,
  dispatchToolResults,
  executeToolsAndContinue,
} from "./utils/send-message";
export type {
  SendMessageOptions,
  CreateRunStreamParams,
  CreateRunStreamResult,
  ExecuteToolsParams,
  ExecuteToolsResult,
  RunStream,
  CreateStream,
} from "./utils/send-message";

// -- Types --
export type { TamboThread, StreamingState, RunStatus } from "./types/thread";
export type {
  TamboThreadMessage,
  TamboComponentContent,
  TamboToolUseContent,
  TamboToolDisplayProps,
  Content,
  MessageRole,
  ComponentStreamingState,
  InitialInputMessage,
} from "./types/message";
export type {
  ComponentStartEvent,
  ComponentPropsDeltaEvent,
  ComponentStateDeltaEvent,
  ComponentEndEvent,
  RunAwaitingInputEvent,
  MessageParentEvent,
  TamboCustomEvent,
  PendingToolCall as PendingToolCallEvent,
} from "./types/event";
export { isTamboCustomEvent, asTamboCustomEvent } from "./types/event";
export type { TamboAuthState } from "./types/auth";
export type { ToolChoice } from "./types/tool-choice";

// Re-export SDK types that are part of the public API
export type {
  TextContent,
  ToolResultContent,
  ResourceContent,
  InputMessage,
  MessageListResponse,
  MessageGetResponse,
} from "./types/message";
export type {
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
} from "./types/thread";

// -- Model --
export type {
  SupportedSchema,
  ToolAnnotations,
  ParameterSpec,
  ComponentContextToolMetadata,
  ComponentContextTool,
  RegisteredComponent,
  ComponentRegistry,
  TamboToolRegistry,
  JSONSchemaLite,
  TamboTool,
  TamboToolJSONSchema,
  TamboToolUnknown,
  TamboToolStandardSchema,
  UnsupportedSchemaTamboTool,
  TamboToolAssociations,
  TamboComponent,
  RegisterToolsFn,
  RegisterToolFn,
  DefineToolFn,
} from "./model/component-metadata";
export type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "./model/mcp-server-info";
export { MCPTransport, getMcpServerUniqueKey } from "./model/mcp-server-info";

// -- Schema --
export {
  looksLikeJSONSchema,
  makeJsonSchemaPartial,
  getParametersFromToolSchema,
  safeSchemaToJsonSchema,
  schemaToJsonSchema,
  isStandardSchema,
  assertNoRecordSchema,
} from "./schema/index";

// -- MCP --
export {
  MCPClient,
  ServerType,
  REGISTRY_SERVER_KEY,
  toElicitationRequestedSchema,
  hasRequestedSchema,
} from "./mcp/index";
export type {
  MCPToolCallResult,
  MCPToolSpec,
  MCPElicitationHandler,
  MCPSamplingHandler,
  MCPHandlers,
  ElicitationRequestedSchema,
  TamboElicitationRequest,
  TamboElicitationResponse,
  ElicitationContextState,
  PrimitiveSchemaDefinition,
} from "./mcp/index";

// -- Utils --
export {
  streamReducer,
  createInitialState,
  createInitialStateWithMessages,
  createInitialThreadState,
  isPlaceholderThreadId,
  PLACEHOLDER_THREAD_ID,
  UnreachableCaseError,
} from "./utils/event-accumulator";
export type {
  ThreadState,
  StreamState,
  StreamAction,
  EventAction,
  InitThreadAction,
  SetCurrentThreadAction,
  StartNewThreadAction,
  LoadThreadMessagesAction,
  SetLastCompletedRunIdAction,
  UpdateThreadNameAction,
} from "./utils/event-accumulator";

export {
  executeStreamableToolCall,
  createThrottledStreamableExecutor,
  executeClientTool,
  executeAllPendingTools,
} from "./utils/tool-executor";
export type { PendingToolCall } from "./utils/tool-executor";

export { ToolCallTracker } from "./utils/tool-call-tracker";
export { handleEventStream } from "./utils/stream-handler";
export type { StreamHandlerOptions } from "./utils/stream-handler";
export { findComponentContent } from "./utils/thread-utils";
export { createKeyedThrottle } from "./utils/keyed-throttle";
export type { KeyedThrottle } from "./utils/keyed-throttle";
export { applyJsonPatch } from "./utils/json-patch";
export {
  unstrictifyToolCallParamsFromSchema,
  canBeNull,
} from "./utils/unstrictify";
export {
  toAvailableComponent,
  toAvailableComponents,
  toAvailableTool,
  toAvailableTools,
} from "./utils/registry-conversion";
