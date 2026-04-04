/**
 * TamboStream - Streaming response handler for Tambo AI
 *
 * Provides two consumption modes:
 * 1. AsyncIterable: `for await (const { event, snapshot } of stream) { ... }`
 * 2. Promise: `const thread = await stream.thread`
 *
 * The internal processing loop always runs (fire-and-forget in constructor).
 * The `.thread` promise resolves when the loop completes.
 */

import { EventType, type BaseEvent, type RunErrorEvent } from "@ag-ui/core";
import type TamboAI from "@tambo-ai/typescript-sdk";

import type { TamboThread } from "./types/thread";
import { asTamboCustomEvent, type RunAwaitingInputEvent } from "./types/event";
import type { ToolChoice } from "./types/tool-choice";
import type { InputMessage } from "./types/message";
import type {
  ComponentRegistry,
  TamboToolRegistry,
} from "./model/component-metadata";
import type { StreamAction } from "./utils/event-accumulator";
import { handleEventStream } from "./utils/stream-handler";
import { ToolCallTracker } from "./utils/tool-call-tracker";
import { createThrottledStreamableExecutor } from "./utils/tool-executor";
import {
  createRunStream,
  dispatchUserMessage,
  dispatchToolResults,
  executeToolsAndContinue,
  type CreateRunStreamResult,
} from "./utils/send-message";

/**
 * Event yielded by the TamboStream async iterator.
 */
export interface StreamEvent {
  /** The raw AG-UI event. */
  event: BaseEvent;
  /** A snapshot of the thread state after this event was processed. */
  snapshot: TamboThread;
}

/**
 * Options for creating a TamboStream.
 */
export interface TamboStreamOptions {
  /** The Tambo API client. */
  client: TamboAI;
  /** The message to send. */
  message: InputMessage;
  /** Existing thread ID (undefined = create new). */
  threadId: string | undefined;
  /** User message text for optimistic display. */
  userMessageText?: string;
  /** Registered components. */
  componentList: ComponentRegistry;
  /** Registered tools. */
  toolRegistry: TamboToolRegistry;
  /** User key for auth. */
  userKey: string | undefined;
  /** Previous run ID for continuations. */
  previousRunId: string | undefined;
  /** Additional context merged into message. */
  additionalContext?: Record<string, unknown>;
  /** Tool choice mode. */
  toolChoice?: ToolChoice;
  /** Whether to auto-execute tools. */
  autoExecuteTools: boolean;
  /** Max tool execution rounds. */
  maxSteps: number;
  /** Enable debug logging. */
  debug: boolean;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Dispatch function to update client state. */
  dispatch: (action: StreamAction) => void;
  /** Accessor for current thread state snapshot. */
  getThreadSnapshot: (threadId: string) => TamboThread | undefined;
}

/**
 * Internal event queue for bridging the processing loop and async iterator.
 * Events are pushed by the processing loop and pulled by the iterator.
 */
class EventQueue<T> {
  private queue: T[] = [];
  private waiters: ((value: IteratorResult<T>) => void)[] = [];
  private done = false;
  private error: Error | null = null;

  /**
   * Push an event into the queue.
   * @param value - The event to push.
   */
  push(value: T): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  /**
   * Close the queue normally.
   */
  close(): void {
    this.done = true;
    for (const waiter of this.waiters) {
      waiter({ value: undefined as unknown as T, done: true });
    }
    this.waiters = [];
  }

  /**
   * Close the queue with an error.
   * @param err - The error to propagate to waiting consumers.
   */
  closeWithError(err: Error): void {
    this.error = err;
    this.done = true;
    // Reject all waiters... but async iterator protocol uses throw, not reject.
    // We'll store the error and throw it on next pull.
    for (const waiter of this.waiters) {
      waiter({ value: undefined as unknown as T, done: true });
    }
    this.waiters = [];
  }

  /**
   * Pull the next event from the queue.
   * @returns An iterator result with the next event or done signal.
   */
  async pull(): Promise<IteratorResult<T>> {
    if (this.error) {
      const err = this.error;
      this.error = null;
      throw err;
    }
    const item = this.queue.shift();
    if (item !== undefined) {
      return { value: item, done: false };
    }
    if (this.done) {
      return { value: undefined as unknown as T, done: true };
    }
    return await new Promise<IteratorResult<T>>((resolve) => {
      this.waiters.push(resolve);
    });
  }
}

/**
 * TamboStream handles streaming AI responses with tool execution.
 *
 * Supports two consumption modes:
 * - Async iteration: `for await (const { event, snapshot } of stream) { ... }`
 * - Promise-based: `const thread = await stream.thread`
 *
 * The processing loop runs automatically. The async iterator can only be
 * iterated once (like ReadableStream).
 */
export class TamboStream implements AsyncIterable<StreamEvent> {
  /** Promise that resolves to the final thread state when the stream completes. */
  readonly thread: Promise<TamboThread>;

  private eventQueue = new EventQueue<StreamEvent>();
  private resolveThread!: (thread: TamboThread) => void;
  private rejectThread!: (error: Error) => void;
  private streamError: Error | null = null;
  private abortController: AbortController;
  private consumed = false;

  /**
   * Create a new TamboStream.
   * @param options - Configuration for the stream.
   */
  constructor(private readonly options: TamboStreamOptions) {
    this.abortController = new AbortController();

    // Wire external signal to our internal abort controller
    if (options.signal) {
      if (options.signal.aborted) {
        this.abortController.abort(options.signal.reason);
      } else {
        options.signal.addEventListener("abort", () => {
          this.abortController.abort(options.signal?.reason);
        });
      }
    }

    this.thread = new Promise<TamboThread>((resolve, reject) => {
      this.resolveThread = resolve;
      this.rejectThread = reject;
    });

    // Fire-and-forget the processing loop
    void this.processLoop().catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      this.streamError = error;
      this.rejectThread(error);
      this.eventQueue.closeWithError(error);
    });
  }

  /**
   * Abort the stream. The `.thread` promise rejects with an AbortError.
   * The async iterator ends cleanly.
   */
  abort(): void {
    this.abortController.abort(new Error("Stream aborted"));
  }

  /**
   * Returns an async iterator over stream events.
   * Can only be iterated once.
   * @returns An async iterator yielding StreamEvent pairs.
   */
  [Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
    if (this.consumed) {
      throw new Error("TamboStream can only be iterated once");
    }
    this.consumed = true;

    return {
      next: async () => await this.eventQueue.pull(),
      return: async () => {
        this.eventQueue.close();
        return { value: undefined as unknown as StreamEvent, done: true };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  /**
   * Main processing loop. Runs automatically in the constructor.
   * Handles event streaming, tool execution, and stream stitching.
   */
  private async processLoop(): Promise<void> {
    const {
      client,
      message,
      threadId: initialThreadId,
      userMessageText,
      componentList,
      toolRegistry,
      userKey,
      previousRunId,
      additionalContext,
      toolChoice,
      autoExecuteTools,
      maxSteps,
      debug,
      dispatch,
      getThreadSnapshot,
    } = this.options;

    // Generate user message ID if we have user text
    const userMessageId = userMessageText
      ? `user_msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      : undefined;

    // Dispatch user message immediately for optimistic display on existing threads
    if (initialThreadId && userMessageText && userMessageId) {
      dispatchUserMessage(
        dispatch,
        initialThreadId,
        userMessageId,
        userMessageText,
      );
    }

    // Create the initial run stream
    const { stream: initialStream, initialThreadId: streamThreadId } =
      await createRunStream({
        client,
        threadId: initialThreadId,
        message,
        componentList,
        toolRegistry,
        userKey,
        previousRunId,
        additionalContext,
        toolChoice,
      });

    const toolTracker = new ToolCallTracker(toolRegistry);
    const throttledStreamable = createThrottledStreamableExecutor(
      toolTracker,
      toolRegistry,
    );

    let actualThreadId = streamThreadId;
    let runId: string | undefined;
    let currentStream: CreateRunStreamResult["stream"] = initialStream;
    let stepCount = 0;

    try {
      while (true) {
        // Check abort before processing each stream segment
        if (this.abortController.signal.aborted) {
          this.handleAbort(actualThreadId, dispatch);
          return;
        }

        let pendingAwaitingInput: RunAwaitingInputEvent | undefined;

        for await (const event of handleEventStream(currentStream, { debug })) {
          // Check abort on each event
          if (this.abortController.signal.aborted) {
            this.handleAbort(actualThreadId, dispatch);
            return;
          }

          // Extract threadId and runId from RUN_STARTED
          if (event.type === EventType.RUN_STARTED) {
            runId = event.runId;
            actualThreadId ??= event.threadId;

            // For new threads: dispatch user message now that we have the real ID
            if (!initialThreadId && userMessageText && userMessageId) {
              dispatchUserMessage(
                dispatch,
                actualThreadId,
                userMessageId,
                userMessageText,
              );
            }
          } else if (!actualThreadId) {
            throw new Error(
              `Expected first event to be RUN_STARTED with threadId, got: ${event.type}`,
            );
          }

          toolTracker.handleEvent(event);

          // Parse partial JSON for TOOL_CALL_ARGS
          const parsedToolArgs =
            event.type === EventType.TOOL_CALL_ARGS
              ? toolTracker.parsePartialArgs(event.toolCallId)
              : undefined;

          dispatch({
            type: "EVENT",
            event,
            threadId: actualThreadId,
            parsedToolArgs,
            toolSchemas: toolTracker.toolSchemas,
          });

          // Schedule debounced streamable tool execution
          if (parsedToolArgs && event.type === EventType.TOOL_CALL_ARGS) {
            throttledStreamable.schedule(event.toolCallId, parsedToolArgs);
          }

          // Emit event to async iterator
          const snapshot = getThreadSnapshot(actualThreadId);
          if (snapshot) {
            this.eventQueue.push({ event, snapshot });
          }

          // Handle awaiting_input for tool execution
          if (event.type === EventType.CUSTOM) {
            const customEvent = asTamboCustomEvent(event);
            if (customEvent?.name === "tambo.run.awaiting_input") {
              pendingAwaitingInput = customEvent;
              break;
            }
          }
        }

        throttledStreamable.flush();

        // Stream finished without awaiting_input - we're done
        if (!pendingAwaitingInput) {
          break;
        }

        // Don't execute tools if auto-execute is off
        if (!autoExecuteTools) {
          break;
        }

        // Check step limit
        stepCount++;
        if (stepCount >= maxSteps) {
          console.warn(
            `[TamboStream] maxSteps (${maxSteps}) reached. Stream resolving with pending tool calls.`,
          );
          break;
        }

        // Execute tools and get continuation stream
        if (!runId || !actualThreadId) {
          throw new Error(
            "Cannot continue run after awaiting_input: missing runId or threadId",
          );
        }

        const { stream: continuationStream, toolResults } =
          await executeToolsAndContinue({
            event: pendingAwaitingInput,
            toolTracker,
            toolRegistry,
            componentList,
            client,
            threadId: actualThreadId,
            runId,
            userKey,
            additionalContext,
            toolChoice,
          });

        dispatchToolResults(dispatch, actualThreadId, toolResults);
        currentStream = continuationStream;
      }

      // Stream completed successfully
      const finalSnapshot = actualThreadId
        ? getThreadSnapshot(actualThreadId)
        : undefined;

      if (finalSnapshot) {
        this.resolveThread(finalSnapshot);
      } else {
        this.rejectThread(
          new Error("Stream completed but no thread state found"),
        );
      }
      this.eventQueue.close();
    } catch (error) {
      // Dispatch synthetic RUN_ERROR to clean up thread state
      if (actualThreadId) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown streaming error";
        const errorEvent = {
          type: EventType.RUN_ERROR,
          message: errorMessage,
          category: "server_error",
          isRetryable: true,
        } as RunErrorEvent;
        dispatch({
          type: "EVENT",
          event: errorEvent,
          threadId: actualThreadId,
        });
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.streamError = err;
      this.rejectThread(err);
      this.eventQueue.closeWithError(err);
    }
  }

  /**
   * Handle abort by transitioning thread to idle and rejecting the thread promise.
   * @param threadId - The thread to clean up.
   * @param dispatch - The dispatch function for state updates.
   */
  private handleAbort(
    threadId: string | undefined,
    dispatch: (action: StreamAction) => void,
  ): void {
    if (threadId) {
      const errorEvent: RunErrorEvent = {
        type: EventType.RUN_ERROR,
        message: "Stream aborted",
      };
      dispatch({
        type: "EVENT",
        event: errorEvent,
        threadId,
      });
    }

    const abortError = new Error("Stream aborted");
    abortError.name = "AbortError";
    this.streamError = abortError;
    this.rejectThread(abortError);
    this.eventQueue.close(); // Iterator ends cleanly on abort
  }
}
