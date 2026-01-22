/**
 * Thread Types for v1 API
 *
 * Represents conversation threads and their state.
 *
 * TODO: Once @tambo-ai/typescript-sdk/v1 is released, replace these with
 * imports from the SDK package.
 */

import type { TamboV1Message } from "./message";

/**
 * Run status indicates the current state of the thread
 */
export type RunStatus = "idle" | "waiting" | "streaming" | "complete" | "error";

/**
 * Thread represents a conversation with the AI
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
 */
export interface StreamingState {
  /** Current streaming status */
  status: "idle" | "waiting" | "streaming" | "complete" | "error";

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

/**
 * Thread creation parameters
 */
export interface CreateThreadParams {
  /** Optional project ID */
  projectId?: string;

  /** Optional thread title */
  title?: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Thread list response
 */
export interface ThreadListResponse {
  threads: TamboV1Thread[];
  hasMore: boolean;
  nextCursor?: string;
}
