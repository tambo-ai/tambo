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
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import { AddProviderKeyRequest } from './dto/add-provider-key.dto';
import { ProjectResponse } from './dto/project-response.dto';
import { ProjectAccessOwnGuard } from './guards/project-access-own.guard';
import { ValidUserGuard } from './guards/valid-user.guard';
import { ProjectsService } from './projects.service';

@ApiBearerAuth()
@ApiSecurity('apiKey')
// @UseGuards(AdminKeyGuard)
@UseGuards(SupabaseAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(ValidUserGuard)
  @Post()
  create(@Body() { projectName }, @Req() request) {
    const createProjectDto: ProjectResponse = {
      name: projectName,
      userId: request.userId,
    };
    return this.projectsService.create(createProjectDto);
  }

  @UseGuards(ValidUserGuard)
  @Get('user/')
  findAllForUser(@Req() request) {
    return this.projectsService.findAllForUser(request.userId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: ProjectResponse) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Put(':id/api-key/:name')
  generateApiKey(
    @Param('id') id: string,
    @Param('name') name: string,
    @Req() request,
  ) {
    return this.projectsService.generateApiKey(id, request.userId, name);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id/api-keys')
  findAllApiKeys(@Param('id') id: string) {
    return this.projectsService.findAllApiKeys(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id/api-key/:apiKeyId')
  removeApiKey(@Param('id') id: string, @Param('apiKeyId') apiKeyId: string) {
    return this.projectsService.removeApiKey(id, apiKeyId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Put(':id/provider-key')
  addProviderKey(
    @Param('id') id: string,
    @Body() addProviderKeyDto: AddProviderKeyRequest,
    @Req() request,
  ) {
    const { providerName, providerKey } = addProviderKeyDto;
    if (!providerName || !providerKey) {
      throw new BadRequestException('Provider name and key are required');
    }
    return this.projectsService.addProviderKey(
      id,
      providerName,
      providerKey,
      request.userId,
    );
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(':id/provider-keys')
  findAllProviderKeys(@Param('id') id: string) {
    return this.projectsService.findAllProviderKeys(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(':id/provider-key/:providerKeyId')
  removeProviderKey(
    @Param('id') id: string,
    @Param('providerKeyId') providerKeyId: string,
  ) {
    return this.projectsService.removeProviderKey(id, providerKeyId);
  }
}
