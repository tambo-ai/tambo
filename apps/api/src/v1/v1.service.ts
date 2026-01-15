import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
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

@Injectable()
export class V1Service {
  private readonly logger = new Logger(V1Service.name);

  /**
   * Options passed to content conversion functions.
   * Logs warnings for unknown content types.
   */
  private readonly contentConversionOptions: ContentConversionOptions = {
    onUnknownContentType: (type) => {
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

  /**
   * List threads for a project with cursor-based pagination.
   */
  async listThreads(
    projectId: string,
    contextKey: string | undefined,
    query: V1ListThreadsQueryDto,
  ): Promise<V1ListThreadsResponseDto> {
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const effectiveLimit = Math.min(Math.max(1, limit), 100);

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
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const effectiveLimit = Math.min(Math.max(1, limit), 100);
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
}
