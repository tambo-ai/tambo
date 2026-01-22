/**
 * V1 API Type Definitions
 *
 * Only exports React SDK-specific types and Tambo custom events.
 * For SDK types (thread responses, content blocks, etc.), import directly from:
 * - @tambo-ai/typescript-sdk/resources/threads/threads
 * - @tambo-ai/typescript-sdk/resources/threads/runs
 * - @tambo-ai/typescript-sdk/resources/threads/messages
 *
 * For AG-UI events, import directly from @ag-ui/core.
 */

// Tambo-specific custom events
export type {
  ComponentStartEvent,
  ComponentPropsDeltaEvent,
  ComponentStateDeltaEvent,
  ComponentEndEvent,
  RunAwaitingInputEvent,
  TamboCustomEvent,
  JsonPatchOperation,
} from "./event";

// React-specific thread state types
export type { TamboV1Thread, RunStatus, StreamingState } from "./thread";

// React-specific message types and convenience unions
export type { TamboV1Message, MessageRole, Content } from "./message";

// React-specific component types
export type {
  AvailableComponent,
  TamboV1Component,
  TamboComponentProps,
} from "./component";

// React-specific tool types
export type {
  Tool,
  ToolFunction,
  TransformToContent,
  TamboV1Tool,
  ToolExecutionResult,
} from "./tool";
