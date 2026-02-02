import type { Component } from "svelte";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * JSON Schema 7 type definition
 */
export interface JSONSchema7 {
  $id?: string;
  $ref?: string;
  $schema?: string;
  $comment?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  items?: JSONSchema7 | JSONSchema7[];
  additionalItems?: JSONSchema7;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  contains?: JSONSchema7;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | JSONSchema7;
  definitions?: Record<string, JSONSchema7>;
  properties?: Record<string, JSONSchema7>;
  patternProperties?: Record<string, JSONSchema7>;
  dependencies?: Record<string, JSONSchema7 | string[]>;
  propertyNames?: JSONSchema7;
  if?: JSONSchema7;
  then?: JSONSchema7;
  else?: JSONSchema7;
  allOf?: JSONSchema7[];
  anyOf?: JSONSchema7[];
  oneOf?: JSONSchema7[];
  not?: JSONSchema7;
  format?: string;
  title?: string;
  description?: string;
  default?: unknown;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: unknown[];
  contentMediaType?: string;
  contentEncoding?: string;
}

/**
 * Message role types
 */
export type MessageRole = "user" | "assistant" | "system" | "tool";

/**
 * Text content part for messages
 */
export interface TextContentPart {
  type: "text";
  text: string;
}

/**
 * Image content part for messages
 */
export interface ImageContentPart {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

/**
 * Audio content part for messages
 */
export interface AudioContentPart {
  type: "input_audio";
  input_audio: {
    data: string;
    format: "wav" | "mp3";
  };
}

/**
 * Content part union type
 */
export type ContentPart = TextContentPart | ImageContentPart | AudioContentPart;

/**
 * Interactable metadata for components
 */
export interface InteractableMetadata {
  id: string;
  name: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

/**
 * Component information in a message
 */
export interface MessageComponent {
  name?: string;
  props?: Record<string, unknown>;
  statusMessage?: string;
  completionStatusMessage?: string;
  toolCallRequest?: {
    toolName: string;
    parameters?: { parameterName: string; parameterValue: unknown }[];
  };
}

/**
 * Thread message type
 */
export interface TamboThreadMessage {
  id: string;
  threadId?: string;
  role: MessageRole;
  content: string | ContentPart[] | null;
  createdAt?: string;
  reasoning?: string[];
  reasoningDurationMS?: number;
  isCancelled?: boolean;
  error?: string;
  parentMessageId?: string;
  toolCallRequest?: {
    toolName: string;
    parameters?: { parameterName: string; parameterValue: unknown }[];
  };
  component?: MessageComponent;
  componentState?: Record<string, unknown>;
  interactableMetadata?: InteractableMetadata;
}

/**
 * Thread type
 */
export interface TamboThread {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
  contextKey?: string;
  lastCompletedRunId?: string;
  messages: TamboThreadMessage[];
}

/**
 * Schema type that accepts Standard Schema validators or JSON Schema
 */
export type SupportedSchema<Input = unknown, Output = Input> =
  | StandardSchemaV1<Input, Output>
  | JSONSchema7;

/**
 * Tool annotations for MCP compatibility
 */
export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  tamboStreamableHint?: boolean;
}

/**
 * Tambo component registration
 */
export interface TamboComponent<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: Component<Props> | Component<any>;
  propsSchema?: SupportedSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadingComponent?: Component<any>;
  associatedTools?: TamboTool[];
  annotations?: ToolAnnotations;
}

/**
 * Tambo tool registration
 */
export interface TamboTool<Params = unknown, Returns = unknown> {
  name: string;
  description: string;
  title?: string;
  maxCalls?: number;
  annotations?: ToolAnnotations;
  tool: (params: Params) => Returns | Promise<Returns>;
  /** Schema for tool input parameters */
  inputSchema?: SupportedSchema<Params>;
  /** Alias for inputSchema (for convenience) */
  toolSchema?: SupportedSchema<Params>;
  /** Schema for tool output */
  outputSchema?: SupportedSchema<Returns>;
  transformToContent?: (
    result: Returns,
  ) =>
    | TamboAI.Beta.Threads.ChatCompletionContentPart[]
    | Promise<TamboAI.Beta.Threads.ChatCompletionContentPart[]>;
}

/**
 * Generation stage during streaming
 */
export type GenerationStage =
  | "idle"
  | "starting"
  | "thinking"
  | "generating"
  | "tool_calling"
  | "completed"
  | "error";

/**
 * Staged image for upload
 */
export interface StagedImage {
  id: string;
  file: File;
  name: string;
  dataUrl: string;
}

/**
 * Suggestion type
 */
export interface Suggestion {
  id: string;
  title: string;
  detailedSuggestion: string;
  messageId?: string;
}

/**
 * Context helper function type
 */
export type ContextHelperFn = () =>
  | unknown
  | null
  | undefined
  | Promise<unknown | null | undefined>;

/**
 * Context helpers collection
 */
export type ContextHelpers = Record<string, ContextHelperFn>;

/**
 * Additional context for messages
 */
export interface AdditionalContext {
  name: string;
  context: unknown;
}

/**
 * Client configuration options
 */
export interface TamboClientOptions {
  apiKey: string;
  tamboUrl?: string;
  additionalHeaders?: Record<string, string>;
  userToken?: string;
}

/**
 * Provider configuration options
 */
export interface TamboProviderOptions {
  apiKey: string;
  tamboUrl?: string;
  components?: TamboComponent[];
  tools?: TamboTool[];
  streaming?: boolean;
  contextKey?: string;
  autoGenerateThreadName?: boolean;
  autoGenerateNameThreshold?: number;
  contextHelpers?: ContextHelpers;
  userToken?: string;
}

/**
 * Stream status for a component prop
 */
export interface PropStatus {
  key: string;
  isStreaming: boolean;
  isComplete: boolean;
}

/**
 * Overall stream status
 */
export interface StreamStatus {
  isStreaming: boolean;
  isComplete: boolean;
  propStatuses: PropStatus[];
}

/**
 * Interactable component type
 */
export interface TamboInteractableComponent<
  Props = Record<string, unknown>,
  State = Record<string, unknown>,
> {
  id: string;
  name: string;
  props: Props;
  propsSchema?: SupportedSchema;
  state?: State;
  stateSchema?: SupportedSchema;
  isSelected?: boolean;
}

/**
 * MCP server transport types
 */
export type McpTransport = "sse" | "stdio" | "streamable-http";

/**
 * MCP server configuration
 */
export interface McpServerInfo {
  name: string;
  transport: McpTransport;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Component registry type
 */
export type ComponentRegistry = Record<
  string,
  TamboComponent & { props?: JSONSchema7 }
>;

/**
 * Tool registry type
 */
export type TamboToolRegistry = Record<string, TamboTool>;

/**
 * Tool associations by component name
 */
export type TamboToolAssociations = Record<string, string[]>;
