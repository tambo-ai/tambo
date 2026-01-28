import type { Component } from "svelte";
import type { z } from "zod";

/**
 * Message role types
 */
export type MessageRole = "user" | "assistant" | "system" | "tool";

/**
 * Content part for messages
 */
export interface TextContentPart {
  type: "text";
  text: string;
}

export interface ImageContentPart {
  type: "image_url";
  image_url: {
    url: string;
  };
}

export type ContentPart = TextContentPart | ImageContentPart;

/**
 * Thread message type
 */
export interface TamboThreadMessage {
  id: string;
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
  component?: {
    toolCallRequest?: {
      toolName: string;
      parameters?: { parameterName: string; parameterValue: unknown }[];
    };
    name?: string;
    props?: Record<string, unknown>;
    statusMessage?: string;
    completionStatusMessage?: string;
  };
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
 * Tambo component registration
 */
export interface TamboComponent {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: Component<any>;
  propsSchema: z.ZodType;
}

/**
 * Tambo tool registration
 */
export interface TamboTool {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: (...args: any[]) => Promise<unknown>;
  toolSchema: z.ZodObject;
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
