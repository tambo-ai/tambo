import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { HydraDatabase } from '@use-hydra-ai/db';
import { operations } from '@use-hydra-ai/db';
import { Message, MessageRequest } from './dto/message.dto';
import { Thread, ThreadRequest } from './dto/thread.dto';

@Injectable()
export class ThreadsService {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDatabase,
  ) {}

  async createThread(createThreadDto: ThreadRequest) {
    return operations.createThread(this.db, {
      projectId: createThreadDto.projectId,
      contextKey: createThreadDto.contextKey,
      metadata: createThreadDto.metadata,
    });
  }

  async findAllForProject(
    projectId: string,
    { contextKey }: { contextKey?: string } = {},
  ) {
    return operations.getThreadsByProject(this.db, projectId, { contextKey });
  }

  async findOne(id: string): Promise<Thread> {
    const thread = await operations.getThread(this.db, id);
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
  ): Promise<Message> {
    const message = await operations.addMessage(this.db, {
      threadId,
      role: messageDto.role,
      content: messageDto.message,
      component: messageDto.component ?? undefined,
      metadata: messageDto.metadata,
    });
    return {
      id: message.id,
      role: message.role,
      content: message.content as string,
      metadata: message.metadata ?? undefined,
      component: message.componentDecision ?? undefined,
    };
  }

  async getMessages(threadId: string): Promise<Message[]> {
    const messages = await operations.getMessages(this.db, threadId);
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content as string,
      metadata: message.metadata ?? undefined,
      component: message.componentDecision ?? undefined,
    }));
  }

  async deleteMessage(messageId: string) {
    await operations.deleteMessage(this.db, messageId);
  }
}
