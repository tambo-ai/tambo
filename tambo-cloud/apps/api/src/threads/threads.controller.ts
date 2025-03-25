import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { GenerationStage } from "@tambo-ai-cloud/core";
import { ApiKeyGuard } from "../components/guards/apikey.guard";
import {
  ProjectAccessOwnGuard,
  ProjectIdParameterKey,
} from "../projects/guards/project-access-own.guard";
import {
  AdvanceThreadDto,
  AdvanceThreadResponseDto,
} from "./dto/advance-thread.dto";
import { ErrorDto } from "./dto/error.dto";
import { MessageRequest, ThreadMessageDto } from "./dto/message.dto";
import { SuggestionDto } from "./dto/suggestion.dto";
import { SuggestionsGenerateDto } from "./dto/suggestions-generate.dto";
import {
  Thread,
  ThreadListDto,
  ThreadRequest,
  ThreadWithMessagesDto,
  UpdateComponentStateDto,
} from "./dto/thread.dto";
import { ThreadsService } from "./threads.service";

@ApiTags("threads")
@ApiSecurity("apiKey")
@UseGuards(ApiKeyGuard)
@Controller("threads")
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Post()
  async create(@Body() createThreadDto: ThreadRequest): Promise<Thread> {
    return await this.threadsService.createThread(createThreadDto);
  }

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Get("project/:projectId")
  @ApiQuery({ name: "contextKey", required: false })
  @ApiQuery({ name: "offset", required: false, type: Number, default: 0 })
  @ApiQuery({ name: "limit", required: false, type: Number, default: 10 })
  async findAllForProject(
    @Req() request: Request,
    @Param("projectId") projectId: string,
    @Query("contextKey") contextKey?: string,
    @Query("offset") offset: number = 0,
    @Query("limit") limit: number = 10,
  ): Promise<ThreadListDto> {
    const threadsPromise = this.threadsService.findAllForProject(projectId, {
      contextKey,
      offset,
      limit,
    });
    const totalPromise = this.threadsService.countThreadsByProject(projectId, {
      contextKey,
    });
    const threads = await threadsPromise;
    const total = await totalPromise;
    return {
      total,
      offset,
      limit,
      count: threads.length,
      items: threads,
    };
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Req() request,
  ): Promise<ThreadWithMessagesDto> {
    if (!request.projectId) {
      throw new BadRequestException("Project ID is required");
    }
    return await this.threadsService.findOne(id, request.projectId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateThreadDto: ThreadRequest,
  ): Promise<Thread> {
    const thread = await this.threadsService.update(id, updateThreadDto);
    return {
      ...thread,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage ?? undefined,
      statusMessage: thread.statusMessage ?? undefined,
    };
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return await this.threadsService.remove(id);
  }

  // @UseGuards(ProjectAccessOwnGuard)
  // TODO: Not protected by project access guard
  @Post(":id/messages")
  async addMessage(
    @Param("id") threadId: string,
    @Body() messageDto: MessageRequest,
  ) {
    if (!["user", "tool"].includes(messageDto.role)) {
      console.warn(`Received message with role ${messageDto.role}`, messageDto);
    }
    return await this.threadsService.addMessage(threadId, messageDto);
  }

  // @UseGuards(ProjectAccessOwnGuard)
  // TODO: Not protected by project access guard
  @Get(":id/messages")
  @ApiQuery({
    name: "includeInternal",
    description: "Whether to include internal messages",
    required: false,
    type: Boolean,
  })
  async getMessages(
    @Param("id") threadId: string,
    @Query("includeInternal") includeInternal?: boolean,
  ): Promise<ThreadMessageDto[]> {
    return (await this.threadsService.getMessages(
      threadId,
      includeInternal,
    )) as ThreadMessageDto[];
  }

  // @UseGuards(ProjectAccessOwnGuard)
  // TODO: Not protected by project access guard
  @Delete(":id/messages/:messageId")
  async deleteMessage(
    @Param("id") _threadId: string,
    @Param("messageId") messageId: string,
  ) {
    return await this.threadsService.deleteMessage(messageId);
  }

  // @UseGuards(ProjectAccessOwnGuard)
  // TODO: Not protected by project access guard
  @Get(":id/messages/:messageId/suggestions")
  @ApiOperation({
    summary: "Get suggestions for a message",
    description: "Retrieves all suggestions generated for a specific message",
  })
  @ApiParam({
    name: "id",
    description: "ID of the thread to get suggestions for",
    example: "thread_123456789",
  })
  @ApiParam({
    name: "messageId",
    description: "ID of the message to get suggestions for",
    example: "msg_123456789",
  })
  @ApiResponse({
    status: 200,
    description: "List of suggestions for the message",
    type: [SuggestionDto],
  })
  @ApiResponse({
    status: 404,
    description: "Message not found or has no suggestions",
    type: ErrorDto,
  })
  async getSuggestions(
    @Param("id") threadId: string,
    @Param("messageId") messageId: string,
  ): Promise<SuggestionDto[]> {
    return await this.threadsService.getSuggestions(messageId);
  }

  // @UseGuards(ProjectAccessOwnGuard)
  // TODO: Not protected by project access guard
  @Post(":id/messages/:messageId/suggestions")
  @ApiOperation({
    summary: "Generate new suggestions",
    description: "Generates and stores new suggestions for a specific message",
  })
  @ApiParam({
    name: "id",
    description: "ID of the thread to generate suggestions for",
    example: "thread_123456789",
  })
  @ApiParam({
    name: "messageId",
    description: "ID of the message to generate suggestions for",
    example: "msg_123456789",
  })
  @ApiResponse({
    status: 201,
    description: "New suggestions generated successfully",
    type: [SuggestionDto],
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request parameters",
    type: ErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
    type: ErrorDto,
  })
  @ApiResponse({
    status: 500,
    description: "Failed to generate suggestions",
    type: ErrorDto,
  })
  async generateSuggestions(
    @Param("id") threadId: string,
    @Param("messageId") messageId: string,
    @Body() generateSuggestionsDto: SuggestionsGenerateDto,
  ): Promise<SuggestionDto[]> {
    return await this.threadsService.generateSuggestions(
      messageId,
      generateSuggestionsDto,
    );
  }

  @Put(":id/messages/:messageId/component-state")
  async updateComponentState(
    @Param("id") threadId: string,
    @Param("messageId") messageId: string,
    @Body() newState: UpdateComponentStateDto,
  ): Promise<ThreadMessageDto> {
    const message = (await this.threadsService.updateComponentState(
      messageId,
      newState.state,
    )) as ThreadMessageDto;
    return message;
  }

  /**
   * Given a thread, generate the response message, optionally appending a message before generation.
   */
  @Post(":id/advance")
  async advanceThread(
    @Param("id") threadId: string,
    @Req() request,
    @Body() advanceRequestDto: AdvanceThreadDto,
  ): Promise<AdvanceThreadResponseDto> {
    if (!request.projectId) {
      throw new BadRequestException("Project ID is required");
    }
    return await (this.threadsService.advanceThread(
      request.projectId,
      advanceRequestDto,
      threadId,
    ) as Promise<AdvanceThreadResponseDto>);
  }

  @Post(":id/advancestream")
  async advanceThreadStream(
    @Param("id") threadId: string,
    @Req() request,
    @Body() advanceRequestDto: AdvanceThreadDto,
    @Res() response,
  ): Promise<void> {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    if (!request.projectId) {
      throw new BadRequestException("Project ID is required");
    }
    try {
      const stream = (await this.threadsService.advanceThread(
        request.projectId,
        advanceRequestDto,
        threadId,
        true,
      )) as AsyncIterableIterator<{
        responseMessageDto: ThreadMessageDto;
        generationStage: GenerationStage;
      }>;

      await this.handleAdvanceStream(response, stream);
    } catch (error: any) {
      response.write(`error: ${error.message}\n\n`);
      throw error;
    }
  }

  /**
   * Create a new thread and advance it, optionally appending a message before generation.
   */
  @Post("advance")
  async createAndAdvanceThread(
    @Req() request,
    @Body() advanceRequestDto: AdvanceThreadDto,
  ): Promise<AdvanceThreadResponseDto> {
    if (!request.projectId) {
      throw new BadRequestException("Project ID is required");
    }
    return await (this.threadsService.advanceThread(
      request.projectId,
      advanceRequestDto,
    ) as Promise<AdvanceThreadResponseDto>);
  }

  @Post("advancestream")
  async createAndAdvanceThreadStream(
    @Req() request,
    @Body() advanceRequestDto: AdvanceThreadDto,
    @Res() response,
  ): Promise<void> {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    if (!request.projectId) {
      throw new BadRequestException("Project ID is required");
    }
    try {
      const stream = (await this.threadsService.advanceThread(
        request.projectId,
        advanceRequestDto,
        undefined,
        true,
      )) as AsyncIterableIterator<{
        responseMessageDto: ThreadMessageDto;
        generationStage: GenerationStage;
      }>;
      await this.handleAdvanceStream(response, stream);
    } catch (error: any) {
      response.write(`error: ${error.message}\n\n`);
      throw error;
    }
  }

  private async handleAdvanceStream(
    @Res() response,
    stream: AsyncIterableIterator<{
      responseMessageDto: ThreadMessageDto;
      generationStage: GenerationStage;
    }>,
  ) {
    try {
      for await (const chunk of stream) {
        response.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error: any) {
      console.error(error);
      response.write(`error: ${error.message}\n\n`);
    } finally {
      response.write("data: DONE\n\n");
      response.end();
    }
  }
}
