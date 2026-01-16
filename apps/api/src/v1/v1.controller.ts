import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
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
  V1CreateThreadDto,
  V1CreateThreadResponseDto,
  V1GetThreadResponseDto,
  V1ListThreadsQueryDto,
  V1ListThreadsResponseDto,
} from "./dto/thread.dto";
import { V1Service } from "./v1.service";

@ApiTags("v1")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("v1")
export class V1Controller {
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
}
