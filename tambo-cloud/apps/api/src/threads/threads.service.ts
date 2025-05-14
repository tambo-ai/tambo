import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  generateChainId,
  getToolsFromSources,
  SystemTools,
  TamboBackend,
} from "@tambo-ai-cloud/backend";
import {
  ComponentDecisionV2,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
  unstrictifyToolCallRequest,
} from "@tambo-ai-cloud/core";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { decryptProviderKey } from "../common/key.utils";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { getSystemTools } from "../common/systemTools";
import { ProjectsService } from "../projects/projects.service";
import {
  AdvanceThreadDto,
  AdvanceThreadResponseDto,
} from "./dto/advance-thread.dto";
import { MessageRequest, ThreadMessageDto } from "./dto/message.dto";
import { SuggestionDto } from "./dto/suggestion.dto";
import { SuggestionsGenerateDto } from "./dto/suggestions-generate.dto";
import { Thread, ThreadRequest, ThreadWithMessagesDto } from "./dto/thread.dto";
import {
  FREE_MESSAGE_LIMIT,
  FreeLimitReachedError,
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from "./types/errors";
import { convertContentPartToDto } from "./util/content";
import {
  addMessage,
  threadMessageDtoToThreadMessage,
  updateMessage,
} from "./util/messages";
import { mapSuggestionToDto } from "./util/suggestions";
import {
  addAssistantResponse,
  addInProgressMessage,
  addUserMessage,
  convertDecisionStreamToMessageStream,
  finishInProgressMessage,
  processThreadMessage,
  updateGenerationStage,
} from "./util/thread-state";
import { callSystemTool, extractToolResponse } from "./util/tool";

/**
 * The maximum depth of tool calls we will make. This is to prevent infinite
 * loops.
 */
const MAX_TOOL_CALL_DEPTH = 3;

@Injectable()
export class ThreadsService {
  constructor(
    // @Inject(TRANSACTION)
    // private readonly tx: HydraDatabase,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
    private readonly emailService: EmailService,
  ) {}

  getDb() {
    // return this.tx ?? this.db;
    return this.db;
  }

  private async getHydraBackend(threadId: string): Promise<TamboBackend> {
    return await this.createHydraBackendForThread(threadId);
  }

  private async createHydraBackendForThread(
    threadId: string,
  ): Promise<TamboBackend> {
    const chainId = await generateChainId(threadId);

    // Get the thread's project ID from the database
    const threadData = await this.getDb().query.threads.findFirst({
      where: eq(schema.threads.id, threadId),
    });

    if (!threadData) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    // Get the provider key from the database
    const providerKey = await this.validateProjectAndProviderKeys(
      threadData.projectId,
    );

    // Use the provider key from the database instead of the environment variable
    return new TamboBackend(providerKey, chainId);
  }

  async createThread(createThreadDto: ThreadRequest): Promise<Thread> {
    const thread = await operations.createThread(this.getDb(), {
      projectId: createThreadDto.projectId,
      contextKey: createThreadDto.contextKey,
      metadata: createThreadDto.metadata,
    });
    return {
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      projectId: thread.projectId,
    };
  }

  async findAllForProject(
    projectId: string,
    params: { contextKey?: string; offset?: number; limit?: number } = {},
  ): Promise<Thread[]> {
    const threads = await operations.getThreadsByProject(
      this.getDb(),
      projectId,
      params,
    );
    return threads.map((thread) => ({
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      projectId: thread.projectId,
    }));
  }

  async countThreadsByProject(
    projectId: string,
    params: { contextKey?: string } = {},
  ): Promise<number> {
    return await operations.countThreadsByProject(
      this.getDb(),
      projectId,
      params,
    );
  }

  async findOne(id: string, projectId: string): Promise<ThreadWithMessagesDto> {
    const thread = await operations.getThreadForProjectId(
      this.getDb(),
      id,
      projectId,
    );
    if (!thread) {
      throw new NotFoundException("Thread not found");
    }
    return {
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      projectId: thread.projectId,
      messages: thread.messages.map((message) => ({
        id: message.id,
        threadId: message.threadId,
        role: message.role,
        createdAt: message.createdAt,
        component: message.componentDecision ?? undefined,
        content: convertContentPartToDto(message.content),
        metadata: message.metadata ?? undefined,
        componentState: message.componentState ?? {},
        toolCallRequest: message.toolCallRequest ?? undefined,
        actionType: message.actionType ?? undefined,
        tool_call_id: message.toolCallId ?? undefined,
        error: message.error ?? undefined,
      })),
    };
  }

  async update(id: string, updateThreadDto: ThreadRequest) {
    const thread = await operations.updateThread(this.getDb(), id, {
      contextKey: updateThreadDto.contextKey,
      metadata: updateThreadDto.metadata,
      generationStage: updateThreadDto.generationStage,
      statusMessage: updateThreadDto.statusMessage,
    });
    return thread;
  }

  async updateGenerationStage(
    id: string,
    generationStage: GenerationStage,
    statusMessage?: string,
  ) {
    return await updateGenerationStage(
      this.getDb(),
      id,
      generationStage,
      statusMessage,
    );
  }

  async remove(id: string) {
    return await operations.deleteThread(this.getDb(), id);
  }

  private async checkMessageLimit(projectId: string): Promise<void> {
    const usage = await operations.getProjectMessageUsage(
      this.getDb(),
      projectId,
    );

    // Check if we're using the fallback key
    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    const providerKeys = project.getProviderKeys();
    const usingFallbackKey = !providerKeys.length;

    if (!usage) {
      // Create initial usage record
      await operations.updateProjectMessageUsage(this.getDb(), projectId, {
        messageCount: usingFallbackKey ? 1 : 0,
      });
      return;
    }

    if (!usage.hasApiKey && usage.messageCount >= FREE_MESSAGE_LIMIT) {
      // Only send email if we haven't sent one before
      if (!usage.notificationSentAt) {
        // Get project owner's email from auth.users
        const projectOwner = await this.getDb().query.projectMembers.findFirst({
          where: eq(schema.projectMembers.projectId, projectId),
          with: {
            user: true,
          },
        });

        const ownerEmail = projectOwner?.user.email;

        if (ownerEmail) {
          await this.emailService.sendMessageLimitNotification(
            projectId,
            ownerEmail,
            project.name,
          );

          // Update the notification sent timestamp
          await operations.updateProjectMessageUsage(this.getDb(), projectId, {
            notificationSentAt: new Date(),
          });
        }
      }

      throw new FreeLimitReachedError();
    }

    // Only increment message count if using fallback key
    if (usingFallbackKey) {
      await operations.incrementMessageCount(this.getDb(), projectId);
    }
  }

  async addMessage(
    threadId: string,
    messageDto: MessageRequest,
  ): Promise<ThreadMessage> {
    return await addMessage(this.getDb(), threadId, messageDto);
  }

  async getMessages(
    threadId: string,
    includeInternal: boolean = false,
  ): Promise<ThreadMessageDto[]> {
    const messages = await operations.getMessages(
      this.getDb(),
      threadId,
      includeInternal,
    );
    return messages.map((message) => ({
      ...message,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      toolCallRequest: message.toolCallRequest ?? undefined,
      tool_call_id: message.toolCallId ?? undefined,
      actionType: message.actionType ?? undefined,
      componentState: message.componentState ?? {},
      component: message.componentDecision as ComponentDecisionV2 | undefined,
      error: message.error ?? undefined,
    }));
  }

  async deleteMessage(messageId: string) {
    await operations.deleteMessage(this.getDb(), messageId);
  }

  async ensureThreadByProjectId(threadId: string, projectId: string) {
    await operations.ensureThreadByProjectId(this.getDb(), threadId, projectId);
  }

  private async getMessage(messageId: string) {
    try {
      const message = await operations.getMessageWithAccess(
        this.getDb(),
        messageId,
      );
      if (!message) {
        this.logger.warn(`Message not found: ${messageId}`);
        throw new InvalidSuggestionRequestError("Message not found");
      }
      return message;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting message: ${errorMessage}`, errorStack);
      throw new InvalidSuggestionRequestError("Failed to retrieve message");
    }
  }

  async getSuggestions(messageId: string): Promise<SuggestionDto[]> {
    this.logger.log(`Getting suggestions for message: ${messageId}`);

    await this.getMessage(messageId);

    try {
      const suggestions = await operations.getSuggestions(
        this.getDb(),
        messageId,
      );
      if (suggestions.length === 0) {
        throw new SuggestionNotFoundException(messageId);
      }

      this.logger.log(
        `Found ${suggestions.length} suggestions for message: ${messageId}`,
      );
      return suggestions.map(mapSuggestionToDto);
    } catch (error: unknown) {
      if (error instanceof SuggestionNotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error getting suggestions: ${errorMessage}`,
        errorStack,
      );
      throw new SuggestionGenerationError(messageId);
    }
  }

  async generateSuggestions(
    messageId: string,
    generateSuggestionsDto: SuggestionsGenerateDto,
  ): Promise<SuggestionDto[]> {
    const message = await this.getMessage(messageId);

    try {
      const threadMessages = await this.getMessages(message.threadId);

      const tamboBackend = await this.getHydraBackend(message.threadId);
      const suggestions = await tamboBackend.generateSuggestions(
        threadMessages as ThreadMessage[],
        generateSuggestionsDto.maxSuggestions ?? 3,
        generateSuggestionsDto.availableComponents ?? [],
        message.threadId,
        false,
      );

      if (!suggestions.suggestions.length) {
        throw new SuggestionGenerationError(messageId);
      }

      const savedSuggestions = await operations.createSuggestions(
        this.getDb(),
        suggestions.suggestions.map((suggestion) => ({
          messageId,
          title: suggestion.title,
          detailedSuggestion: suggestion.detailedSuggestion,
        })),
      );

      this.logger.log(
        `Generated ${savedSuggestions.length} suggestions for message: ${messageId}`,
      );
      return savedSuggestions.map(mapSuggestionToDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating suggestions: ${errorMessage}`,
        errorStack,
      );
      throw new SuggestionGenerationError(messageId, {
        maxSuggestions: generateSuggestionsDto.maxSuggestions,
        availableComponents: generateSuggestionsDto.availableComponents,
      });
    }
  }

  async updateComponentState(
    messageId: string,
    newState: Record<string, unknown>,
  ): Promise<ThreadMessageDto> {
    const message = await operations.updateMessageComponentState(
      this.getDb(),
      messageId,
      newState,
    );
    return {
      ...message,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      componentState: message.componentState ?? {},
      toolCallRequest: message.toolCallRequest ?? undefined,
      tool_call_id: message.toolCallId ?? undefined,
      actionType: message.actionType ?? undefined,
      error: message.error ?? undefined,
    };
  }

  /**
   * Advance the thread by one step.
   * @param projectId - The project ID.
   * @param advanceRequestDto - The advance request DTO, including optional message to append, context key, and available components.
   * @param unresolvedThreadId - The thread ID, if any
   * @param stream - Whether to stream the response.
   * @returns The the generated response thread message, generation stage, and status message.
   */
  async advanceThread(
    projectId: string,
    advanceRequestDto: AdvanceThreadDto,
    unresolvedThreadId?: string,
    stream?: true,
    depth?: number, // sets a maximum depth for when we do multiple tool calls (which we do with recursion)
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>>;
  async advanceThread(
    projectId: string,
    advanceRequestDto: AdvanceThreadDto,
    unresolvedThreadId?: string,
    stream?: false,
    depth?: number, // sets a maximum depth for when we do multiple tool calls (which we do with recursion)
  ): Promise<AdvanceThreadResponseDto>;
  async advanceThread(
    projectId: string,
    advanceRequestDto: AdvanceThreadDto,
    unresolvedThreadId?: string,
    stream?: boolean,
    depth?: number, // sets a maximum depth for when we do multiple tool calls (which we do with recursion)
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  >;
  async advanceThread(
    projectId: string,
    advanceRequestDto: AdvanceThreadDto,
    unresolvedThreadId?: string,
    stream?: boolean,
    depth = 0, // sets a maximum depth for when we do multiple tool calls (which we do with recursion)
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    const db = this.getDb();

    await this.checkMessageLimit(projectId);
    if (depth > MAX_TOOL_CALL_DEPTH) {
      throw new Error("Maximum tool call depth reached");
    }

    const thread = await this.ensureThread(
      projectId,
      unresolvedThreadId,
      advanceRequestDto.contextKey,
    );

    // Ensure only one request per thread adds its user message and continues
    const userMessage = await addUserMessage(
      db,
      thread.id,
      advanceRequestDto.messageToAppend,
      this.logger,
    );

    // Use the shared method to create the TamboBackend instance
    const tamboBackend = await this.createHydraBackendForThread(thread.id);

    // Log available components
    this.logger.log(
      `Available components for thread ${thread.id}: ${JSON.stringify(
        advanceRequestDto.availableComponents?.map((comp) => comp.name),
      )}`,
    );

    // Log detailed component information
    if (advanceRequestDto.availableComponents?.length) {
      this.logger.log(
        `Component details for thread ${thread.id}: ${JSON.stringify(
          advanceRequestDto.availableComponents.map((comp) => ({
            name: comp.name,
            description: comp.description,
            contextTools: comp.contextTools.length || 0,
          })),
        )}`,
      );
    }

    const messages = await this.getMessages(thread.id, true);
    const project = await operations.getProject(db, projectId);
    const customInstructions = project?.customInstructions ?? undefined;

    if (messages.length === 0) {
      throw new Error("No messages found");
    }

    if (stream) {
      return await this.generateStreamingResponse(
        projectId,
        thread.id,
        db,
        tamboBackend,
        threadMessageDtoToThreadMessage(messages),
        userMessage,
        advanceRequestDto,
        customInstructions,
        depth,
      );
    }

    const systemTools = await getSystemTools(
      db,
      projectId,
      null, // right now all provider contexts are stored with null context keys
    );

    const responseMessage = await processThreadMessage(
      db,
      thread.id,
      threadMessageDtoToThreadMessage(messages),
      advanceRequestDto,
      tamboBackend,
      systemTools,
      customInstructions,
    );
    const {
      responseMessageDto,
      resultingGenerationStage,
      resultingStatusMessage,
    } = await addAssistantResponse(
      db,
      thread.id,
      userMessage,
      responseMessage,
      this.logger,
    );

    const toolCallRequest = responseMessage.toolCallRequest;
    if (isSystemToolCall(toolCallRequest, systemTools)) {
      if (!responseMessage.toolCallId) {
        console.warn(
          `While handling tool call request ${toolCallRequest.toolName}, no tool call id in response message ${responseMessage}, returning assistant message`,
        );
      }
      return await this.handleSystemToolCall(
        toolCallRequest,
        responseMessage.toolCallId ?? "",
        systemTools,
        responseMessage,
        advanceRequestDto,
        projectId,
        thread.id,
        false,
        depth,
      );
    }

    return {
      responseMessageDto: {
        ...responseMessageDto,
        content: convertContentPartToDto(responseMessageDto.content),
        componentState: responseMessageDto.componentState ?? {},
      },
      generationStage: resultingGenerationStage,
      statusMessage: resultingStatusMessage,
    };
  }

  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    systemTools: SystemTools,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: boolean,
    depth: number,
  ): Promise<AdvanceThreadResponseDto>;
  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    systemTools: SystemTools,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: true,
    depth: number,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>>;
  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    systemTools: SystemTools,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: boolean,
    depth: number,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    const messageWithToolResponse: AdvanceThreadDto = await callSystemTool(
      systemTools,
      toolCallRequest,
      toolCallId,
      componentDecision,
      advanceRequestDto,
    );
    if (messageWithToolResponse === advanceRequestDto) {
      throw new Error("No tool call response, returning assistant message");
    }

    return await this.advanceThread(
      projectId,
      messageWithToolResponse,
      threadId,
      stream,
      depth + 1,
    );
  }

  private async generateStreamingResponse(
    projectId: string,
    threadId: string,
    db: HydraDatabase,
    tamboBackend: TamboBackend,
    messages: ThreadMessage[],
    userMessage: ThreadMessage,
    advanceRequestDto: AdvanceThreadDto,
    customInstructions: string | undefined,
    depth: number,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>> {
    const systemTools = await getSystemTools(
      db,
      projectId,
      null, // right now all provider contexts are stored with null context keys
    );
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role === MessageRole.Tool) {
      await updateGenerationStage(
        db,
        threadId,
        GenerationStage.HYDRATING_COMPONENT,
        `Hydrating ${latestMessage.component?.componentName}...`,
      );
      // Since we don't a store tool responses in the db, assumes that the tool response is the messageToAppend
      const toolResponse = extractToolResponse(
        advanceRequestDto.messageToAppend,
      );
      if (!toolResponse) {
        throw new Error("No tool response found");
      }
      const { originalTools, strictTools } = getToolsFromSources(
        advanceRequestDto.availableComponents ?? [],
        advanceRequestDto.clientTools ?? [],
        systemTools,
      );

      const streamedResponseMessage = await tamboBackend.runDecisionLoop({
        messageHistory: messages,
        strictTools,
        additionalContext: advanceRequestDto.additionalContext,
        customInstructions,
      });

      return this.handleAdvanceThreadStream(
        projectId,
        threadId,
        streamedResponseMessage,
        userMessage,
        systemTools,
        advanceRequestDto,
        originalTools,
        depth,
      );
    }

    await updateGenerationStage(
      db,
      threadId,
      GenerationStage.CHOOSING_COMPONENT,
      `Choosing component...`,
    );
    const { originalTools, strictTools } = getToolsFromSources(
      advanceRequestDto.availableComponents ?? [],
      advanceRequestDto.clientTools ?? [],
      systemTools,
    );

    const streamedResponseMessage = await tamboBackend.runDecisionLoop({
      messageHistory: messages,
      strictTools,
      additionalContext: advanceRequestDto.additionalContext,
      customInstructions,
      forceToolChoice: advanceRequestDto.forceToolChoice,
    });
    return this.handleAdvanceThreadStream(
      projectId,
      threadId,
      streamedResponseMessage,
      userMessage,
      systemTools,
      advanceRequestDto,
      originalTools,
      depth,
    );
  }

  private async *handleAdvanceThreadStream(
    projectId: string,
    threadId: string,
    stream: AsyncIterableIterator<LegacyComponentDecision>,
    userMessage: ThreadMessage,
    systemTools: SystemTools,
    originalRequest: AdvanceThreadDto,
    originalTools: OpenAI.Chat.Completions.ChatCompletionTool[],
    depth: number = 0,
  ): AsyncIterableIterator<AdvanceThreadResponseDto> {
    const db = this.getDb();
    const logger = this.logger;

    await updateGenerationStage(
      db,
      threadId,
      GenerationStage.STREAMING_RESPONSE,
      `Streaming response...`,
    );

    const inProgressMessage = await addInProgressMessage(
      db,
      threadId,
      userMessage,
      logger,
    );

    // we hold on to the final thread message, in case we have to switch to a tool call
    let finalThreadMessage: ThreadMessageDto | undefined;
    let lastUpdateTime = 0;
    const updateIntervalMs = 500;

    for await (const threadMessage of convertDecisionStreamToMessageStream(
      stream,
      inProgressMessage,
    )) {
      // Update db message on interval
      const currentTime = Date.now();
      if (currentTime - lastUpdateTime >= updateIntervalMs) {
        await updateMessage(db, inProgressMessage.id, threadMessage);
        lastUpdateTime = currentTime;
      }

      // do not yield the final thread message if it is a tool call, because we
      // might have to switch to an internal tool call
      if (!threadMessage.toolCallRequest) {
        yield {
          responseMessageDto: threadMessage,
          generationStage: GenerationStage.STREAMING_RESPONSE,
          statusMessage: `Streaming response...`,
        };
      }
      finalThreadMessage = threadMessage;
    }
    if (!finalThreadMessage) {
      throw new Error("No message found");
    }

    // Initially, the call was made with a strict schema, so we need to remove non-required parameters
    const strictToolCallRequest = finalThreadMessage.toolCallRequest;
    const originalTool = originalTools.find(
      (tool) => tool.function.name === strictToolCallRequest?.toolName,
    );

    const toolCallRequest = unstrictifyToolCallRequest(
      originalTool,
      strictToolCallRequest,
    );

    // Update the tool call to be the non-strict call
    finalThreadMessage = {
      ...finalThreadMessage,
      toolCallRequest,
    };

    const { resultingGenerationStage, resultingStatusMessage } =
      await finishInProgressMessage(
        db,
        threadId,
        userMessage,
        inProgressMessage.id,
        finalThreadMessage,
        logger,
      );
    const componentDecision = finalThreadMessage.component;
    if (componentDecision && isSystemToolCall(toolCallRequest, systemTools)) {
      const toolCallId = finalThreadMessage.tool_call_id;

      if (!toolCallId) {
        console.warn(
          `While handling tool call request ${toolCallRequest.toolName}, no tool call id in response message ${finalThreadMessage}, returning assistant message`,
        );
      }
      // Note that this effectively consumes nonStrictToolCallRequest and finalToolCallId
      const toolResponseMessageStream = await this.handleSystemToolCall(
        toolCallRequest,
        toolCallId ?? "",
        systemTools,
        componentDecision,
        originalRequest,
        projectId,
        threadId,
        true,
        depth,
      );

      for await (const chunk of toolResponseMessageStream) {
        yield chunk;
      }
      return;
    }

    // We only yield the final response with the tool call request and tool call id set if we did not call a system tool
    yield {
      responseMessageDto: finalThreadMessage,
      generationStage: resultingGenerationStage,
      statusMessage: resultingStatusMessage,
    };
  }

  private async ensureThread(
    projectId: string,
    threadId: string | undefined,
    contextKey: string | undefined,
    preventCreate: boolean = false,
  ): Promise<Thread> {
    // If the threadId is provided, ensure that the thread belongs to the project
    if (threadId) {
      await this.ensureThreadByProjectId(threadId, projectId);
      // TODO: should we update contextKey?
      const thread = await this.findOne(threadId, projectId);
      return thread;
    }

    if (preventCreate) {
      throw new Error("Thread ID is required, and cannot be created");
    }

    // If the threadId is not provided, create a new thread
    const newThread = await this.createThread({
      projectId,
      contextKey,
    });
    return newThread;
  }

  private async validateProjectAndProviderKeys(
    projectId: string,
  ): Promise<string> {
    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const providerKeys = project.getProviderKeys();

    // If no provider keys are set, use the fallback key
    if (!providerKeys.length) {
      const fallbackKey = process.env.FALLBACK_OPENAI_API_KEY;
      if (!fallbackKey) {
        throw new NotFoundException(
          "No provider keys found for project and no fallback key configured",
        );
      }
      return fallbackKey;
    }

    // Use the last provider key if available
    const providerKey =
      providerKeys[providerKeys.length - 1].providerKeyEncrypted;
    if (!providerKey) {
      throw new NotFoundException("No provider key found for project");
    }

    const { providerKey: decryptedKey } = decryptProviderKey(providerKey);
    return decryptedKey;
  }
}
function isSystemToolCall(
  toolCallRequest: ToolCallRequest | undefined,
  systemTools: SystemTools,
): toolCallRequest is ToolCallRequest {
  return (
    !!toolCallRequest &&
    (toolCallRequest.toolName in systemTools.mcpToolSources ||
      systemTools.composioToolNames.includes(toolCallRequest.toolName))
  );
}
