import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ComponentDecision, HydraBackend } from '@use-hydra-ai/hydra-ai-server';
import { decryptProviderKey } from '../common/key.utils';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsService } from '../projects/projects.service';
import { GenerateComponentDto } from './dto/generate-component.dto';
import { HydrateComponentDto } from './dto/hydrate-component.dto';
import { ApiKeyGuard } from './guards/apikey.guard';

@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('components')
export class ComponentsController {
  constructor(
    private projectsService: ProjectsService,
    private logger: CorrelationLoggerService,
  ) {}

  @Post('generate')
  async generateComponent(
    @Body() generateComponentDto: GenerateComponentDto,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<ComponentDecision> {
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
    this.logger.log(`generated component: ${JSON.stringify(component)}`);
    return component;
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
    this.logger.log(`hydrated component: ${JSON.stringify(hydratedComponent)}`);
    return hydratedComponent;
  }
}
