import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { MessageRole } from '@use-hydra-ai/db';
import {
  ChatMessage,
  ComponentDecision,
  HydraBackend,
} from '@use-hydra-ai/hydra-ai-server';
import { decryptProviderKey } from '../common/key.utils';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsService } from '../projects/projects.service';
import { ThreadsService } from '../threads/threads.service';
import { ComponentDecision as ComponentDecisionDto } from './dto/component-decision.dto';
import { GenerateComponentRequest } from './dto/generate-component.dto';
import { HydrateComponentRequest } from './dto/hydrate-component.dto';
import { ApiKeyGuard } from './guards/apikey.guard';

@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@Controller('components')
export class ComponentsController {
  constructor(
    private projectsService: ProjectsService,
    private threadsService: ThreadsService,
    private logger: CorrelationLoggerService,
  ) {}

  @Post('generate')
  async generateComponent(
    @Body() generateComponentDto: GenerateComponentRequest,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<ComponentDecisionDto> {
    const { messageHistory, availableComponents, threadId, contextKey } =
      generateComponentDto;
    if (!messageHistory?.length) {
      throw new BadRequestException(
        'Message history is required and cannot be empty',
      );
    }
    // TODO: this assumes that only the last message is new - if the payload has
    // additional messages that aren't previously present in the thread, should
    // we add them? Or perhaps this API should only accept a single message and get
    // the rest of the thread from the db.
    const lastMessageEntry = messageHistory[messageHistory.length - 1];
    this.logger.log(
      `generating component for project ${request.projectId}, with message: ${lastMessageEntry.message}`,
    );
    const projectId = request.projectId;
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
    const decryptedProviderKey = decryptProviderKey(providerKey);

    //TODO: Don't instantiate HydraBackend every request
    const hydraBackend = new HydraBackend(decryptedProviderKey.providerKey);

    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    const component = await hydraBackend.generateComponent(
      messageHistory,
      availableComponents ?? {},
      resolvedThreadId,
    );

    await this.addDecisionToThread(
      resolvedThreadId,
      component,
      lastMessageEntry,
    );

    return {
      ...component,
      threadId: resolvedThreadId,
    };
  }

  private async addDecisionToThread(
    threadId: string,
    component: ComponentDecision,
    messageEntry?: ChatMessage,
  ) {
    await this.threadsService.addMessage(threadId, {
      role: MessageRole.User,
      message: messageEntry?.message ?? '',
    });
    await this.threadsService.addMessage(threadId, {
      role: MessageRole.Hydra,
      message: component.message,
      // HACK: for now just jam the full component decision into the content
      component: component,
    });
  }

  @Post('hydrate')
  async hydrateComponent(
    @Body() hydrateComponentDto: HydrateComponentRequest,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<ComponentDecisionDto> {
    const {
      messageHistory = [],
      component,
      toolResponse,
      threadId,
      contextKey,
    } = hydrateComponentDto;
    const projectId = request.projectId;

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
    const decryptedProviderKey = decryptProviderKey(providerKey);

    const hydraBackend = new HydraBackend(decryptedProviderKey.providerKey);

    if (!component) {
      throw new BadRequestException('Component is required');
    }
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    const hydratedComponent = await hydraBackend.hydrateComponentWithData(
      messageHistory,
      component,
      toolResponse,
      resolvedThreadId,
    );

    const lastMessage = messageHistory[messageHistory.length - 1];

    await this.addDecisionToThread(
      resolvedThreadId,
      hydratedComponent,
      lastMessage,
    );

    this.logger.log(`hydrated component: ${JSON.stringify(hydratedComponent)}`);
    return {
      ...hydratedComponent,
      threadId: resolvedThreadId,
    };
  }

  private async ensureThread(
    projectId: string,
    threadId: string | undefined,
    contextKey: string | undefined,
  ) {
    // If the threadId is provided, ensure that the thread belongs to the project
    if (threadId) {
      await this.threadsService.ensureThreadByProjectId(threadId, projectId);
      // TODO: should we update contextKey?
      return threadId;
    }
    // If the threadId is not provided, create a new thread
    const newThread = await this.threadsService.createThread({
      projectId,
      contextKey,
    });
    return newThread.id;
  }
}
