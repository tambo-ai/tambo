import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import type { Request } from "express";
import { DATABASE } from "../common/database-provider";
import { CreateMemoryDto } from "./dto/create-memory.dto";
import { memoryImportanceSchema } from "./memory-extraction-schema";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { getV1ContextInfo } from "../v1/utils/get-v1-context-info";

@ApiTags("v1/memories")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("v1/memories")
export class MemoryController {
  private readonly logger = new Logger(MemoryController.name);

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List memories",
    description:
      "List active memories for a user within the authenticated project.",
  })
  @ApiQuery({ name: "userKey", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of active memories" })
  async listMemories(
    @Req() request: Request,
    @Query("userKey") userKey?: string,
  ) {
    const { projectId, contextKey } = getV1ContextInfo(request, userKey);
    const memories = await operations.getActiveMemories(
      this.db,
      projectId,
      contextKey,
    );
    return { memories };
  }

  @Post()
  @ApiOperation({
    summary: "Create a memory",
    description:
      "Create a new memory for a user within the authenticated project.",
  })
  @ApiResponse({ status: 201, description: "Memory created" })
  async createMemory(@Req() request: Request, @Body() body: CreateMemoryDto) {
    const { projectId, contextKey } = getV1ContextInfo(request, body.userKey);
    const memory = await operations.createMemory(this.db, {
      projectId,
      contextKey,
      content: body.content,
      category: body.category,
      importance: memoryImportanceSchema.parse(body.importance),
    });
    return { memory };
  }

  @Delete(":memoryId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a memory",
    description: "Soft-delete a specific memory by ID.",
  })
  @ApiResponse({ status: 204, description: "Memory deleted" })
  async deleteMemory(
    @Req() request: Request,
    @Param("memoryId") memoryId: string,
    @Query("userKey") userKey?: string,
  ) {
    const { projectId, contextKey } = getV1ContextInfo(request, userKey);
    await operations.softDeleteMemory(this.db, projectId, memoryId, contextKey);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete all memories for a user",
    description:
      'Soft-delete all memories for a user within the project. This is the "forget me" operation.',
  })
  @ApiQuery({ name: "userKey", required: false, type: String })
  @ApiResponse({ status: 204, description: "All memories deleted" })
  async deleteAllMemories(
    @Req() request: Request,
    @Query("userKey") userKey?: string,
  ) {
    const { projectId, contextKey } = getV1ContextInfo(request, userKey);
    const count = await operations.softDeleteAllMemoriesForContextKey(
      this.db,
      projectId,
      contextKey,
    );
    this.logger.log(
      `Deleted ${count} memories for context ${contextKey} in project ${projectId}`,
    );
  }
}
