import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { schema } from '@use-hydra-ai/db';
import { ComponentDecision, HydraBackend } from '@use-hydra-ai/hydra-ai-server';
import { decryptProviderKey } from '../common/key.utils';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsService } from '../projects/projects.service';
import { ThreadsService } from '../threads/threads.service';
import { GenerateComponentDto } from './dto/generate-component.dto';
import { HydrateComponentDto } from './dto/hydrate-component.dto';
import { ApiKeyGuard } from './guards/apikey.guard';

@ApiSecurity('x-api-key')
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
    @Body() generateComponentDto: GenerateComponentDto,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<ComponentDecision & { threadId: string }> {
    if (!generateComponentDto.messageHistory?.length) {
      throw new Error('Message history is required and cannot be empty');
    }

    this.logger.log(
      `generating component for project ${request.projectId}, with message: ${generateComponentDto.messageHistory[generateComponentDto.messageHistory.length - 1].message}`,
    );
    const projectId = request.projectId;
    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    const providerKeys = project.getProviderKeys();
    if (!providerKeys?.length) {
      throw new Error('No provider keys found for project');
    }
    const providerKey =
      providerKeys[providerKeys.length - 1].providerKeyEncrypted; // Use the last provider key
    if (!providerKey) {
      throw new Error('No provider key found for project');
    }
    const decryptedProviderKey = decryptProviderKey(providerKey);

    //TODO: Don't instantiate HydraBackend every request
    const hydraBackend = new HydraBackend(decryptedProviderKey.providerKey);

    const component = await hydraBackend.generateComponent(
      generateComponentDto.messageHistory,
      generateComponentDto.availableComponents ?? {},
    );

    const resolvedThreadId: string = await this.addDecisionToThread(
      projectId,
      generateComponentDto.threadId,
      component,
    );

    return {
      ...component,
      threadId: resolvedThreadId,
    };
  }

  private async addDecisionToThread(
    projectId: string,
    threadId: string | undefined,
    component: ComponentDecision,
  ) {
    let resolvedThreadId: string;
    if (threadId) {
      resolvedThreadId = threadId;
    } else {
      const newThread = await this.threadsService.create({
        projectId,
      });
      resolvedThreadId = newThread.id;
    }
    await this.threadsService.addMessage(resolvedThreadId, {
      role: schema.MessageRole.Hydra,
      message: component.message,
      // HACK: for now just jam the full component decision into the content
      component: component as unknown as Record<string, unknown>,
    });
    return resolvedThreadId;
  }

  @Post('hydrate')
  async hydrateComponent(
    @Body() hydrateComponentDto: HydrateComponentDto,
    @Req() request, // Assumes the request object has the projectId
  ) {
    const projectId = request.projectId;

    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const providerKeys = project.getProviderKeys();
    if (!providerKeys?.length) {
      throw new Error('No provider keys found for project');
    }
    const providerKey =
      providerKeys[providerKeys.length - 1].providerKeyEncrypted; // Use the last provider key
    if (!providerKey) {
      throw new Error('No provider key found for project');
    }
    const decryptedProviderKey = decryptProviderKey(providerKey);

    const hydraBackend = new HydraBackend(decryptedProviderKey.providerKey);

    if (!hydrateComponentDto.component) {
      throw new Error('Component is required');
    }

    const hydratedComponent = await hydraBackend.hydrateComponentWithData(
      hydrateComponentDto.messageHistory ?? [],
      hydrateComponentDto.component,
      hydrateComponentDto.toolResponse,
    );

    const resolvedThreadId: string = await this.addDecisionToThread(
      projectId,
      hydrateComponentDto.threadId,
      hydratedComponent,
    );

    this.logger.log(`hydrated component: ${JSON.stringify(hydratedComponent)}`);
    return {
      ...hydratedComponent,
      threadId: resolvedThreadId,
    };
  }
}
