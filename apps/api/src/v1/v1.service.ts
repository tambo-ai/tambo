import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  ContentPartType,
  ChatCompletionContentPart,
} from "@tambo-ai-cloud/core";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import {
  V1ContentBlock,
  V1ComponentContentDto,
  V1TextContentDto,
  V1ResourceContentDto,
} from "./dto/content.dto";
import {
  V1GetMessageResponseDto,
  V1ListMessagesQueryDto,
  V1ListMessagesResponseDto,
  V1MessageDto,
  V1MessageRole,
} from "./dto/message.dto";
import {
  V1CreateThreadDto,
  V1CreateThreadResponseDto,
  V1GetThreadResponseDto,
  V1ListThreadsQueryDto,
  V1ListThreadsResponseDto,
  V1ThreadDto,
} from "./dto/thread.dto";

@Injectable()
export class V1Service {
  private readonly logger = new Logger(V1Service.name);

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
      threads: resultThreads.map((t) => this.mapThreadToDto(t)),
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
      ...this.mapThreadToDto(thread),
      messages: thread.messages.map((m) => this.mapMessageToDto(m)),
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

    return this.mapThreadToDto(thread);
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
      messages: resultMessages.map((m) => this.mapMessageToDto(m)),
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

    return this.mapMessageToDto(message);
  }

  /**
   * Map a database thread to V1ThreadDto.
   */
  private mapThreadToDto(
    thread: typeof schema.threads.$inferSelect,
  ): V1ThreadDto {
    return {
      id: thread.id,
      projectId: thread.projectId,
      contextKey: thread.contextKey ?? undefined,
      runStatus: thread.runStatus,
      currentRunId: thread.currentRunId ?? undefined,
      statusMessage: thread.statusMessage ?? undefined,
      lastRunCancelled: thread.lastRunCancelled ?? undefined,
      lastRunError: thread.lastRunError
        ? {
            code: thread.lastRunError.code,
            message: thread.lastRunError.message,
          }
        : undefined,
      pendingToolCallIds: thread.pendingToolCallIds ?? undefined,
      lastCompletedRunId: thread.lastCompletedRunId ?? undefined,
      metadata: thread.metadata ?? undefined,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }

  /**
   * Map a database message to V1MessageDto.
   * Converts internal content format to V1 content blocks.
   */
  private mapMessageToDto(
    message: typeof schema.messages.$inferSelect,
  ): V1MessageDto {
    const content = this.convertContentToV1Blocks(message);

    return {
      id: message.id,
      role: this.mapRole(message.role),
      content,
      createdAt: message.createdAt.toISOString(),
      metadata: message.metadata ?? undefined,
    };
  }

  /**
   * Map internal message role to V1 role.
   * V1 only supports user, assistant, system (not tool).
   */
  private mapRole(role: string): V1MessageRole {
    if (role === "user" || role === "assistant" || role === "system") {
      return role;
    }
    // Tool messages become assistant in V1 format per API design
    if (role === "tool") {
      return "assistant";
    }
    // Unknown role - this is unexpected and indicates a data issue
    throw new Error(
      `Unknown message role "${role}". Expected: user, assistant, system, or tool.`,
    );
  }

  /**
   * Convert internal message content to V1 content blocks.
   * This handles the mapping from OpenAI-style content parts + component decision
   * to the V1 unified content block format.
   */
  private convertContentToV1Blocks(
    message: typeof schema.messages.$inferSelect,
  ): V1ContentBlock[] {
    const blocks: V1ContentBlock[] = [];

    // Convert standard content parts
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        const block = this.convertContentPartToV1Block(part);
        if (block) {
          blocks.push(block);
        }
      }
    }

    // Add component content block if present
    if (message.componentDecision) {
      const component = message.componentDecision;
      if (!component.componentName) {
        throw new Error(
          `Component decision in message ${message.id} has no componentName. ` +
            `This indicates a data integrity issue.`,
        );
      }
      const componentBlock: V1ComponentContentDto = {
        type: "component",
        id: `comp_${message.id}`, // Generate stable ID from message ID
        name: component.componentName,
        props: component.props ?? {},
        state: message.componentState ?? undefined,
      };
      blocks.push(componentBlock);
    }

    return blocks;
  }

  /**
   * Convert a single content part to a V1 content block.
   */
  private convertContentPartToV1Block(
    part: ChatCompletionContentPart,
  ): V1ContentBlock | null {
    switch (part.type) {
      case ContentPartType.Text:
      case "text": {
        const textBlock: V1TextContentDto = {
          type: "text",
          text: part.text ?? "",
        };
        return textBlock;
      }
      case ContentPartType.Resource:
      case "resource": {
        const resourceBlock: V1ResourceContentDto = {
          type: "resource",
          resource: part.resource as V1ResourceContentDto["resource"],
        };
        return resourceBlock;
      }
      case ContentPartType.ImageUrl:
      case "image_url": {
        // Convert image_url to resource format for V1
        const resourceBlock: V1ResourceContentDto = {
          type: "resource",
          resource: {
            uri: part.image_url?.url ?? "",
            mimeType: "image/*",
          },
        };
        return resourceBlock;
      }
      default:
        // Log unknown content types so they can be investigated
        this.logger.warn(
          `Unknown content part type "${(part as { type: unknown }).type}" encountered. ` +
            `This content will be skipped in the V1 API response.`,
        );
        return null;
    }
  }
}
