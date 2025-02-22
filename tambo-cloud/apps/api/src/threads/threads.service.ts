import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChatCompletionContentPart,
  ContentPartType,
  ThreadMessage,
} from '@use-hydra-ai/core';
import type { HydraDatabase } from '@use-hydra-ai/db';
import { operations } from '@use-hydra-ai/db';
import type { DBSuggestion } from '@use-hydra-ai/db/src/schema';
import {
  ChatMessage,
  HydraBackend,
  generateChainId,
} from '@use-hydra-ai/hydra-ai-server';
import { CorrelationLoggerService } from '../common/services/logger.service';
import {
  ChatCompletionContentPartDto,
  MessageRequest,
  ThreadMessageDto,
} from './dto/message.dto';
import { SuggestionDto } from './dto/suggestion.dto';
import { SuggestionsGenerateDto } from './dto/suggestions-generate.dto';
import { Thread, ThreadRequest } from './dto/thread.dto';
import {
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from './types/errors';

@Injectable()
export class ThreadsService {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDatabase,
    private readonly logger: CorrelationLoggerService,
    @Inject('OPENAI_API_KEY') private readonly openAiKey: string,
  ) {}

  private async getHydraBackend(threadId: string): Promise<HydraBackend> {
    const chainId = await generateChainId(threadId);
    return new HydraBackend(this.openAiKey, chainId);
  }

  private async convertThreadMessagesToLegacyThreadMessages(
    currentThreadMessages: ThreadMessageDto[],
  ): Promise<ChatMessage[]> {
    return currentThreadMessages.map((message) => ({
      sender: message.role === 'user' ? 'user' : 'hydra',
      message: message.content.map((part) => part.text ?? '').join(''),
    }));
  }

  async createThread(createThreadDto: ThreadRequest): Promise<Thread> {
    const thread = await operations.createThread(this.db, {
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
      projectId: thread.projectId,
    };
  }

  async findAllForProject(
    projectId: string,
    { contextKey }: { contextKey?: string } = {},
  ): Promise<Thread[]> {
    const threads = await operations.getThreadsByProject(this.db, projectId, {
      contextKey,
    });
    return threads.map((thread) => ({
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
      projectId: thread.projectId,
    }));
  }

  async findOne(id: string, projectId: string): Promise<Thread> {
    const thread = await operations.getThreadForProjectId(
      this.db,
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
      projectId: thread.projectId,
    };
  }

  async findOneByUserId(id: string, userId: string) {
    const thread = await operations.getThreadForUserId(this.db, id, userId);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    return thread;
  }

  async update(id: string, updateThreadDto: ThreadRequest) {
    return await operations.updateThread(this.db, id, {
      contextKey: updateThreadDto.contextKey,
      metadata: updateThreadDto.metadata,
    });
  }

  async remove(id: string) {
    return await operations.deleteThread(this.db, id);
  }

  async addMessage(
    threadId: string,
    messageDto: MessageRequest,
  ): Promise<ThreadMessageDto> {
    const message = await operations.addMessage(this.db, {
      threadId,
      role: messageDto.role,
      content: convertContentDtoToContentPart(messageDto.content),
      componentDecision: messageDto.component ?? undefined,
      metadata: messageDto.metadata,
      actionType: messageDto.actionType ?? undefined,
      toolCallRequest: messageDto.toolCallRequest ?? undefined,
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
      this.db,
      threadId,
      includeInternal,
    );
    return messages.map((message) => ({
      ...message,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      toolCallRequest: message.toolCallRequest ?? undefined,
      actionType: message.actionType ?? undefined,
    }));
  }

  async deleteMessage(messageId: string) {
    await operations.deleteMessage(this.db, messageId);
  }

  async ensureThreadByProjectId(threadId: string, projectId: string) {
    await operations.ensureThreadByProjectId(this.db, threadId, projectId);
  }

  private async getMessage(messageId: string) {
    try {
      const message = await operations.getMessageWithAccess(this.db, messageId);
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
      const suggestions = await operations.getSuggestions(this.db, messageId);
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
        this.db,
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

function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === 'string') {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part as ChatCompletionContentPartDto[];
}
