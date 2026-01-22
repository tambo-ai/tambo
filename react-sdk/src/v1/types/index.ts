/**
 * V1 API Type Definitions
 *
 * Exports all TypeScript types for the v1 streaming API.
 * For AG-UI base events, import directly from @ag-ui/core.
 */

// Tambo-specific custom events only
export type {
  ComponentStartEvent,
  ComponentPropsDeltaEvent,
  ComponentStateDeltaEvent,
  ComponentEndEvent,
  RunAwaitingInputEvent,
  TamboCustomEvent,
  JsonPatchOperation,
} from "./event";

// Thread types (from @tambo-ai/typescript-sdk + React extensions)
export type {
  TamboV1Thread,
  RunStatus,
  StreamingState,
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
} from "./thread";

// Message types (from @tambo-ai/typescript-sdk)
export type {
  TamboV1Message,
  MessageRole,
  Content,
  TextContent,
  ToolUseContent,
  ToolResultContent,
  ComponentContent,
  ResourceContent,
  InputMessage,
  MessageListResponse,
  MessageGetResponse,
} from "./message";

// Component types (React-specific)
export type {
  AvailableComponent,
  TamboV1Component,
  TamboComponentProps,
} from "./component";

// Tool types (React-specific)
export type {
  Tool,
  ToolFunction,
  TransformToContent,
  TamboV1Tool,
  ToolExecutionResult,
} from "./tool";
