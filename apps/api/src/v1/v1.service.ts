import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
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
    if (contextKey) {
      conditions.push(eq(schema.threads.contextKey, contextKey));
    }

    // Cursor-based pagination (using createdAt)
    if (query.cursor) {
      conditions.push(lt(schema.threads.createdAt, new Date(query.cursor)));
    }

    const threads = await this.db.query.threads.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.threads.createdAt)],
      limit: effectiveLimit + 1, // Fetch one extra to determine hasMore
    });

    const hasMore = threads.length > effectiveLimit;
    const resultThreads = hasMore ? threads.slice(0, effectiveLimit) : threads;

    return {
      threads: resultThreads.map((t) => threadToDto(t)),
      nextCursor: hasMore
        ? resultThreads[resultThreads.length - 1]?.createdAt.toISOString()
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

    // Build where conditions
    const conditions = [eq(schema.messages.threadId, threadId)];

    // Cursor-based pagination
    if (query.cursor) {
      const cursorDate = new Date(query.cursor);
      if (order === "asc") {
        conditions.push(gt(schema.messages.createdAt, cursorDate));
      } else {
        conditions.push(lt(schema.messages.createdAt, cursorDate));
      }
    }

    const messages = await this.db.query.messages.findMany({
      where: and(...conditions),
      orderBy: [
        order === "asc"
          ? asc(schema.messages.createdAt)
          : desc(schema.messages.createdAt),
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
        ? resultMessages[resultMessages.length - 1]?.createdAt.toISOString()
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
