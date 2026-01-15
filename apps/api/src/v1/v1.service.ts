import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { V1RunStatus } from "@tambo-ai-cloud/core";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import type { Response } from "express";
import { createProblemDetail, V1ErrorCodes } from "./v1.errors";
import { V1CreateRunDto } from "./dto/run.dto";
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
} from "./dto/thread.dto";
import {
  threadToDto,
  messageToDto,
  ContentConversionOptions,
} from "./v1-conversions";
import { encodeV1CompoundCursor, parseV1CompoundCursor } from "./v1-pagination";

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
  ) {}

  private parseLimit(raw: string | undefined, fallback: number): number {
    if (raw !== undefined && raw.trim() === "") {
      throw new BadRequestException("Invalid limit");
    }

    const parsed = raw === undefined ? fallback : Number(raw);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException("Invalid limit");
    }

    return Math.min(Math.max(1, parsed), 100);
  }

  /**
   * List threads for a project with cursor-based pagination.
   */
  async listThreads(
    projectId: string,
    contextKey: string | undefined,
    query: V1ListThreadsQueryDto,
  ): Promise<V1ListThreadsResponseDto> {
    const effectiveLimit = this.parseLimit(query.limit, 20);

    // Build where conditions
    const conditions = [eq(schema.threads.projectId, projectId)];
    if (contextKey !== undefined) {
      if (contextKey.trim() === "") {
        throw new BadRequestException("contextKey cannot be empty");
      }

      conditions.push(eq(schema.threads.contextKey, contextKey));
    }

    // Cursor-based pagination (using createdAt + id)
    if (query.cursor) {
      const cursor = parseV1CompoundCursor(query.cursor);
      const cursorCondition = or(
        lt(schema.threads.createdAt, cursor.createdAt),
        and(
          eq(schema.threads.createdAt, cursor.createdAt),
          lt(schema.threads.id, cursor.id),
        ),
      )!;

      conditions.push(cursorCondition);
    }

    const threads = await this.db.query.threads.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.threads.createdAt), desc(schema.threads.id)],
      limit: effectiveLimit + 1, // Fetch one extra to determine hasMore
    });

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
  async getThread(threadId: string): Promise<V1GetThreadResponseDto> {
    const thread = await this.db.query.threads.findFirst({
      where: eq(schema.threads.id, threadId),
      with: {
        messages: {
          orderBy: [asc(schema.messages.createdAt)],
        },
      },
    });

    if (!thread) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    return {
      ...threadToDto(thread),
      messages: thread.messages.map((m) =>
        messageToDto(m, this.contentConversionOptions),
      ),
    };
  }

  /**
   * Create a new empty thread.
   */
  async createThread(
    projectId: string,
    contextKey: string | undefined,
    dto: V1CreateThreadDto,
  ): Promise<V1CreateThreadResponseDto> {
    if (dto.initialMessages?.length) {
      throw new BadRequestException(
        "initialMessages is not supported yet. Create the thread first, then add messages via runs/message endpoints.",
      );
    }

    if (contextKey !== undefined && contextKey.trim() === "") {
      throw new BadRequestException("contextKey cannot be empty");
    }

    const thread = await operations.createThread(this.db, {
      projectId,
      contextKey,
      metadata: dto.metadata,
    });

    if (!thread) {
      throw new Error(
        `Failed to create thread for project ${projectId}. ` +
          `Database insert did not return created record.`,
      );
    }

    return threadToDto(thread);
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

    // Build where conditions
    const conditions = [eq(schema.messages.threadId, threadId)];

    // Cursor-based pagination (using createdAt + id)
    if (query.cursor) {
      const cursor = parseV1CompoundCursor(query.cursor);
      const cursorCondition =
        order === "asc"
          ? or(
              gt(schema.messages.createdAt, cursor.createdAt),
              and(
                eq(schema.messages.createdAt, cursor.createdAt),
                gt(schema.messages.id, cursor.id),
              ),
            )
          : or(
              lt(schema.messages.createdAt, cursor.createdAt),
              and(
                eq(schema.messages.createdAt, cursor.createdAt),
                lt(schema.messages.id, cursor.id),
              ),
            );

      conditions.push(cursorCondition!);
    }

    const messages = await this.db.query.messages.findMany({
      where: and(...conditions),
      orderBy: [
        order === "asc"
          ? asc(schema.messages.createdAt)
          : desc(schema.messages.createdAt),
        order === "asc" ? asc(schema.messages.id) : desc(schema.messages.id),
      ],
      limit: effectiveLimit + 1,
    });

    const hasMore = messages.length > effectiveLimit;
    const resultMessages = hasMore
      ? messages.slice(0, effectiveLimit)
      : messages;

    return {
      messages: resultMessages.map((m) =>
        messageToDto(m, this.contentConversionOptions),
      ),
      nextCursor: hasMore
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
   */
  async getMessage(
    threadId: string,
    messageId: string,
  ): Promise<V1GetMessageResponseDto> {
    const message = await this.db.query.messages.findFirst({
      where: and(
        eq(schema.messages.id, messageId),
        eq(schema.messages.threadId, threadId),
      ),
    });

    if (!message) {
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
    // First, get the thread to check state
    const thread = await this.db.query.threads.findFirst({
      where: eq(schema.threads.id, threadId),
      with: {
        messages: {
          limit: 1, // Just check if any messages exist
          orderBy: [desc(schema.messages.createdAt)],
        },
      },
    });

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

    // If thread has messages, previousRunId is required
    const hasMessages = thread.messages.length > 0;
    if (hasMessages && !dto.previousRunId) {
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

    // Atomic conditional UPDATE to acquire the run lock
    // This prevents race conditions when multiple requests try to start a run simultaneously
    const updateResult = await this.db
      .update(schema.threads)
      .set({
        runStatus: V1RunStatus.WAITING,
        // Clear last run outcome fields when starting new run
        statusMessage: null,
        lastRunCancelled: null,
        lastRunError: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.runStatus, V1RunStatus.IDLE),
        ),
      )
      .returning({ id: schema.threads.id });

    if (updateResult.length === 0) {
      // Thread's runStatus was not IDLE - concurrent run already active
      return {
        success: false,
        error: new HttpException(
          createProblemDetail(
            V1ErrorCodes.CONCURRENT_RUN,
            `A run is already active on thread ${threadId}`,
            { threadId, currentRunId: thread.currentRunId },
          ),
          HttpStatus.CONFLICT,
        ),
      };
    }

    // Create the run record in the runs table
    const [run] = await this.db
      .insert(schema.runs)
      .values({
        threadId,
        status: V1RunStatus.WAITING,
        previousRunId: dto.previousRunId,
        model: dto.model,
        requestParams: {
          maxTokens: dto.maxTokens,
          temperature: dto.temperature,
          toolChoice: dto.toolChoice,
        },
        metadata: dto.runMetadata,
      })
      .returning({ id: schema.runs.id });

    // Update thread with the current run ID
    await this.db
      .update(schema.threads)
      .set({
        currentRunId: run.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.threads.id, threadId));

    this.logger.log(`Started run ${run.id} on thread ${threadId}`);

    return { success: true, runId: run.id, threadId };
  }

  /**
   * Cancel an active run.
   *
   * Sets the thread status back to IDLE and marks the run as cancelled.
   *
   * @returns The cancelled run info
   */
  async cancelRun(
    threadId: string,
    runId: string,
    reason: "user_cancelled" | "connection_closed",
  ): Promise<{ runId: string; status: "cancelled" }> {
    // Verify the run exists and belongs to this thread
    const run = await this.db.query.runs.findFirst({
      where: and(eq(schema.runs.id, runId), eq(schema.runs.threadId, threadId)),
    });

    if (!run) {
      throw new NotFoundException(
        `Run ${runId} not found on thread ${threadId}`,
      );
    }

    // Mark the run as cancelled
    await this.db
      .update(schema.runs)
      .set({
        isCancelled: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.runs.id, runId));

    // Update thread state
    await this.db
      .update(schema.threads)
      .set({
        runStatus: V1RunStatus.IDLE,
        currentRunId: null,
        lastRunCancelled: true,
        lastCompletedRunId: runId,
        updatedAt: new Date(),
      })
      .where(eq(schema.threads.id, threadId));

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
   */
  async executeRun(
    response: Response,
    threadId: string,
    runId: string,
    _dto: V1CreateRunDto,
  ): Promise<void> {
    // TODO: Implement executeRun in Phase 3
    // This is a placeholder - full implementation will:
    // 1. Emit RUN_STARTED event
    // 2. Add user message to thread
    // 3. Call LLM via shared logic with advanceThread
    // 4. Stream AG-UI events (TEXT_MESSAGE_START, TEXT_MESSAGE_CONTENT, etc.)
    // 5. Handle tool calls
    // 6. Emit RUN_FINISHED or RUN_ERROR
    // 7. Update run/thread state

    this.logger.log(`Executing run ${runId} on thread ${threadId}`);

    // Emit placeholder events for now
    const runStartedEvent = {
      type: "RUN_STARTED",
      threadId,
      runId,
      timestamp: Date.now(),
    };
    response.write(`data: ${JSON.stringify(runStartedEvent)}\n\n`);

    // Mark run as completed (placeholder)
    await this.db
      .update(schema.runs)
      .set({
        status: V1RunStatus.IDLE,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.runs.id, runId));

    // Release run lock
    await this.db
      .update(schema.threads)
      .set({
        runStatus: V1RunStatus.IDLE,
        currentRunId: null,
        lastCompletedRunId: runId,
        updatedAt: new Date(),
      })
      .where(eq(schema.threads.id, threadId));

    const runFinishedEvent = {
      type: "RUN_FINISHED",
      threadId,
      runId,
      timestamp: Date.now(),
    };
    response.write(`data: ${JSON.stringify(runFinishedEvent)}\n\n`);
  }
}
