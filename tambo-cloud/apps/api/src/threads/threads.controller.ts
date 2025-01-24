import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import {
  ProjectAccessOwnGuard,
  ProjectIdParameterKey,
} from '../projects/guards/project-access-own.guard';
import { MessageDto } from './dto/message.dto';
import { ThreadDto } from './dto/thread.dto';
import { ThreadsService } from './threads.service';

@ApiBearerAuth()
@ApiSecurity('x-api-key')
@UseGuards(SupabaseAuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @ProjectIdParameterKey('projectId')
  @UseGuards(ProjectAccessOwnGuard)
  @Post()
  create(@Body() createThreadDto: ThreadDto) {
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
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateThreadDto: ThreadDto) {
    return this.threadsService.update(id, updateThreadDto);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.threadsService.remove(id);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Post(':id/messages')
  addMessage(@Param('id') threadId: string, @Body() messageDto: MessageDto) {
    return this.threadsService.addMessage(threadId, messageDto);
  }

  //   @UseGuards(ProjectAccessOwnGuard)
  @Get(':id/messages')
  getMessages(@Param('id') threadId: string) {
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
