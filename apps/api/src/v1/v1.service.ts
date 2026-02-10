import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

/**
 * Interval in milliseconds for checking run cancellation status during streaming.
 * Set to 500ms as a balance between responsiveness and database load.
 */
const CANCEL_CHECK_INTERVAL_MS = 500;
import * as Sentry from "@sentry/nestjs";
import {
  EventType,
  type BaseEvent,
  type RunStartedEvent,
  type RunFinishedEvent,
  type RunErrorEvent,
} from "@ag-ui/core";
import {
  AsyncQueue,
  GenerationStage,
  V1RunStatus,
  type UnsavedThreadToolMessage,
} from "@tambo-ai-cloud/core";
import { sanitizeEvent } from "@tambo-ai-cloud/backend";
import type { HydraDatabase, HydraDb } from "@tambo-ai-cloud/db";
import {
  dbMessageToThreadMessage,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { and, eq, sql } from "drizzle-orm";
import type { Response } from "express";
import {
  applyPatch,
  type Operation,
  validate as validateJsonPatch,
} from "fast-json-patch";
import { createProblemDetail, V1ErrorCodes } from "./v1.errors";
import {
  UpdateComponentStateDto,
  UpdateComponentStateResponseDto,
} from "./dto/component-state.dto";
import { V1CreateRunDto } from "./dto/run.dto";
import {
  convertV1ComponentsToInternal,
  convertV1ToolChoiceToInternal,
  convertV1ToolsToInternal,
} from "./v1-tool-conversions";
import {
  createAwaitingInputEvent,
  ClientToolCallTracker,
} from "./v1-client-tools";
import {
  convertToolResultsToMessages,
  dedupeToolResults,
  extractToolResults,
  validateToolResults,
} from "./v1-tool-results";
import type { StreamQueueItem } from "../threads/dto/stream-queue-item";
import { ThreadsService } from "../threads/threads.service";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import {
  V1GetMessageResponseDto,
  V1ListMessagesQueryDto,
  V1ListMessagesResponseDto,
} from "./dto/message.dto";
import {
  V1CreateThreadDto,
  V1CreateThreadResponseDto,
  V1GetThreadResponseDto,
  V1ListThreadsQueryDto,
  V1ListThreadsResponseDto,
  V1UpdateThreadDto,
  V1UpdateThreadResponseDto,
} from "./dto/thread.dto";
import {
  threadToDto,
  messageToDto,
  isHiddenUiToolResponse,
  ContentConversionOptions,
  convertV1InputMessageToInternal,
  convertV1InitialMessageToMessageRequest,
} from "./v1-conversions";
import { encodeV1CompoundCursor, parseV1CompoundCursor } from "./v1-pagination";
import {
  V1GenerateSuggestionsDto,
  V1GenerateSuggestionsResponseDto,
  V1ListSuggestionsQueryDto,
  V1ListSuggestionsResponseDto,
  V1SuggestionDto,
} from "./dto/suggestion.dto";

/**
 * Result type for startRun - either success with runId or failure with HttpException
 */
export type StartRunResult =
  | { success: true; runId: string; threadId: string }
  | { success: false; error: HttpException };

@Injectable()
export class V1Service {
  private readonly logger = new Logger(V1Service.name);

  /**
   * Options passed to content conversion functions.
   * Logs warnings for unknown content types.
   */
  private readonly contentConversionOptions: ContentConversionOptions = {
    onUnknownContentType: ({ type }) => {
      this.logger.warn(
        `Unknown content part type "${type}" encountered. ` +
          `This content will be skipped in the V1 API response.`,
      );
    },
    onInvalidContentPart: ({ type, reason }) => {
      this.logger.warn(
        `Invalid content part type "${type}" (${reason}). This content will be skipped.`,
      );
    },
  };

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly threadsService: ThreadsService,
  ) {}

  private parseLimit(raw: number | undefined, fallback: number): number {
    const value = raw ?? fallback;
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new BadRequestException("Invalid limit");
    }
    return Math.min(Math.max(1, value), 100);
  }

  /**
   * List threads for a project with cursor-based pagination.
   */
  async listThreads(
    projectId: string,
    contextKey: string,
    query: V1ListThreadsQueryDto,
  ): Promise<V1ListThreadsResponseDto> {
    const effectiveLimit = this.parseLimit(query.limit, 20);

    const cursor = query.cursor
      ? parseV1CompoundCursor(query.cursor)
      : undefined;

    const threads = await operations.listThreadsPaginated(
      this.db,
      projectId,
      contextKey,
      {
        cursor,
        limit: effectiveLimit + 1, // Fetch one extra to determine hasMore
      },
    );

    const hasMore = threads.length > effectiveLimit;
    const resultThreads = hasMore ? threads.slice(0, effectiveLimit) : threads;

    return {
      threads: resultThreads.map((t) => threadToDto(t)),
      nextCursor: hasMore
        ? encodeV1CompoundCursor({
            createdAt: resultThreads[resultThreads.length - 1].createdAt,
            id: resultThreads[resultThreads.length - 1].id,
          })
        : undefined,
      hasMore,
    };
  }

  /**
   * Get a thread by ID with all messages.
   */
  async getThread(
    threadId: string,
    projectId: string,
    contextKey: string,
  ): Promise<V1GetThreadResponseDto> {
    const thread = await operations.getThreadForProjectId(
      this.db,
      threadId,
      projectId,
      contextKey,
      true, // includeSystem
    );

    if (!thread) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    // Filter out hidden UI tool response messages
    const visibleMessages = thread.messages.filter(
      (m) => !isHiddenUiToolResponse(m),
    );

    return {
      ...threadToDto(thread),
      messages: visibleMessages.map((m) =>
        messageToDto(m, this.contentConversionOptions),
      ),
    };
  }

  /**
   * Create a new thread, optionally seeded with initial messages.
   *
   * Routes through ThreadsService.createThread so that system prompt injection,
   * validation, and customInstructions logic apply automatically.
   */
  async createThread(
    projectId: string,
    contextKey: string,
    dto: V1CreateThreadDto,
  ): Promise<V1CreateThreadResponseDto> {
    const initialMessages = dto.initialMessages?.map(
      convertV1InitialMessageToMessageRequest,
    );

    const thread = await this.threadsService.createThread(
      { projectId, metadata: dto.metadata },
      contextKey,
      initialMessages,
    );

    return {
      id: thread.id,
      name: thread.name ?? undefined,
      userKey: contextKey,
      runStatus: V1RunStatus.IDLE,
      metadata: thread.metadata ?? undefined,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }

  /**
   * Update thread metadata such as name.
   */
  async updateThread(
    threadId: string,
    projectId: string,
    contextKey: string,
    dto: V1UpdateThreadDto,
  ): Promise<V1UpdateThreadResponseDto> {
    // Verify thread exists and belongs to project
    const existing = await operations.getThreadForProjectId(
      this.db,
      threadId,
      projectId,
      contextKey,
      false, // includeSystem
    );
    if (!existing) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    const updated = await operations.updateThread(this.db, threadId, {
      name: dto.name,
      metadata: dto.metadata,
    });

    return threadToDto(updated);
  }

  /**
   * Delete a thread and all its messages.
   */
  async deleteThread(threadId: string): Promise<void> {
    const deleted = await operations.deleteThread(this.db, threadId);
    if (!deleted) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }
  }

  /**
   * List messages in a thread with cursor-based pagination.
   *
   * Filters out hidden UI tool response messages (show_component_* tool results)
   * which are internal implementation details.
   *
   * To handle pagination correctly with filtered messages, we fetch more messages
   * than requested (2x limit) to ensure we have enough visible messages after
   * filtering. This prevents incorrect hasMore values when hidden messages fall
   * on page boundaries.
   */
  async listMessages(
    threadId: string,
    query: V1ListMessagesQueryDto,
  ): Promise<V1ListMessagesResponseDto> {
    const effectiveLimit = this.parseLimit(query.limit, 50);
    const order = query.order ?? "asc";

    if (order !== "asc" && order !== "desc") {
      throw new BadRequestException(`Invalid order: ${order}`);
    }

    const cursor = query.cursor
      ? parseV1CompoundCursor(query.cursor)
      : undefined;

    // Fetch more messages than needed to account for hidden messages that will
    // be filtered out. We fetch 2x the limit (plus 1 for hasMore detection) to
    // ensure we have enough visible messages after filtering.
    const fetchLimit = Math.min((effectiveLimit + 1) * 2, 200);
    const messages = await operations.listMessagesPaginated(this.db, threadId, {
      cursor,
      limit: fetchLimit,
      order,
    });

    // Filter out hidden UI tool response messages
    const visibleMessages = messages.filter((m) => !isHiddenUiToolResponse(m));

    // Determine hasMore based on whether we have more visible messages than requested
    const hasMore = visibleMessages.length > effectiveLimit;
    const resultMessages = hasMore
      ? visibleMessages.slice(0, effectiveLimit)
      : visibleMessages;

    return {
      messages: resultMessages.map((m) =>
        messageToDto(m, this.contentConversionOptions),
      ),
      nextCursor:
        hasMore && resultMessages.length > 0
          ? encodeV1CompoundCursor({
              createdAt: resultMessages[resultMessages.length - 1].createdAt,
              id: resultMessages[resultMessages.length - 1].id,
            })
          : undefined,
      hasMore,
    };
  }

  /**
   * Get a single message by ID.
   *
   * Returns 404 for hidden UI tool response messages (show_component_* tool results)
   * as they are internal implementation details.
   */
  async getMessage(
    threadId: string,
    messageId: string,
  ): Promise<V1GetMessageResponseDto> {
    const message = await operations.getMessageByIdInThread(
      this.db,
      threadId,
      messageId,
    );

    if (!message) {
      throw new NotFoundException(
        `Message ${messageId} not found in thread ${threadId}`,
      );
    }

    // Treat hidden UI tool responses as not found
    if (isHiddenUiToolResponse(message)) {
      throw new NotFoundException(
        `Message ${messageId} not found in thread ${threadId}`,
      );
    }

    return messageToDto(message, this.contentConversionOptions);
  }

  // ==========================================
  // Run operations
  // ==========================================

  /**
   * Start a run on an existing thread with atomic concurrency control.
   *
   * This method:
   * 1. Validates previousRunId if thread has existing messages
   * 2. Atomically sets runStatus from IDLE to WAITING (prevents concurrent runs)
   * 3. Creates a run record in the runs table
   *
   * @returns Success with runId or failure with HttpException
   */
  async startRun(
    threadId: string,
    dto: V1CreateRunDto,
  ): Promise<StartRunResult> {
    const { thread, hasMessages } = await operations.getThreadForRunStart(
      this.db,
      threadId,
    );

    if (!thread) {
      return {
        success: false,
        error: new HttpException(
          createProblemDetail(
            V1ErrorCodes.THREAD_NOT_FOUND,
            `Thread ${threadId} not found`,
          ),
          HttpStatus.NOT_FOUND,
        ),
      };
    }

    if (hasMessages && !dto.previousRunId && thread.lastCompletedRunId) {
      return {
        success: false,
        error: new HttpException(
          createProblemDetail(
            V1ErrorCodes.INVALID_PREVIOUS_RUN,
            "previousRunId is required when continuing a thread with existing messages",
          ),
          HttpStatus.BAD_REQUEST,
        ),
      };
    }

    // Validate previousRunId matches lastCompletedRunId
    if (dto.previousRunId && thread.lastCompletedRunId !== dto.previousRunId) {
      return {
        success: false,
        error: new HttpException(
          createProblemDetail(
            V1ErrorCodes.INVALID_PREVIOUS_RUN,
            `previousRunId ${dto.previousRunId} does not match last completed run ${thread.lastCompletedRunId ?? "(none)"}`,
          ),
          HttpStatus.BAD_REQUEST,
        ),
      };
    }

    const toolResultMessages: UnsavedThreadToolMessage[] = [];
    const toolResults = extractToolResults(dto.message);
    const { toolResults: dedupedToolResults, duplicateToolCallIds } =
      dedupeToolResults(toolResults);
    const pendingToolCallIds = thread.pendingToolCallIds ?? [];
    const validation = validateToolResults(
      dedupedToolResults,
      pendingToolCallIds,
    );

    if (!validation.valid) {
      return {
        success: false,
        error: new HttpException(
          createProblemDetail(
            V1ErrorCodes.INVALID_TOOL_RESULT,
            validation.error.message,
            {
              code: validation.error.code,
              missingToolCallIds: validation.error.missingToolCallIds,
              extraToolCallIds: validation.error.extraToolCallIds,
            },
          ),
          HttpStatus.BAD_REQUEST,
        ),
      };
    }

    if (duplicateToolCallIds.length > 0) {
      this.logger.warn(
        `Dropping duplicate tool results for tool calls: ${duplicateToolCallIds.join(", ")}`,
      );
    }

    // Convert validated tool results to internal messages
    if (dedupedToolResults.length > 0) {
      toolResultMessages.push(
        ...convertToolResultsToMessages(dedupedToolResults),
      );
    }

    // Capture expected pending tool call IDs from the thread snapshot we read before
    // acquiring the run lock. This snapshot is the only concurrency key used for
    // tool result application.
    // Any change between this snapshot and the clear is
    // treated as a concurrency conflict that requires client retry.
    // Note: pendingToolCallIds should only be modified by the V1 run / tool-result flow.
    const snapshotPendingToolCallIds = thread.pendingToolCallIds ?? null;

    let runId: string | null;
    try {
      runId = await this.db.transaction(async (tx) => {
        const didAcquireLock = await operations.acquireRunLock(tx, threadId);
        if (!didAcquireLock) {
          return null;
        }

        // Save tool result messages to the thread (before creating the run)
        for (const toolMessage of toolResultMessages) {
          await operations.addMessage(tx, threadId, toolMessage);
        }

        // Clear pendingToolCallIds since we've processed the tool results
        if (toolResultMessages.length > 0) {
          await operations.clearPendingToolCalls(
            tx,
            threadId,
            snapshotPendingToolCallIds,
          );
        }

        const run = await operations.createRun(tx, {
          threadId,
          previousRunId: dto.previousRunId,
          model: dto.model,
          requestParams: {
            maxTokens: dto.maxTokens,
            temperature: dto.temperature,
            toolChoice: dto.toolChoice,
          },
          metadata: dto.runMetadata,
        });

        await operations.setCurrentRunId(tx, threadId, run.id);

        return run.id;
      });
    } catch (error) {
      if (error instanceof operations.PendingToolCallStateMismatchError) {
        const mismatchContext = "v1.apply_tool_results";
        const snapshotPendingToolCallIdsCount =
          snapshotPendingToolCallIds?.length ?? 0;

        // Keep warning logs low-cardinality and avoid emitting tool-call IDs.
        this.logger.warn(
          `Thread ${threadId} pending tool call state mismatch ` +
            `(previousRunId=${dto.previousRunId ?? null}) ` +
            `mismatchContext=${mismatchContext} ` +
            `snapshotPendingToolCallIdsCount=${snapshotPendingToolCallIdsCount}`,
        );
        return {
          success: false,
          error: new HttpException(
            createProblemDetail(
              V1ErrorCodes.CONCURRENT_RUN,
              "Thread pending tool call state changed; please retry",
              { threadId },
            ),
            HttpStatus.CONFLICT,
          ),
        };
      }
      throw error;
    }

    if (runId === null) {
      const { thread: latestThread } = await operations.getThreadForRunStart(
        this.db,
        threadId,
      );

      return {
        success: false,
        error: new HttpException(
          createProblemDetail(
            V1ErrorCodes.CONCURRENT_RUN,
            `A run is already active on thread ${threadId}`,
            { threadId, currentRunId: latestThread?.currentRunId },
          ),
          HttpStatus.CONFLICT,
        ),
      };
    }

    this.logger.log(`Started run ${runId} on thread ${threadId}`);

    return { success: true, runId, threadId };
  }

  /**
   * Cancel an active run.
   *
   * Sets the thread status back to IDLE, marks the run as cancelled,
   * and marks the latest assistant message as cancelled (if any).
   *
   * @returns The cancelled run info
   */
  async cancelRun(
    threadId: string,
    runId: string,
    reason: "user_cancelled" | "connection_closed",
  ): Promise<{ runId: string; status: "cancelled" }> {
    const run = await operations.getRun(this.db, threadId, runId);
    if (!run) {
      throw new NotFoundException(
        `Run ${runId} not found on thread ${threadId}`,
      );
    }

    const didCancel = await this.db.transaction(async (tx) => {
      const didReleaseLock = await operations.releaseRunLockIfCurrent(
        tx,
        threadId,
        runId,
        { wasCancelled: true },
      );
      if (!didReleaseLock) {
        return false;
      }

      await operations.markRunCancelled(tx, runId);

      // Reset generationStage so the thread isn't stuck in a processing state.
      // The V1 runStatus lock is released above, but the legacy generationStage
      // (checked by addMessageToThreadAndStream) must also be cleared.
      await operations.updateThreadGenerationStatus(
        tx,
        threadId,
        GenerationStage.CANCELLED,
      );

      // Use the "latest message" fallback here since we don't have access to the
      // streaming context's message ID. This is called from connection close handlers
      // and the DELETE endpoint. The streaming loop uses markMessageCancelled()
      // directly when it detects cancellation since it knows the exact message ID.
      const cancelledMessageId =
        await operations.markLatestAssistantMessageCancelled(tx, threadId);
      if (cancelledMessageId) {
        this.logger.log(
          `Marked message ${cancelledMessageId} as cancelled for run ${runId}`,
        );
      }

      return true;
    });

    if (!didCancel) {
      throw new NotFoundException(
        `Run ${runId} not found on thread ${threadId}`,
      );
    }

    this.logger.log(
      `Cancelled run ${runId} on thread ${threadId} (reason: ${reason})`,
    );

    return { runId, status: "cancelled" };
  }

  /**
   * Execute a run - generates content and streams AG-UI events.
   *
   * This method:
   * 1. Adds the user message to the thread
   * 2. Calls the LLM to generate a response
   * 3. Streams AG-UI events as content is generated
   * 4. Handles tool calls (server-side MCP inline, client-side awaits input)
   * 5. Updates thread/run state on completion or error
   *
   * @param response - Express Response object for SSE streaming
   * @param threadId - Thread to execute the run on
   * @param runId - The run ID (already created by startRun)
   * @param dto - Run configuration including message, tools, etc.
   * @param projectId - The project ID for the thread
   * @param contextKey - Context key for thread scoping
   */
  async executeRun(
    response: Response,
    threadId: string,
    runId: string,
    dto: V1CreateRunDto,
    projectId: string,
    contextKey: string,
    sdkVersion?: string,
  ): Promise<void> {
    return await Sentry.startSpan(
      {
        op: "v1.executeRun",
        name: `V1 Run ${runId}`,
        attributes: { threadId, runId, projectId },
      },
      async () => {
        // Set Sentry context for this run
        Sentry.setContext("v1Run", {
          threadId,
          runId,
          projectId,
          contextKey,
          model: dto.model,
        });

        this.logger.log(`Executing run ${runId} on thread ${threadId}`);

        // 1. Emit RUN_STARTED event
        const runStartedEvent: RunStartedEvent = {
          type: EventType.RUN_STARTED,
          threadId,
          runId,
          timestamp: Date.now(),
        };
        this.emitEvent(response, runStartedEvent);

        // Update run and thread status to STREAMING
        await operations.updateRunStatus(this.db, runId, V1RunStatus.STREAMING);
        await operations.updateThreadRunStatus(
          this.db,
          threadId,
          V1RunStatus.STREAMING,
        );

        try {
          // 2. Convert V1 message to internal format
          const messageToAppend = convertV1InputMessageToInternal(dto.message);

          // 3. Create streaming infrastructure
          const queue = new AsyncQueue<StreamQueueItem>();

          // 4. Start streaming via shared logic with advanceThread
          // advanceThread is fire-and-forget style - it resolves when streaming completes
          // but pushes to queue while running
          //
          // Convert V1 tools/components to internal format
          // V1 uses JSON Schemas (inputSchema, propsSchema) while internal uses
          // parsed metadata (ToolParameters[], contextTools).
          const availableComponents = convertV1ComponentsToInternal(
            dto.availableComponents,
          );
          const clientTools = convertV1ToolsToInternal(dto.tools);

          // Create abort controller to stop LLM stream on cancellation
          const abortController = new AbortController();

          const forceToolChoice = convertV1ToolChoiceToInternal(dto.toolChoice);

          const streamingPromise = this.threadsService.advanceThread(
            { projectId, contextKey, sdkVersion },
            {
              messageToAppend,
              availableComponents,
              clientTools,
              forceToolChoice,
            },
            threadId,
            {}, // toolCallCounts - start fresh for V1 API
            undefined, // cachedSystemTools
            queue,
            abortController.signal,
          );

          // Handle expected abort rejection when we cancel the stream
          void streamingPromise.catch((error: unknown) => {
            if (abortController.signal.aborted) {
              this.logger.log(`LLM stream aborted for cancelled run ${runId}`);
              return;
            }
            this.logger.error(`Streaming error for run ${runId}: ${error}`);
          });

          // 5. Consume queue and emit AG-UI events, tracking tool calls
          const clientToolNames = new Set(dto.tools?.map((t) => t.name) ?? []);
          const toolCallTracker = new ClientToolCallTracker(clientToolNames);

          // Track temp→real message ID mapping. The LLM client generates temporary
          // IDs (e.g., "message-xyz") because it doesn't have DB access. advanceThread
          // creates the real message in DB with IDs like "msg_abc123". We map temp IDs
          // to real IDs so the client SDK can reference messages correctly.
          const messageIdMapping = new Map<string, string>();

          // Throttled cancellation check - poll database for run cancellation status
          // at most once per CANCEL_CHECK_INTERVAL_MS to balance responsiveness vs DB load
          let lastCancelCheckTime = Date.now();

          // Track current message ID for precise cancellation marking
          let currentMessageId: string | undefined;

          for await (const item of queue) {
            // Check for cancellation periodically (throttled to avoid excessive DB queries)
            const now = Date.now();
            if (now - lastCancelCheckTime >= CANCEL_CHECK_INTERVAL_MS) {
              lastCancelCheckTime = now;
              const run = await operations.getRun(this.db, threadId, runId);
              if (run?.isCancelled) {
                abortController.abort();
                // Mark the specific message we know is being streamed
                if (currentMessageId) {
                  await operations.markMessageCancelled(
                    this.db,
                    currentMessageId,
                  );
                  this.logger.log(
                    `Marked message ${currentMessageId} as cancelled for run ${runId}`,
                  );
                }
                const cancelErrorEvent: RunErrorEvent = {
                  type: EventType.RUN_ERROR,
                  message: "Run cancelled",
                  code: "CANCELLED",
                  timestamp: Date.now(),
                };
                this.emitEvent(response, cancelErrorEvent);
                this.logger.log(
                  `Run ${runId} cancelled during streaming on thread ${threadId}`,
                );
                return;
              }
            }
            // Extract real message ID from the response (persisted by advanceThread)
            const realMessageId = item.response?.responseMessageDto?.id;
            if (realMessageId) {
              currentMessageId = realMessageId;
            }

            if (item.aguiEvents) {
              for (const event of item.aguiEvents) {
                // Transform temp IDs to real DB IDs
                const transformedEvent = transformEventMessageIds(
                  event,
                  realMessageId,
                  messageIdMapping,
                );

                // Track tool calls to detect pending client-side tools
                toolCallTracker.processEvent(transformedEvent);
                this.emitEvent(response, transformedEvent);
              }
            }
          }

          // Wait for streaming to complete (should already be done since queue finished)
          await streamingPromise;

          // 6. Check for pending client-side tool calls
          const pendingToolCalls = toolCallTracker.getPendingToolCalls();
          const hasPendingTools = pendingToolCalls.length > 0;

          if (hasPendingTools) {
            // Emit awaiting_input event before RUN_FINISHED
            this.logger.log(
              `Run ${runId} has ${pendingToolCalls.length} pending client tool calls`,
            );
            const awaitingEvent = createAwaitingInputEvent(pendingToolCalls);
            this.emitEvent(response, awaitingEvent);
          }

          // 7. Mark run as completed (with pending tool call info if applicable)
          const pendingToolCallIds = hasPendingTools
            ? toolCallTracker.getPendingToolCallIds()
            : undefined;

          const didReleaseLock = await this.db.transaction(async (tx) => {
            await operations.completeRun(tx, runId);
            return await operations.releaseRunLockIfCurrent(
              tx,
              threadId,
              runId,
              { pendingToolCallIds },
            );
          });

          if (!didReleaseLock) {
            this.logger.warn(
              `Skipped releasing run lock for run ${runId} on thread ${threadId} (no longer current run)`,
            );
          }

          // 8. Emit RUN_FINISHED
          const runFinishedEvent: RunFinishedEvent = {
            type: EventType.RUN_FINISHED,
            threadId,
            runId,
            timestamp: Date.now(),
          };
          this.emitEvent(response, runFinishedEvent);
        } catch (error) {
          // 8. Handle error - emit RUN_ERROR and update state
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          this.logger.error(`Run ${runId} failed: ${errorMessage}`);

          // Capture exception with Sentry context
          Sentry.captureException(error, {
            tags: { threadId, runId, projectId },
            extra: { model: dto.model, contextKey },
          });

          // Use generic message for client to avoid exposing internal details
          const runErrorEvent: RunErrorEvent = {
            type: EventType.RUN_ERROR,
            message: "An internal error occurred",
            code: "INTERNAL_ERROR",
            timestamp: Date.now(),
          };
          this.emitEvent(response, runErrorEvent);

          // Store full error details in database for debugging
          const errorInfo = {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          };

          // Update run and thread with error
          const didReleaseLock = await this.db.transaction(async (tx) => {
            await operations.completeRun(tx, runId, { error: errorInfo });
            // Reset generationStage so the thread isn't stuck in a processing state
            await operations.updateThreadGenerationStatus(
              tx,
              threadId,
              GenerationStage.ERROR,
            );
            return await operations.releaseRunLockIfCurrent(
              tx,
              threadId,
              runId,
              {
                error: errorInfo,
              },
            );
          });

          if (!didReleaseLock) {
            this.logger.warn(
              `Skipped releasing run lock for run ${runId} on thread ${threadId} after error (no longer current run)`,
            );
          }

          throw error;
        }
      },
    );
  }

  /**
   * Emit an AG-UI event to the SSE response.
   * Events are sanitized before emission to prevent exposure of sensitive data.
   */
  private emitEvent(response: Response, event: BaseEvent): void {
    const sanitized = sanitizeEvent(event);
    response.write(`data: ${JSON.stringify(sanitized)}\n\n`);
  }

  // ==========================================
  // Component state operations
  // ==========================================

  /**
   * Update component state in a thread.
   * Supports both full replacement and JSON Patch operations.
   *
   * Constraints:
   * - Thread must be idle (no active run)
   * - Component must exist in the thread
   * - Either state (full replacement) or patch (JSON Patch) must be provided
   *
   * @param threadId - Thread containing the component
   * @param componentId - Component ID to update
   * @param dto - Update request (state or patch)
   * @returns Updated component state
   */
  async updateComponentState(
    threadId: string,
    componentId: string,
    dto: UpdateComponentStateDto,
  ): Promise<UpdateComponentStateResponseDto> {
    return await this.db.transaction(async (tx) => {
      // Lock thread row so `runStatus` can't flip mid-update.
      const threads = await tx
        .select({
          id: schema.threads.id,
          runStatus: schema.threads.runStatus,
        })
        .from(schema.threads)
        .where(eq(schema.threads.id, threadId))
        .limit(1)
        .for("update")
        .execute();

      const thread = threads[0];

      if (!thread) {
        throw new NotFoundException(`Thread ${threadId} not found`);
      }

      if (thread.runStatus !== V1RunStatus.IDLE) {
        throw new ConflictException(
          createProblemDetail(
            V1ErrorCodes.RUN_ACTIVE,
            "Cannot update component state while a run is active",
            { threadId, runStatus: thread.runStatus },
          ),
        );
      }

      const patch = Array.isArray(dto.patch) ? dto.patch : undefined;
      const state = dto.state;
      const hasState = state !== undefined && state !== null;
      const hasPatch = patch !== undefined;

      const isJsonObject = (value: unknown): value is Record<string, unknown> =>
        value !== null && typeof value === "object" && !Array.isArray(value);

      if (hasState && hasPatch) {
        throw new BadRequestException(
          createProblemDetail(
            V1ErrorCodes.VALIDATION_ERROR,
            "Provide either 'state' or 'patch', not both",
            { threadId, componentId },
          ),
        );
      }

      if (!hasState && !hasPatch) {
        throw new BadRequestException(
          createProblemDetail(
            V1ErrorCodes.VALIDATION_ERROR,
            "Either 'state' or 'patch' must be provided",
            { threadId, componentId },
          ),
        );
      }

      if (hasState && !isJsonObject(state)) {
        throw new BadRequestException(
          createProblemDetail(
            V1ErrorCodes.VALIDATION_ERROR,
            "'state' must be a JSON object",
            { threadId, componentId },
          ),
        );
      }

      if (hasPatch && patch.length === 0) {
        throw new BadRequestException(
          createProblemDetail(
            V1ErrorCodes.VALIDATION_ERROR,
            "'patch' must not be empty",
            { threadId, componentId },
          ),
        );
      }

      // 2. Verify component exists in thread by searching content array for component blocks
      const message = await this.findMessageWithComponent(
        tx,
        threadId,
        componentId,
      );

      if (!message) {
        throw new NotFoundException(
          `Component ${componentId} not found in thread ${threadId}`,
        );
      }

      // 3. Get current state
      const rawState = message.componentState;
      let currentState: Record<string, unknown> = {};
      if (rawState !== null && rawState !== undefined) {
        if (!isJsonObject(rawState)) {
          throw new HttpException(
            createProblemDetail(
              V1ErrorCodes.INTERNAL_ERROR,
              "Stored component state is invalid",
              { threadId, componentId, messageId: message.id },
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        currentState = rawState;
      }

      // 4. Apply update (full replacement or JSON Patch)
      let newState: Record<string, unknown>;

      if (patch !== undefined) {
        const patchOperations = this.convertJsonPatchDtoToOperations(
          patch,
          threadId,
          componentId,
        );

        // JSON Patch mode
        const validation = validateJsonPatch(patchOperations, currentState);
        if (validation) {
          throw new BadRequestException(
            createProblemDetail(
              V1ErrorCodes.INVALID_JSON_PATCH,
              `Invalid JSON Patch: ${validation.message}`,
              { errors: validation },
            ),
          );
        }

        const patchResult = applyPatch(
          currentState,
          patchOperations,
          false,
          false,
        );
        newState = patchResult.newDocument;
      } else if (hasState) {
        // Full replacement mode
        newState = state;
      } else {
        throw new Error("Unreachable: request shape already validated");
      }

      // 5. Persist the new state
      await this.persistComponentState(tx, message.id, newState);

      return { state: newState };
    });
  }

  private convertJsonPatchDtoToOperations(
    patch: NonNullable<UpdateComponentStateDto["patch"]>,
    threadId: string,
    componentId: string,
  ): ReadonlyArray<Operation> {
    return patch.map((operation) => {
      switch (operation.op) {
        case "add":
        case "replace":
        case "test":
          return {
            op: operation.op,
            path: operation.path,
            value: operation.value,
          };
        case "remove":
          return {
            op: operation.op,
            path: operation.path,
          };
        case "copy":
        case "move":
          if (typeof operation.from !== "string") {
            throw new BadRequestException(
              createProblemDetail(
                V1ErrorCodes.INVALID_JSON_PATCH,
                "Invalid JSON Patch: operation requires 'from'",
                { threadId, componentId, operation },
              ),
            );
          }
          return {
            op: operation.op,
            from: operation.from,
            path: operation.path,
          };
        default:
          throw new Error("Unreachable: unknown JSON Patch operation");
      }
    });
  }

  /**
   * Find the first message in a thread containing a component block with the given ID.
   *
   * The `content` column is stored as JSONB and expected to be a JSON array of blocks.
   * Non-array content is treated as empty.
   *
   * @param threadId - Thread to search
   * @param componentId - Component ID to find
   * @returns Message `id` and `componentState`, or undefined if not found
   */
  private async findMessageWithComponent(
    db: HydraDb,
    threadId: string,
    componentId: string,
  ): Promise<
    | Pick<typeof schema.messages.$inferSelect, "id" | "componentState">
    | undefined
  > {
    // `content` is stored in SuperJSON format: {"json": [...], "meta": {...}}
    // We need to access content->'json' to get the actual content array.
    const messages = await db
      .select({
        id: schema.messages.id,
        componentState: schema.messages.componentState,
      })
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.threadId, threadId),
          sql`exists (
            select 1
            from jsonb_array_elements(
              case when jsonb_typeof(content->'json') = 'array' then content->'json' else '[]'::jsonb end
            ) as elem
            where elem->>'type' = 'component'
              and elem->>'id' = ${componentId}
          )`,
        ),
      )
      .limit(1)
      .for("update")
      .execute();

    return messages[0];
  }

  /**
   * Persist component state to the database.
   *
   * Uses full replacement of componentState field for simplicity.
   * For JSON Patch mode, we already applied the patch in-memory before calling this.
   *
   * @param messageId - Message ID containing the component
   * @param newState - New complete state to persist
   */
  private async persistComponentState(
    db: HydraDb,
    messageId: string,
    newState: Record<string, unknown>,
  ): Promise<void> {
    await operations.updateMessage(db, messageId, {
      componentState: newState,
    });
  }

  // ==========================================
  // Suggestion operations
  // ==========================================

  /**
   * List suggestions for a message with cursor-based pagination.
   *
   * Unlike the beta API which returns 404 for no suggestions,
   * V1 returns an empty array for consistency with other list endpoints.
   *
   * @param threadId - Thread containing the message
   * @param messageId - Message to get suggestions for
   * @param projectId - Project ID for access validation
   * @param userKey - User key for access validation
   * @param query - Pagination parameters
   * @returns Paginated list of suggestions
   */
  async listSuggestions(
    threadId: string,
    messageId: string,
    projectId: string,
    userKey: string,
    query: V1ListSuggestionsQueryDto,
  ): Promise<V1ListSuggestionsResponseDto> {
    // Verify thread belongs to project and user
    const thread = await operations.getThreadForProjectId(
      this.db,
      threadId,
      projectId,
      userKey,
    );

    if (!thread) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    // Verify message exists in thread
    const message = await operations.getMessageByIdInThread(
      this.db,
      threadId,
      messageId,
    );

    if (!message) {
      throw new NotFoundException(
        `Message ${messageId} not found in thread ${threadId}`,
      );
    }

    const effectiveLimit = this.parseLimit(query.limit, 10);

    // Parse and validate cursor
    let cursor: ReturnType<typeof parseV1CompoundCursor> | undefined;
    if (query.cursor) {
      try {
        cursor = parseV1CompoundCursor(query.cursor);
      } catch {
        throw new BadRequestException(
          createProblemDetail(
            V1ErrorCodes.INVALID_CURSOR,
            "Invalid pagination cursor",
          ),
        );
      }

      // Validate cursor is scoped to this message
      if (cursor.messageId && cursor.messageId !== messageId) {
        throw new BadRequestException(
          createProblemDetail(
            V1ErrorCodes.INVALID_CURSOR,
            "Cursor does not belong to this message",
          ),
        );
      }
    }

    const suggestions = await operations.listSuggestionsPaginated(
      this.db,
      messageId,
      {
        cursor,
        limit: effectiveLimit + 1,
      },
    );

    const hasMore = suggestions.length > effectiveLimit;
    const resultSuggestions = hasMore
      ? suggestions.slice(0, effectiveLimit)
      : suggestions;

    return {
      suggestions: resultSuggestions.map((s) => this.suggestionToDto(s)),
      nextCursor: hasMore
        ? encodeV1CompoundCursor({
            createdAt:
              resultSuggestions[resultSuggestions.length - 1].createdAt,
            id: resultSuggestions[resultSuggestions.length - 1].id,
            messageId, // Include messageId for cursor scoping validation
          })
        : undefined,
      hasMore,
    };
  }

  /**
   * Maximum number of messages to use as context for suggestion generation.
   * Limits DB read size and token usage for long threads.
   */
  private static readonly SUGGESTION_CONTEXT_MESSAGE_LIMIT = 5;

  /**
   * Generate suggestions for a message.
   *
   * Calls the AI to analyze the thread and generate suggested next actions.
   * Suggestions are persisted and returned. Any existing suggestions for the
   * message are replaced (delete-before-insert semantics).
   *
   * @param threadId - Thread containing the message
   * @param messageId - Message to generate suggestions for
   * @param projectId - Project ID for access validation
   * @param userKey - User key for access validation
   * @param dto - Generation parameters
   * @returns Generated suggestions
   */
  async generateSuggestions(
    threadId: string,
    messageId: string,
    projectId: string,
    userKey: string,
    dto: V1GenerateSuggestionsDto,
  ): Promise<V1GenerateSuggestionsResponseDto> {
    return await Sentry.startSpan(
      {
        op: "v1.generateSuggestions",
        name: `V1 Generate Suggestions`,
        attributes: { threadId, messageId, maxSuggestions: dto.maxSuggestions },
      },
      async () => {
        // Verify thread belongs to project and user
        const thread = await operations.getThreadForProjectId(
          this.db,
          threadId,
          projectId,
          userKey,
        );

        if (!thread) {
          throw new NotFoundException(`Thread ${threadId} not found`);
        }

        // Verify message exists in thread
        const message = await operations.getMessageByIdInThread(
          this.db,
          threadId,
          messageId,
        );

        if (!message) {
          throw new NotFoundException(
            `Message ${messageId} not found in thread ${threadId}`,
          );
        }

        // Get recent thread messages for context (limited to avoid performance issues)
        // and convert to ThreadMessage format
        const dbMessages = await operations.getMessages(this.db, threadId);
        const recentMessages = dbMessages.slice(
          -V1Service.SUGGESTION_CONTEXT_MESSAGE_LIMIT,
        );
        const threadMessages = recentMessages.map((m) =>
          dbMessageToThreadMessage(m),
        );

        // Create TamboBackend and generate suggestions
        const tamboBackend =
          await this.threadsService.createTamboBackendForThread(
            threadId,
            userKey,
          );

        // Convert V1 available components to internal format
        const availableComponents = dto.availableComponents ?? [];

        const result = await tamboBackend.generateSuggestions(
          threadMessages,
          dto.maxSuggestions ?? 3,
          availableComponents.map((c) => ({
            name: c.name,
            description: c.description,
            props: c.propsSchema as Record<string, unknown>,
            contextTools: [],
          })),
          threadId,
          false, // includeTokenCount
        );

        // Delete existing suggestions before creating new ones (replace semantics)
        const deletedCount = await operations.deleteSuggestionsForMessage(
          this.db,
          messageId,
        );
        if (deletedCount > 0) {
          this.logger.log(
            `Deleted ${deletedCount} existing suggestions for message ${messageId}`,
          );
        }

        if (!result.suggestions?.length) {
          this.logger.warn(
            `No suggestions generated for message ${messageId} in thread ${threadId}`,
          );
          return {
            suggestions: [],
            hasMore: false,
          };
        }

        // Persist new suggestions
        const savedSuggestions = await operations.createSuggestions(
          this.db,
          result.suggestions.map((suggestion) => ({
            messageId,
            title: suggestion.title,
            detailedSuggestion: suggestion.detailedSuggestion,
          })),
        );

        this.logger.log(
          `Generated ${savedSuggestions.length} suggestions for message ${messageId}`,
        );

        return {
          suggestions: savedSuggestions.map((s) => this.suggestionToDto(s)),
          hasMore: false,
        };
      },
    );
  }

  /**
   * Convert a database suggestion to V1 DTO.
   */
  private suggestionToDto(suggestion: schema.DBSuggestion): V1SuggestionDto {
    return {
      id: suggestion.id,
      messageId: suggestion.messageId,
      title: suggestion.title,
      description: suggestion.detailedSuggestion,
      createdAt: suggestion.createdAt.toISOString(),
    };
  }
}

/**
 * Transform temporary message IDs in AG-UI events to real database IDs.
 *
 * The LLM client (ai-sdk-client) generates temporary IDs like "message-xyz"
 * because it doesn't have database access. advanceThread creates real messages
 * in the DB with IDs like "msg_abc123". This function maps temp IDs to real IDs
 * so the client SDK can correctly reference messages for operations like
 * component state updates.
 *
 * @param event - The AG-UI event to transform
 * @param realMessageId - The real DB message ID from advanceThread
 * @param mapping - Map tracking temp→real ID associations
 * @returns The event with real message IDs
 */
function transformEventMessageIds(
  event: BaseEvent,
  realMessageId: string | undefined,
  mapping: Map<string, string>,
): BaseEvent {
  if (!realMessageId) {
    return event;
  }

  // Handle TEXT_MESSAGE_* events (messageId at top level)
  if ("messageId" in event && typeof event.messageId === "string") {
    const tempId = event.messageId;

    // Record mapping on first encounter
    if (!mapping.has(tempId)) {
      mapping.set(tempId, realMessageId);
    }

    return { ...event, messageId: mapping.get(tempId) ?? tempId };
  }

  // Handle tambo.component.start custom event (messageId in value)
  if (event.type === EventType.CUSTOM) {
    const customEvent = event as BaseEvent & {
      name?: string;
      value?: { messageId?: string };
    };

    if (
      customEvent.name === "tambo.component.start" &&
      customEvent.value?.messageId
    ) {
      const tempId = customEvent.value.messageId;

      // Record mapping on first encounter
      if (!mapping.has(tempId)) {
        mapping.set(tempId, realMessageId);
      }

      return {
        ...event,
        value: {
          ...customEvent.value,
          messageId: mapping.get(tempId) ?? tempId,
        },
      };
    }
  }

  return event;
}
