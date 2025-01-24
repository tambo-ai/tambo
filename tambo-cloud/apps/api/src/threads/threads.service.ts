import { Inject, Injectable } from '@nestjs/common';
import type { HydraDatabase } from '@use-hydra-ai/db';
import { operations } from '@use-hydra-ai/db';
import { MessageDto } from './dto/message.dto';
import { ThreadDto } from './dto/thread.dto';

@Injectable()
export class ThreadsService {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDatabase,
  ) {}

  async createThread(createThreadDto: ThreadDto) {
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

  async update(id: string, updateThreadDto: ThreadDto) {
    return operations.updateThread(this.db, id, {
      contextKey: updateThreadDto.contextKey,
      metadata: updateThreadDto.metadata,
    });
  }

  async remove(id: string) {
    return operations.deleteThread(this.db, id);
  }

  async addMessage(threadId: string, messageDto: MessageDto) {
    return operations.addMessage(this.db, {
      threadId,
      role: messageDto.role,
      content: messageDto.message,
      component: messageDto.component,
      metadata: messageDto.metadata,
    });
  }

  async getMessages(threadId: string) {
    return operations.getMessages(this.db, threadId);
  }

  async deleteMessage(messageId: string) {
    return operations.deleteMessage(this.db, messageId);
  }
}
