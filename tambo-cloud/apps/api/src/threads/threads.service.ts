import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChatCompletionContentPart as ChatCompletionContentPartInterface,
  ContentPartType,
} from '@use-hydra-ai/core';
import type { HydraDatabase } from '@use-hydra-ai/db';
import { operations } from '@use-hydra-ai/db';
import {
  AudioFormat,
  ChatCompletionContentPart,
  ImageDetail,
  MessageRequest,
  ThreadMessage,
} from './dto/message.dto';
import { Thread, ThreadRequest } from './dto/thread.dto';

@Injectable()
export class ThreadsService {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDatabase,
  ) {}

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
    return operations.updateThread(this.db, id, {
      contextKey: updateThreadDto.contextKey,
      metadata: updateThreadDto.metadata,
    });
  }

  async remove(id: string) {
    return operations.deleteThread(this.db, id);
  }

  async addMessage(
    threadId: string,
    messageDto: MessageRequest,
  ): Promise<ThreadMessage> {
    const message = await operations.addMessage(this.db, {
      threadId,
      role: messageDto.role,
      content: convertContentDtoToContentPart(messageDto.content),
      componentDecision: messageDto.component ?? undefined,
      metadata: messageDto.metadata,
      actionType: messageDto.actionType ?? undefined,
    });
    return {
      id: message.id,
      role: message.role,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      component: message.componentDecision ?? undefined,
      actionType: message.actionType ?? undefined,
    };
  }

  async getMessages(threadId: string): Promise<ThreadMessage[]> {
    const messages = await operations.getMessages(this.db, threadId);
    return messages.map(
      (message): ThreadMessage => ({
        id: message.id,
        role: message.role,
        content: convertContentPartToDto(message.content),
        metadata: message.metadata ?? undefined,
        component: message.componentDecision ?? undefined,
        actionType: message.actionType ?? undefined,
      }),
    );
  }

  async deleteMessage(messageId: string) {
    await operations.deleteMessage(this.db, messageId);
  }

  async ensureThreadByProjectId(threadId: string, projectId: string) {
    await operations.ensureThreadByProjectId(this.db, threadId, projectId);
  }
}

function convertContentDtoToContentPart(
  content: string | ChatCompletionContentPart[],
): ChatCompletionContentPartInterface[] {
  if (!Array.isArray(content)) {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content.map((part): ChatCompletionContentPartInterface => {
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
  part: ChatCompletionContentPartInterface[] | string,
): ChatCompletionContentPart[] {
  if (typeof part === 'string') {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part.map((part): ChatCompletionContentPart => {
    switch (part.type) {
      case ContentPartType.Text:
        return { type: ContentPartType.Text, text: part.text ?? '' };
      case ContentPartType.ImageUrl:
        return {
          type: ContentPartType.ImageUrl,
          image_url: part.image_url
            ? {
                url: part.image_url.url,
                detail: part.image_url.detail as ImageDetail,
              }
            : undefined,
        };
      case ContentPartType.InputAudio:
        return {
          type: ContentPartType.InputAudio,
          input_audio: part.input_audio
            ? {
                data: part.input_audio.data,
                format: part.input_audio.format as AudioFormat,
              }
            : undefined,
        };
      default:
        throw new Error(`Unknown content part type: ${part.type}`);
    }
  });
}
