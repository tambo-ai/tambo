import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  generateChainId,
  SystemTools,
  TamboBackend,
} from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ComponentDecisionV2,
  ContentPartType,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { decryptProviderKey } from "../common/key.utils";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { getSystemTools } from "../common/systemTools";
import { AvailableComponentDto } from "../components/dto/generate-component.dto";
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
  addAssistantResponse,
  addInProgressMessage,
  addMessage,
  addUserMessage,
  convertContentPartToDto,
  extractToolResponse,
  finishInProgressMessage,
  threadMessageDtoToThreadMessage,
  updateGenerationStage,
  updateMessage,
} from "./threads.utils";
import {
  FREE_MESSAGE_LIMIT,
  FreeLimitReachedError,
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from "./types/errors";

@Injectable()
export class ThreadsService {
  constructor(
    // @Inject(TRANSACTION)
    // private readonly tx: HydraDatabase,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
    private readonly configService: ConfigService,
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
    options: { version?: "v1" | "v2" } = {},
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
    return new TamboBackend(providerKey, chainId, options);
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
      generationStage: thread.generationStage ?? undefined,
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
      generationStage: thread.generationStage ?? undefined,
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
      generationStage: thread.generationStage ?? undefined,
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
    const usingFallbackKey = !providerKeys?.length;

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

        const ownerEmail = projectOwner?.user?.email;

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
  ): Promise<ThreadMessageDto> {
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
      if (!suggestions || suggestions.length === 0) {
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

      if (!suggestions.suggestions || suggestions.suggestions.length === 0) {
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
    stream?: boolean,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    const db = this.getDb();

    await this.checkMessageLimit(projectId);

    const thread = await this.ensureThread(
      projectId,
      unresolvedThreadId,
      advanceRequestDto.contextKey,
    );

    // Ensure only one request per thread adds its user message and continues
    const addedUserMessage = await addUserMessage(
      db,
      thread.id,
      advanceRequestDto,
      this.logger,
    );

    // Use the shared method to create the TamboBackend instance
    const tamboBackend = await this.createHydraBackendForThread(thread.id, {
      version: "v2",
    });

    const availableComponentMap: Record<string, AvailableComponentDto> =
      advanceRequestDto.availableComponents?.reduce((acc, component) => {
        acc[component.name] = component;
        return acc;
      }, {}) ?? {};

    // Log available components
    this.logger.log(
      `Available components for thread ${thread.id}: ${JSON.stringify(
        Object.keys(availableComponentMap),
      )}`,
    );

    // Log detailed component information
    if (advanceRequestDto?.availableComponents?.length) {
      this.logger.log(
        `Component details for thread ${thread.id}: ${JSON.stringify(
          advanceRequestDto.availableComponents.map((comp) => ({
            name: comp.name,
            description: comp.description,
            contextTools: comp.contextTools?.length || 0,
          })),
        )}`,
      );
    }

    // TODO: Let tambobackend package handle different message types internally
    const messages = await this.getMessages(thread.id, true);
    if (messages.length === 0) {
      throw new Error("No messages found");
    }
    const latestMessage = messages[messages.length - 1];

    if (stream) {
      return await this.handleStreamingResponse(
        projectId,
        thread.id,
        db,
        tamboBackend,
        messages,
        latestMessage,
        addedUserMessage,
        advanceRequestDto,
        availableComponentMap,
      );
    }

    const systemTools = await getSystemTools(db, projectId);

    const responseMessage = await this.processResponse(
      latestMessage,
      db,
      thread.id,
      advanceRequestDto,
      tamboBackend,
      messages,
      systemTools,
      availableComponentMap,
    );
    const {
      responseMessageDto,
      resultingGenerationStage,
      resultingStatusMessage,
    } = await addAssistantResponse(
      db,
      thread.id,
      addedUserMessage,
      responseMessage,
      this.logger,
    );

    const toolCallRequest = responseMessage.toolCallRequest;
    if (
      toolCallRequest &&
      toolCallRequest.toolName in systemTools.mcpToolSources
    ) {
      return await this.handleSystemToolCall(
        toolCallRequest,
        systemTools,
        responseMessage,
        advanceRequestDto,
        projectId,
        thread.id,
      );
    }

    return {
      responseMessageDto,
      generationStage: resultingGenerationStage,
      statusMessage: resultingStatusMessage,
    };
  }

  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    systemTools: SystemTools,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    const toolSource = systemTools.mcpToolSources[toolCallRequest.toolName];

    const result = await toolSource.callTool(
      toolCallRequest.toolName,
      Object.fromEntries(
        toolCallRequest.parameters.map((p) => [
          p.parameterName,
          p.parameterValue,
        ]),
      ),
    );

    const messageWithToolResponse: AdvanceThreadDto = {
      messageToAppend: {
        actionType: ActionType.ToolResponse,
        component: componentDecision,
        role: MessageRole.Tool,
        content: [
          {
            type: ContentPartType.Text,
            text: JSON.stringify(result),
          },
        ],
      },
      additionalContext: advanceRequestDto.additionalContext,
      availableComponents: advanceRequestDto.availableComponents,
      contextKey: advanceRequestDto.contextKey,
    };

    return await this.advanceThread(
      projectId,
      messageWithToolResponse,
      threadId,
      false,
    );
  }

  private async processResponse(
    latestMessage: ThreadMessageDto,
    db: HydraDatabase,
    threadId: string,
    advanceRequestDto: AdvanceThreadDto,
    tamboBackend: TamboBackend,
    messages: ThreadMessageDto[],
    systemTools: SystemTools,
    availableComponentMap: Record<string, AvailableComponentDto>,
  ): Promise<LegacyComponentDecision> {
    let responseMessage: LegacyComponentDecision;
    // Not streaming, so we can just return the response message
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

      const componentDef = advanceRequestDto.availableComponents?.find(
        (c) => c.name === latestMessage.component?.componentName,
      );
      if (!componentDef) {
        throw new Error("Component definition not found");
      }

      responseMessage = await tamboBackend.hydrateComponentWithData(
        threadMessageDtoToThreadMessage(messages),
        componentDef,
        toolResponse,
        latestMessage.tool_call_id,
        threadId,
        systemTools,
      );
    } else {
      await updateGenerationStage(
        db,
        threadId,
        GenerationStage.CHOOSING_COMPONENT,
        `Choosing component...`,
      );

      responseMessage = await tamboBackend.generateComponent(
        threadMessageDtoToThreadMessage(messages),
        availableComponentMap,
        threadId,
        systemTools,
        false,
        advanceRequestDto.additionalContext,
      );
    }
    return responseMessage;
  }

  private async handleStreamingResponse(
    projectId: string,
    threadId: string,
    db: HydraDatabase,
    tamboBackend: TamboBackend,
    messages: ThreadMessageDto[],
    latestMessage: ThreadMessageDto,
    addedUserMessage: ThreadMessageDto,
    advanceRequestDto: AdvanceThreadDto,
    availableComponentMap: Record<string, AvailableComponentDto>,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>> {
    const systemTools = await getSystemTools(db, projectId);
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

      const componentDef = advanceRequestDto.availableComponents?.find(
        (c) => c.name === latestMessage.component?.componentName,
      );
      if (!componentDef) {
        throw new Error("Component definition not found");
      }

      const streamedResponseMessage =
        await tamboBackend.hydrateComponentWithData(
          threadMessageDtoToThreadMessage(messages),
          componentDef,
          toolResponse,
          latestMessage.tool_call_id,
          threadId,
          systemTools,
          true,
        );
      return this.handleAdvanceThreadStream(
        projectId,
        threadId,
        streamedResponseMessage,
        addedUserMessage,
        systemTools,
        advanceRequestDto,
        latestMessage.tool_call_id,
      );
    }

    await updateGenerationStage(
      db,
      threadId,
      GenerationStage.CHOOSING_COMPONENT,
      `Choosing component...`,
    );

    const streamedResponseMessage = await tamboBackend.generateComponent(
      threadMessageDtoToThreadMessage(messages),
      availableComponentMap,
      threadId,
      systemTools,
      true,
      advanceRequestDto.additionalContext,
    );

    return this.handleAdvanceThreadStream(
      projectId,
      threadId,
      streamedResponseMessage,
      addedUserMessage,
      systemTools,
      advanceRequestDto,
    );
  }

  private async *handleAdvanceThreadStream(
    projectId: string,
    threadId: string,
    stream: AsyncIterableIterator<LegacyComponentDecision>,
    addedUserMessage: ThreadMessageDto,
    systemTools: SystemTools,
    originalRequest: AdvanceThreadDto,
    toolCallId?: string,
  ): AsyncIterableIterator<AdvanceThreadResponseDto> {
    let finalResponse:
      | {
          responseMessageDto: ThreadMessageDto;
          generationStage: GenerationStage;
          statusMessage: string;
        }
      | undefined;
    let lastUpdateTime = 0;
    const updateIntervalMs = 500;

    await updateGenerationStage(
      this.getDb(),
      threadId,
      GenerationStage.STREAMING_RESPONSE,
      `Streaming response...`,
    );

    const inProgressMessage = await addInProgressMessage(
      this.getDb(),
      threadId,
      addedUserMessage,
      toolCallId,
      this.logger,
    );

    for await (const chunk of stream) {
      finalResponse = {
        responseMessageDto: {
          ...inProgressMessage,
          content: [
            {
              type: ContentPartType.Text,
              text:
                chunk.message.length > 0
                  ? chunk.message
                  : "streaming in progress...",
            },
          ],
          component: chunk,
          actionType: chunk.toolCallRequest ? ActionType.ToolCall : undefined,
          toolCallRequest: chunk.toolCallRequest,
          // toolCallId is set when streaming the response to a tool response
          // chunk.toolCallId is set when streaming the response to a component
          tool_call_id: toolCallId ?? chunk.toolCallId,
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        statusMessage: `Streaming response...`,
      };
      const currentTime = Date.now();

      // Update db message on interval
      if (currentTime - lastUpdateTime >= updateIntervalMs) {
        await updateMessage(
          this.getDb(),
          inProgressMessage.id,
          finalResponse!.responseMessageDto,
        );
        lastUpdateTime = currentTime;
      }

      yield {
        responseMessageDto: finalResponse.responseMessageDto,
        generationStage: GenerationStage.STREAMING_RESPONSE,
        statusMessage: `Streaming response...`,
      };
    }

    if (!finalResponse) {
      // should never happen!
      console.error(
        "no final response while streaming! this should never happen!",
      );
      return;
    }
    const { resultingGenerationStage, resultingStatusMessage } =
      await finishInProgressMessage(
        this.getDb(),
        threadId,
        addedUserMessage,
        inProgressMessage,
        finalResponse,
        this.logger,
      );
    const toolCallRequest = finalResponse.responseMessageDto.toolCallRequest;
    const componentDecision = finalResponse.responseMessageDto.component;
    if (
      componentDecision &&
      toolCallRequest &&
      toolCallRequest.toolName in systemTools.mcpToolSources
    ) {
      return await this.handleSystemToolCall(
        toolCallRequest,
        systemTools,
        componentDecision,
        originalRequest,
        projectId,
        threadId,
      );
    }

    yield {
      responseMessageDto: finalResponse.responseMessageDto,
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
    if (!providerKeys?.length) {
      const fallbackKey = this.configService.get("FALLBACK_OPENAI_API_KEY");
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

function mapSuggestionToDto(suggestion: schema.DBSuggestion): SuggestionDto {
  return {
    id: suggestion.id,
    messageId: suggestion.messageId,
    title: suggestion.title,
    detailedSuggestion: suggestion.detailedSuggestion,
  };
}
