import { Inject, Injectable } from '@nestjs/common';
import type { HydraDatabase } from '@use-hydra-ai/db';
import { operations } from '@use-hydra-ai/db';
import { ComponentDecision } from '../components/dto/component-decision.dto';
import { Message, MessageRequest } from './dto/message.dto';
import { ThreadRequest } from './dto/thread.dto';

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

  async findOne(id: string) {
    return operations.getThread(this.db, id);
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
      metadata: message.metadata as Record<string, unknown>,
      component: message.componentDecision as ComponentDecision,
    };
  }

  async getMessages(threadId: string): Promise<Message[]> {
    const messages = await operations.getMessages(this.db, threadId);
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content as string,
      metadata: message.metadata as Record<string, unknown>,
      component: message.componentDecision as ComponentDecision,
    }));
  }

  async deleteMessage(messageId: string) {
    return operations.deleteMessage(this.db, messageId);
  }
}
