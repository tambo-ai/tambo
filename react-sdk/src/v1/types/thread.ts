/**
 * Thread Types for v1 API
 *
 * Re-exports thread types from `@tambo-ai/typescript-sdk` and defines
 * React-specific extensions for streaming state management.
 */

import type { TamboThreadMessage } from "./message";

// Re-export thread types from TypeScript SDK
export type {
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

/**
 * Run status indicates the current state of the thread's run lifecycle.
 * Matches the API's V1RunStatus — no "complete" or "error" variants.
 * Error information is tracked separately in StreamingState.error.
 */
export type RunStatus = "idle" | "waiting" | "streaming";

/**
 * Thread represents a conversation with the AI
 * Extended from SDK's ThreadRetrieveResponse with additional fields for React state
 */
export interface TamboThread {
  /** Unique thread identifier */
  id: string;

  /** Thread title/name */
  title?: string;

  /** Messages in the thread */
  messages: TamboThreadMessage[];

  /** Current run status */
  status: RunStatus;

  /** Thread metadata */
  metadata?: Record<string, unknown>;

  /** When the thread was created */
  createdAt: string;

  /** When the thread was last updated */
  updatedAt: string;

  /** Whether the last run was cancelled (resets to false when a new run starts) */
  lastRunCancelled: boolean;
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

  /** When reasoning started (for duration calculation) */
  reasoningStartTime?: number;

  /** Error information if status is 'error' */
  error?: {
    message: string;
    code?: string;
  };
}
