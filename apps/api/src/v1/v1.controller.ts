import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { ThreadInProjectGuard } from "../threads/guards/thread-in-project-guard";
import {
  V1GetMessageResponseDto,
  V1ListMessagesQueryDto,
  V1ListMessagesResponseDto,
} from "./dto/message.dto";
import {
  V1CancelRunResponseDto,
  V1CreateRunDto,
  V1CreateThreadWithRunDto,
} from "./dto/run.dto";
import {
  JsonPatchOperationDto,
  UpdateComponentStateDto,
  UpdateComponentStateResponseDto,
} from "./dto/component-state.dto";
import {
  V1CreateThreadDto,
  V1CreateThreadResponseDto,
  V1GetThreadResponseDto,
  V1ListThreadsQueryDto,
  V1ListThreadsResponseDto,
} from "./dto/thread.dto";
import { V1BaseEventDto } from "./dto/event.dto";
import { V1Service } from "./v1.service";

@ApiTags("v1")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("v1")
export class V1Controller {
  private readonly logger = new Logger(V1Controller.name);

  constructor(private readonly v1Service: V1Service) {}

  // ==========================================
  // Thread endpoints
  // ==========================================

  @Get("threads")
  @ApiOperation({
    summary: "List threads",
    description:
      "List all threads for the authenticated project. Supports cursor-based pagination and filtering by context key.",
  })
  @ApiResponse({
    status: 200,
    description: "List of threads",
    type: V1ListThreadsResponseDto,
  })
  async listThreads(
    @Req() request: Request,
    @Query() query: V1ListThreadsQueryDto,
  ): Promise<V1ListThreadsResponseDto> {
    const { projectId, contextKey: bearerContextKey } = extractContextInfo(
      request,
      query.contextKey,
    );
    // Use context key from query if provided, otherwise fall back to bearer token context
    const effectiveContextKey = query.contextKey ?? bearerContextKey;
    return await this.v1Service.listThreads(
      projectId,
      effectiveContextKey,
      query,
    );
  }

  @Get("threads/:threadId")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({
    summary: "Get thread with messages",
    description:
      "Get a thread by ID with all its messages. The thread must belong to the authenticated project.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiResponse({
    status: 200,
    description: "Thread with messages",
    type: V1GetThreadResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found",
  })
  async getThread(
    @Param("threadId") threadId: string,
  ): Promise<V1GetThreadResponseDto> {
    return await this.v1Service.getThread(threadId);
  }

  @Post("threads")
  @ApiOperation({
    summary: "Create empty thread",
    description:
      "Create a new empty thread. Note: initialMessages is not supported yet; create the thread first, then add messages via runs/message endpoints.",
  })
  @ApiResponse({
    status: 201,
    description: "Created thread",
    type: V1CreateThreadResponseDto,
  })
  async createThread(
    @Req() request: Request,
    @Body() dto: V1CreateThreadDto,
  ): Promise<V1CreateThreadResponseDto> {
    const { projectId, contextKey: bearerContextKey } = extractContextInfo(
      request,
      dto.contextKey,
    );
    // Use context key from body if provided, otherwise fall back to bearer token context
    const effectiveContextKey = dto.contextKey ?? bearerContextKey;
    return await this.v1Service.createThread(
      projectId,
      effectiveContextKey,
      dto,
    );
  }

  @Delete("threads/:threadId")
  @UseGuards(ThreadInProjectGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete thread",
    description:
      "Delete a thread and all its messages. This action cannot be undone.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiResponse({
    status: 204,
    description: "Thread deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found",
  })
  async deleteThread(@Param("threadId") threadId: string): Promise<void> {
    await this.v1Service.deleteThread(threadId);
  }

  // ==========================================
  // Message endpoints
  // ==========================================

  @Get("threads/:threadId/messages")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({
    summary: "List messages",
    description:
      "List messages in a thread. Supports cursor-based pagination and ordering.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiResponse({
    status: 200,
    description: "List of messages",
    type: V1ListMessagesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found",
  })
  async listMessages(
    @Param("threadId") threadId: string,
    @Query() query: V1ListMessagesQueryDto,
  ): Promise<V1ListMessagesResponseDto> {
    return await this.v1Service.listMessages(threadId, query);
  }

  @Get("threads/:threadId/messages/:messageId")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({
    summary: "Get message",
    description: "Get a specific message by ID from a thread.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiParam({
    name: "messageId",
    description: "Message ID",
    example: "msg_xyz789abc",
  })
  @ApiResponse({
    status: 200,
    description: "Message details",
    type: V1GetMessageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
  })
  async getMessage(
    @Param("threadId") threadId: string,
    @Param("messageId") messageId: string,
  ): Promise<V1GetMessageResponseDto> {
    return await this.v1Service.getMessage(threadId, messageId);
  }

  // ==========================================
  // Run endpoints
  // ==========================================

  @Post("threads/runs")
  @ApiOperation({
    summary: "Create thread with run (SSE)",
    description:
      "Creates a new thread and immediately starts a streaming run. Returns an SSE stream of AG-UI events.",
  })
  @ApiProduces("text/event-stream")
  @ApiResponse({
    status: 200,
    description:
      "SSE stream of AG-UI events. Each event is sent as 'data: <json>\\n\\n' where <json> is a BaseEvent object.",
    type: V1BaseEventDto,
    headers: {
      "X-Thread-Id": {
        description: "The created thread ID",
        schema: { type: "string" },
      },
      "X-Run-Id": {
        description: "The created run ID",
        schema: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Concurrent run conflict",
  })
  async createThreadWithRun(
    @Req() request: Request,
    @Body() dto: V1CreateThreadWithRunDto,
    @Res() response: Response,
  ): Promise<void> {
    const { projectId, contextKey: bearerContextKey } = extractContextInfo(
      request,
      dto.thread?.contextKey,
    );

    // Create thread first
    const effectiveContextKey = dto.thread?.contextKey ?? bearerContextKey;
    const thread = await this.v1Service.createThread(
      projectId,
      effectiveContextKey,
      {
        contextKey: dto.thread?.contextKey,
        metadata: dto.threadMetadata ?? dto.thread?.metadata,
      },
    );

    // Start run (handles concurrency atomically)
    const startResult = await this.v1Service.startRun(thread.id, dto);
    if (!startResult.success) {
      throw startResult.error;
    }

    // Set SSE headers
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Thread-Id", thread.id);
    response.setHeader("X-Run-Id", startResult.runId);
    response.flushHeaders();

    // Handle connection close
    let shouldCancelOnClose = true;
    response.on("finish", () => {
      shouldCancelOnClose = false;
    });
    response.on("close", () => {
      if (!shouldCancelOnClose) {
        return;
      }

      void this.v1Service
        .cancelRun(thread.id, startResult.runId, "connection_closed")
        .catch((error: unknown) => {
          // NotFoundException is expected if run already completed
          if (!(error instanceof NotFoundException)) {
            this.logger.warn(
              `Failed to cancel run ${startResult.runId} on connection close: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        });
    });

    try {
      await this.v1Service.executeRun(
        response,
        thread.id,
        startResult.runId,
        dto,
        projectId,
        effectiveContextKey,
      );
    } catch (error) {
      // Emit error event if headers already sent
      // Note: We use a generic message to avoid exposing internal error details
      if (response.headersSent) {
        const errorEvent = {
          type: "RUN_ERROR",
          message: "An internal error occurred",
          code: "INTERNAL_ERROR",
          timestamp: Date.now(),
        };
        response.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      }
      throw error;
    } finally {
      response.end();
    }
  }

  @Post("threads/:threadId/runs")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({
    summary: "Create run on existing thread (SSE)",
    description:
      "Starts a streaming run on an existing thread. Returns an SSE stream of AG-UI events.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiProduces("text/event-stream")
  @ApiResponse({
    status: 200,
    description:
      "SSE stream of AG-UI events. Each event is sent as 'data: <json>\\n\\n' where <json> is a BaseEvent object.",
    type: V1BaseEventDto,
    headers: {
      "X-Run-Id": {
        description: "The created run ID",
        schema: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found",
  })
  @ApiResponse({
    status: 409,
    description: "Concurrent run conflict",
  })
  async createRun(
    @Req() request: Request,
    @Param("threadId") threadId: string,
    @Body() dto: V1CreateRunDto,
    @Res() response: Response,
  ): Promise<void> {
    // Extract project and context info from the request
    // Note: V1CreateRunDto doesn't have contextKey, so we only use bearer token context
    const { projectId, contextKey } = extractContextInfo(request, undefined);

    // Start run (handles concurrency atomically)
    const startResult = await this.v1Service.startRun(threadId, dto);
    if (!startResult.success) {
      throw startResult.error;
    }

    // Set SSE headers
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Run-Id", startResult.runId);
    response.flushHeaders();

    // Handle connection close
    let shouldCancelOnClose = true;
    response.on("finish", () => {
      shouldCancelOnClose = false;
    });
    response.on("close", () => {
      if (!shouldCancelOnClose) {
        return;
      }

      void this.v1Service
        .cancelRun(threadId, startResult.runId, "connection_closed")
        .catch((error: unknown) => {
          // NotFoundException is expected if run already completed
          if (!(error instanceof NotFoundException)) {
            this.logger.warn(
              `Failed to cancel run ${startResult.runId} on connection close: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        });
    });

    try {
      await this.v1Service.executeRun(
        response,
        threadId,
        startResult.runId,
        dto,
        projectId,
        contextKey,
      );
    } catch (error) {
      // Emit error event if headers already sent
      // Note: We use a generic message to avoid exposing internal error details
      if (response.headersSent) {
        const errorEvent = {
          type: "RUN_ERROR",
          message: "An internal error occurred",
          code: "INTERNAL_ERROR",
          timestamp: Date.now(),
        };
        response.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      }
      throw error;
    } finally {
      response.end();
    }
  }

  @Delete("threads/:threadId/runs/:runId")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({
    summary: "Cancel run",
    description:
      "Explicitly cancel a running run. Note: closing the SSE connection also cancels the run.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiParam({
    name: "runId",
    description: "Run ID",
    example: "run_xyz789abc",
  })
  @ApiResponse({
    status: 200,
    description: "Run cancelled",
    type: V1CancelRunResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Run not found",
  })
  async cancelRun(
    @Param("threadId") threadId: string,
    @Param("runId") runId: string,
  ): Promise<V1CancelRunResponseDto> {
    return await this.v1Service.cancelRun(threadId, runId, "user_cancelled");
  }

  // ==========================================
  // Component state endpoint
  // ==========================================

  @Post("threads/:threadId/components/:componentId/state")
  @UseGuards(ThreadInProjectGuard)
  @ApiExtraModels(JsonPatchOperationDto)
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: "object",
          required: ["state"],
          properties: {
            state: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        {
          type: "object",
          required: ["patch"],
          properties: {
            patch: {
              type: "array",
              minItems: 1,
              items: { $ref: getSchemaPath(JsonPatchOperationDto) },
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: "Update component state",
    description:
      "Update the state of a component in a thread. Supports both full replacement and JSON Patch operations. Thread must not have an active run.",
  })
  @ApiParam({
    name: "threadId",
    description: "Thread ID",
    example: "thr_abc123xyz",
  })
  @ApiParam({
    name: "componentId",
    description: "Component ID",
    example: "comp_xyz789abc",
  })
  @ApiResponse({
    status: 200,
    description: "Component state updated successfully",
    type: UpdateComponentStateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request (missing state/patch, or invalid patch)",
  })
  @ApiResponse({
    status: 404,
    description: "Component not found in thread",
  })
  @ApiResponse({
    status: 409,
    description: "Cannot update state while run is active",
  })
  async updateComponentState(
    @Param("threadId") threadId: string,
    @Param("componentId") componentId: string,
    @Body() dto: UpdateComponentStateDto,
  ): Promise<UpdateComponentStateResponseDto> {
    return await this.v1Service.updateComponentState(
      threadId,
      componentId,
      dto,
    );
  }
}
