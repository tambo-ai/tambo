import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/components/guards/apikey.guard';
import { AddProviderKeyRequest } from './dto/add-provider-key.dto';
import {
  ProjectCreateRequest,
  ProjectResponse,
  ProjectUpdateRequest,
} from './dto/project-response.dto';
import { ProjectAccessOwnGuard } from './guards/project-access-own.guard';
import { ProjectsService } from './projects.service';

@ApiSecurity('apiKey')
// @UseGuards(AdminKeyGuard)
@Controller('projects')
@UseGuards(ApiKeyGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body() { projectName }: ProjectCreateRequest,
    @Req() request,
  ): Promise<ProjectResponse> {
    const createProjectDto = {
      name: projectName,
      userId: request.userId,
    };
    return await this.projectsService.create(createProjectDto);
  }

  @Get()
  async getCurrentProject(@Req() request) {
    return await this.projectsService.findOne(request.projectId);
  }

  @Get('user/')
  async findAllForUser(@Req() request) {
    return await this.projectsService.findAllForUser(request.userId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectResponse | undefined> {
    return await this.projectsService.findOne(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: ProjectUpdateRequest,
    @Req() request,
  ): Promise<ProjectResponse | undefined> {
    return await this.projectsService.update(id, {
      name: updateProjectDto.name,
      userId: request.userId,
    });
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<boolean> {
    return await this.projectsService.remove(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Put(':id/api-key/:name')
  async generateApiKey(
    @Param('id') id: string,
    @Param('name') name: string,
    @Req() request,
  ) {
    return await this.projectsService.generateApiKey(id, request.userId, name);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id/api-keys')
  async findAllApiKeys(@Param('id') id: string) {
    return await this.projectsService.findAllApiKeys(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id/api-key/:apiKeyId')
  async removeApiKey(
    @Param('id') id: string,
    @Param('apiKeyId') apiKeyId: string,
  ) {
    return await this.projectsService.removeApiKey(id, apiKeyId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Put(':id/provider-key')
  async addProviderKey(
    @Param('id') id: string,
    @Body() addProviderKeyDto: AddProviderKeyRequest,
    @Req() request,
  ): Promise<ProjectResponse> {
    const { providerName, providerKey } = addProviderKeyDto;
    if (!providerName || !providerKey) {
      throw new BadRequestException('Provider name and key are required');
    }
    return await this.projectsService.addProviderKey(
      id,
      providerName,
      providerKey,
      request.userId,
    );
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id/provider-keys')
  async findAllProviderKeys(@Param('id') id: string) {
    return await this.projectsService.findAllProviderKeys(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id/provider-key/:providerKeyId')
  async removeProviderKey(
    @Param('id') id: string,
    @Param('providerKeyId') providerKeyId: string,
  ): Promise<ProjectResponse> {
    return await this.projectsService.removeProviderKey(id, providerKeyId);
  }
}
