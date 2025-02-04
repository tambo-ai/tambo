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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import {
  ProjectAccessOwnGuard,
  ProjectIdParameterKey,
} from '../projects/guards/project-access-own.guard';
import { Message, MessageRequest } from './dto/message.dto';
import { Thread, ThreadRequest } from './dto/thread.dto';
import { ThreadsService } from './threads.service';

@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(SupabaseAuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @ProjectIdParameterKey('projectId')
  @UseGuards(ProjectAccessOwnGuard)
  @Post()
  create(@Body() createThreadDto: ThreadRequest) {
    return this.threadsService.createThread(createThreadDto);
  }

  @ProjectIdParameterKey('projectId')
  @UseGuards(ProjectAccessOwnGuard)
  @Get('project/:projectId')
  @ApiQuery({ name: 'contextKey', required: false })
  findAllForProject(
    @Param('projectId') projectId: string,
    @Query('contextKey') contextKey?: string,
  ) {
    return this.threadsService.findAllForProject(projectId, { contextKey });
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() request): Promise<Thread> {
    if (!request.projectId) {
      // TODO: this is probably because the endpoint is using bearer auth
      // and not apiKey auth
      throw new BadRequestException('Project ID is required');
    }
    return this.threadsService.findOne(id, request.projectId);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateThreadDto: ThreadRequest,
  ): Promise<Thread> {
    const thread = await this.threadsService.update(id, updateThreadDto);
    return {
      ...thread,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
    };
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.threadsService.remove(id);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Post(':id/messages')
  addMessage(
    @Param('id') threadId: string,
    @Body() messageDto: MessageRequest,
  ) {
    return this.threadsService.addMessage(threadId, messageDto);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Get(':id/messages')
  getMessages(@Param('id') threadId: string): Promise<Message[]> {
    return this.threadsService.getMessages(threadId);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id/messages/:messageId')
  deleteMessage(
    @Param('id') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.threadsService.deleteMessage(messageId);
  }
}
