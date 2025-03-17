import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ActionType,
  ChatCompletionContentPart,
  ComponentDecisionV2,
  ContentPartType,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from '@tambo-ai-cloud/core';
import type { HydraDatabase } from '@tambo-ai-cloud/db';
import { operations, schema } from '@tambo-ai-cloud/db';
import type { DBSuggestion } from '@tambo-ai-cloud/db/src/schema';
import { generateChainId, HydraBackend } from '@tambo-ai-cloud/hydra-ai-server';
import { eq } from 'drizzle-orm';
import { decryptProviderKey } from 'src/common/key.utils';
import { TRANSACTION } from 'src/common/middleware/db-transaction-middleware';
import { AvailableComponentDto } from 'src/components/dto/generate-component.dto';
import { ProjectsService } from 'src/projects/projects.service';
import { CorrelationLoggerService } from '../common/services/logger.service';
import {
  AdvanceThreadDto,
  AdvanceThreadResponseDto,
} from './dto/advance-thread.dto';
import {
  ChatCompletionContentPartDto,
  MessageRequest,
  ThreadMessageDto,
} from './dto/message.dto';
import { SuggestionDto } from './dto/suggestion.dto';
import { SuggestionsGenerateDto } from './dto/suggestions-generate.dto';
import { Thread, ThreadRequest, ThreadWithMessagesDto } from './dto/thread.dto';
import {
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from './types/errors';

@Injectable()
export class ThreadsService {
  constructor(
    @Inject(TRANSACTION)
    private readonly tx: HydraDatabase,
    private projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
  ) {}

  private async getHydraBackend(threadId: string): Promise<HydraBackend> {
    return await this.createHydraBackendForThread(threadId);
  }

  private async createHydraBackendForThread(
    threadId: string,
    options: { version?: 'v1' | 'v2' } = {},
  ): Promise<HydraBackend> {
    const chainId = await generateChainId(threadId);

    // Get the thread's project ID from the database
    const threadData = await this.tx.query.threads.findFirst({
      where: eq(schema.threads.id, threadId),
    });

    if (!threadData) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    // Get the provider key from the database
    const { providerKey } = await this.validateProjectAndProviderKeys(
      threadData.projectId,
    );

    // Use the provider key from the database instead of the environment variable
    return new HydraBackend(providerKey, chainId, options);
  }

  async createThread(createThreadDto: ThreadRequest): Promise<Thread> {
    const thread = await operations.createThread(this.tx, {
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
      this.tx,
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
    return await operations.countThreadsByProject(this.tx, projectId, params);
  }

  async findOne(id: string, projectId: string): Promise<ThreadWithMessagesDto> {
    const thread = await operations.getThreadForProjectId(
      this.tx,
      id,
      projectId,
    );
    if (!thread) {
      throw new NotFoundException('Thread not found');
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
    const thread = await operations.updateThread(this.tx, id, {
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
    return await operations.updateThread(this.tx, id, {
      generationStage,
      statusMessage,
    });
  }

  async remove(id: string) {
    return await operations.deleteThread(this.tx, id);
  }

  async addMessage(
    threadId: string,
    messageDto: MessageRequest,
  ): Promise<ThreadMessageDto> {
    const message = await operations.addMessage(this.tx, {
      threadId,
      role: messageDto.role,
      content: convertContentDtoToContentPart(messageDto.content),
      componentDecision: messageDto.component ?? undefined,
      metadata: messageDto.metadata,
      actionType: messageDto.actionType ?? undefined,
      toolCallRequest: messageDto.toolCallRequest ?? undefined,
      toolCallId: messageDto?.tool_call_id,
    });
    return {
      id: message.id,
      threadId,
      role: message.role,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      component: message.componentDecision ?? undefined,
      actionType: message.actionType ?? undefined,
      createdAt: message.createdAt,
      toolCallRequest: message.toolCallRequest ?? undefined,
      tool_call_id: message.toolCallId ?? undefined,
      componentState: message.componentState ?? {},
      // TODO: promote suggestionActions to the message level in the db, this is just
      // relying on the internal ComponentDecision type
      // suggestions: (message.componentDecision as ComponentDecision)
      //   ?.suggestedActions,
    };
  }

  async getMessages(
    threadId: string,
    includeInternal: boolean = false,
  ): Promise<ThreadMessageDto[]> {
    const messages = await operations.getMessages(
      this.tx,
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

  async updateMessage(
    messageId: string,
    messageDto: MessageRequest,
  ): Promise<ThreadMessageDto> {
    const message = await operations.updateMessage(this.tx, messageId, {
      content: convertContentDtoToContentPart(messageDto.content),
      componentDecision: messageDto.component ?? undefined,
      metadata: messageDto.metadata,
      actionType: messageDto.actionType ?? undefined,
      toolCallRequest: messageDto.toolCallRequest,
      toolCallId: messageDto.tool_call_id ?? undefined,
    });
    return {
      ...message,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      toolCallRequest: message.toolCallRequest ?? undefined,
      tool_call_id: message.toolCallId ?? undefined,
      actionType: message.actionType ?? undefined,
      componentState: message.componentState ?? {},
    };
  }

  async deleteMessage(messageId: string) {
    await operations.deleteMessage(this.tx, messageId);
  }

  async ensureThreadByProjectId(threadId: string, projectId: string) {
    await operations.ensureThreadByProjectId(this.tx, threadId, projectId);
  }

  private async getMessage(messageId: string) {
    try {
      const message = await operations.getMessageWithAccess(this.tx, messageId);
      if (!message) {
        this.logger.warn(`Message not found: ${messageId}`);
        throw new InvalidSuggestionRequestError('Message not found');
      }
      return message;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting message: ${errorMessage}`, errorStack);
      throw new InvalidSuggestionRequestError('Failed to retrieve message');
    }
  }

  async getSuggestions(messageId: string): Promise<SuggestionDto[]> {
    this.logger.log(`Getting suggestions for message: ${messageId}`);

    await this.getMessage(messageId);

    try {
      const suggestions = await operations.getSuggestions(this.tx, messageId);
      if (!suggestions || suggestions.length === 0) {
        throw new SuggestionNotFoundException(messageId);
      }

      this.logger.log(
        `Found ${suggestions.length} suggestions for message: ${messageId}`,
      );
      return suggestions.map(this.mapSuggestionToDto);
    } catch (error: unknown) {
      if (error instanceof SuggestionNotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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

      const hydraBackend = await this.getHydraBackend(message.threadId);
      const suggestions = await hydraBackend.generateSuggestions(
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
        this.tx,
        suggestions.suggestions.map((suggestion) => ({
          messageId,
          title: suggestion.title,
          detailedSuggestion: suggestion.detailedSuggestion,
        })),
      );

      this.logger.log(
        `Generated ${savedSuggestions.length} suggestions for message: ${messageId}`,
      );
      return savedSuggestions.map(this.mapSuggestionToDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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

  private mapSuggestionToDto(suggestion: DBSuggestion): SuggestionDto {
    return {
      id: suggestion.id,
      messageId: suggestion.messageId,
      title: suggestion.title,
      detailedSuggestion: suggestion.detailedSuggestion,
    };
  }
  async updateComponentState(
    messageId: string,
    newState: Record<string, unknown>,
  ): Promise<ThreadMessageDto> {
    const message = await operations.updateMessageComponentState(
      this.tx,
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
   * @param threadId - The thread ID.
   * @param advanceRequestDto - The advance request DTO, including optional message to append, context key, and available components.
   * @param stream - Whether to stream the response.
   * @returns The the generated response thread message, generation stage, and status message.
   */
  async advanceThread(
    projectId: string,
    advanceRequestDto: AdvanceThreadDto,
    threadId?: string,
    stream?: boolean,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    const thread = await this.ensureThread(projectId, threadId, undefined);
    await this.addMessage(thread.id, advanceRequestDto.messageToAppend);

    // Use the shared method to create the HydraBackend instance
    const hydraBackend = await this.createHydraBackendForThread(thread.id, {
      version: 'v2',
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
      throw new Error('No messages found');
    }
    const latestMessage = messages[messages.length - 1];

    let responseMessage: LegacyComponentDecision;

    if (latestMessage.role === MessageRole.Tool) {
      await this.updateGenerationStage(
        thread.id,
        GenerationStage.HYDRATING_COMPONENT,
        `Hydrating ${latestMessage.component?.componentName}...`,
      );
      // Since we don't a store tool responses in the db, assumes that the tool response is the messageToAppend
      const toolResponse = advanceRequestDto.messageToAppend.toolResponse;
      if (!toolResponse) {
        throw new Error('No tool response found');
      }

      const componentDef = advanceRequestDto.availableComponents?.find(
        (c) => c.name === latestMessage.component?.componentName,
      );
      if (!componentDef) {
        throw new Error('Component definition not found');
      }
      if (stream) {
        const streamedResponseMessage =
          await hydraBackend.hydrateComponentWithData(
            threadMessageDtoToThreadMessage(messages),
            componentDef,
            toolResponse,
            latestMessage.tool_call_id,
            thread.id,
            true,
          );
        return this.handleAdvanceThreadStream(
          thread.id,
          streamedResponseMessage,
          latestMessage.tool_call_id,
        );
      } else {
        responseMessage = await hydraBackend.hydrateComponentWithData(
          threadMessageDtoToThreadMessage(messages),
          componentDef,
          toolResponse,
          latestMessage.tool_call_id,
          thread.id,
        );
      }
    } else {
      await this.updateGenerationStage(
        thread.id,
        GenerationStage.CHOOSING_COMPONENT,
        `Choosing component...`,
      );
      if (stream) {
        const streamedResponseMessage = await hydraBackend.generateComponent(
          threadMessageDtoToThreadMessage(messages),
          availableComponentMap,
          thread.id,
          true,
        );
        return this.handleAdvanceThreadStream(
          thread.id,
          streamedResponseMessage,
        );
      } else {
        responseMessage = await hydraBackend.generateComponent(
          threadMessageDtoToThreadMessage(messages),
          availableComponentMap,
          thread.id,
        );
      }
    }

    const responseMessageDto = await this.addResponseToThread(
      thread.id,
      responseMessage as LegacyComponentDecision,
    );
    const resultingGenerationStage = responseMessageDto.toolCallRequest
      ? GenerationStage.FETCHING_CONTEXT
      : GenerationStage.COMPLETE;
    const resultingStatusMessage = responseMessageDto.toolCallRequest
      ? `Fetching context...`
      : `Generation complete`;
    await this.updateGenerationStage(
      thread.id,
      resultingGenerationStage,
      resultingStatusMessage,
    );

    return {
      responseMessageDto,
      generationStage: resultingGenerationStage,
      statusMessage: resultingStatusMessage,
    };
  }

  private async *handleAdvanceThreadStream(
    threadId: string,
    stream: AsyncIterableIterator<LegacyComponentDecision>,
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

    await this.updateGenerationStage(
      threadId,
      GenerationStage.STREAMING_RESPONSE,
      `Streaming response...`,
    );

    const inProgressMessage = await this.addMessage(threadId, {
      role: MessageRole.Hydra,
      content: [
        { type: ContentPartType.Text, text: 'streaming in progress...' },
      ],
      component: undefined,
      actionType: undefined,
      toolCallRequest: undefined,
      tool_call_id: toolCallId,
      metadata: {},
    });

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
                  : 'streaming in progress...',
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
        await this.updateMessage(
          inProgressMessage.id,
          finalResponse.responseMessageDto,
        );
        lastUpdateTime = currentTime;
      }

      yield {
        responseMessageDto: finalResponse.responseMessageDto,
        generationStage: GenerationStage.STREAMING_RESPONSE,
        statusMessage: `Streaming response...`,
      };
    }

    if (finalResponse) {
      await this.updateMessage(
        inProgressMessage.id,
        finalResponse.responseMessageDto,
      );
      const resultingGenerationStage = finalResponse.responseMessageDto
        .toolCallRequest
        ? GenerationStage.FETCHING_CONTEXT
        : GenerationStage.COMPLETE;
      const resultingStatusMessage = finalResponse.responseMessageDto
        .toolCallRequest
        ? `Fetching context...`
        : `Complete`;
      await this.updateGenerationStage(
        threadId,
        resultingGenerationStage,
        resultingStatusMessage,
      );
      yield {
        responseMessageDto: finalResponse.responseMessageDto,
        generationStage: resultingGenerationStage,
        statusMessage: resultingStatusMessage,
      };
    }
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
      throw new Error('Thread ID is required, and cannot be created');
    }

    // If the threadId is not provided, create a new thread
    const newThread = await this.createThread({
      projectId,
      contextKey,
    });
    return newThread;
  }

  private async validateProjectAndProviderKeys(projectId: string) {
    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const providerKeys = project.getProviderKeys();
    if (!providerKeys?.length) {
      throw new NotFoundException('No provider keys found for project');
    }
    const providerKey =
      providerKeys[providerKeys.length - 1].providerKeyEncrypted; // Use the last provider key
    if (!providerKey) {
      throw new NotFoundException('No provider key found for project');
    }
    return decryptProviderKey(providerKey);
  }

  private async addResponseToThread(
    threadId: string,
    component: LegacyComponentDecision,
  ) {
    return await this.addMessage(threadId, {
      role: MessageRole.Hydra,
      content: [{ type: ContentPartType.Text, text: component.message }],
      component: component,
      actionType: component.toolCallRequest ? ActionType.ToolCall : undefined,
      toolCallRequest: component.toolCallRequest,
      tool_call_id: component.toolCallRequest?.tool_call_id,
    });
  }
}

function convertContentDtoToContentPart(
  content: string | ChatCompletionContentPartDto[],
): ChatCompletionContentPart[] {
  if (!Array.isArray(content)) {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content.map((part): ChatCompletionContentPart => {
    switch (part.type) {
      case ContentPartType.Text:
        if (!part.text) {
          throw new Error('Text content is required for text type');
        }
        return {
          type: ContentPartType.Text,
          text: part.text,
        };
      case ContentPartType.ImageUrl:
        return {
          type: ContentPartType.ImageUrl,
          image_url: part.image_url ?? {
            url: '',
            detail: 'auto',
          },
        };
      case ContentPartType.InputAudio:
        return {
          type: ContentPartType.InputAudio,
          input_audio: part.input_audio ?? {
            data: '',
            format: 'wav',
          },
        };
      default:
        throw new Error(`Unknown content part type: ${part.type}`);
    }
  });
}

function threadMessageDtoToThreadMessage(
  messages: ThreadMessageDto[],
): ThreadMessage[] {
  return messages.map((message) => ({
    ...message,
    content: convertContentDtoToContentPart(message.content),
  }));
}

function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === 'string') {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part as ChatCompletionContentPartDto[];
}
