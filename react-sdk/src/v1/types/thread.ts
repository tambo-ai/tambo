/**
 * Thread Types for v1 API
 *
 * Re-exports thread types from @tambo-ai/typescript-sdk and defines
 * React-specific extensions for streaming state management.
 */

import type { TamboV1Message } from "./message";

// Re-export thread types from TypeScript SDK
export type {
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

/**
 * Run status indicates the current state of the thread
 */
export type RunStatus = "idle" | "waiting" | "streaming" | "complete" | "error";

/**
 * Thread represents a conversation with the AI
 * Extended from SDK's ThreadRetrieveResponse with additional fields for React state
 */
export interface TamboV1Thread {
  /** Unique thread identifier */
  id: string;

  /** Thread title/name */
  title?: string;

  /** Project ID this thread belongs to */
  projectId: string;

  /** Messages in the thread */
  messages: TamboV1Message[];

  /** Current run status */
  status: RunStatus;

  /** Thread metadata */
  metadata?: Record<string, unknown>;

  /** When the thread was created */
  createdAt: string;

  /** When the thread was last updated */
  updatedAt: string;
}

/**
 * Streaming state tracks the progress of an active run
 * This is React-specific and not part of the SDK
 */
export interface StreamingState {
  /** Current streaming status */
  status: RunStatus;

  /** Active run ID (if streaming) */
  runId?: string;

  /** Active message ID being streamed */
  messageId?: string;

  /** When the current run started */
  startTime?: number;

  /** Error information if status is 'error' */
  error?: {
    message: string;
    code?: string;
  };
}
