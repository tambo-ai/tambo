import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import {
  encryptApiKey,
  encryptProviderKey,
  hashKey,
} from 'src/common/key.utils';
import * as repositoryInterface from 'src/common/repository.interface';
import { APIKeyResponseDto } from './dto/api-key-response.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectDto } from './dto/project.dto';
import { ProviderKeyResponseDto } from './dto/provider-key-response.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject('ProjectsRepository')
    private readonly repository: repositoryInterface.RepositoryInterface<
      Project,
      ProjectDto
    >,
  ) {}

  async create(createProjectDto: ProjectDto): Promise<ProjectResponseDto> {
    const projectWithKeys = { ...createProjectDto, apiKeys: [] };
    return this.repository.create(projectWithKeys);
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    return this.repository.getAll();
  }

  async findAllForUser(userId: string): Promise<ProjectResponseDto[]> {
    return this.repository.getAllByField('userId', userId);
  }

  async findOne(id: string): Promise<ProjectResponseDto | null> {
    return this.repository.get(id);
  }

  async findOneWithKeys(id: string): Promise<Project | null> {
    return this.repository.get(id);
  }

  async update(
    id: string,
    updateProjectDto: ProjectDto,
  ): Promise<ProjectResponseDto | null> {
    const project = await this.repository.get(id);
    if (!project) {
      throw new Error('Project not found');
    }
    const updatedProject = {
      ...updateProjectDto,
      apiKeys: project.getApiKeys(),
    };
    return this.repository.update(id, updatedProject);
  }

  async remove(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async generateApiKey(
    projectId: string,
    userId: string,
    name: string,
  ): Promise<string> {
    const apiKey = randomBytes(16).toString('hex');
    const encryptedKey = encryptApiKey(projectId, apiKey);
    const hashedKey = hashKey(encryptedKey);

    const project = await this.repository.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.addApiKey(name, encryptedKey, hashedKey, userId);
    await this.repository.update(projectId, project);

    return encryptedKey;
  }

  async findAllApiKeys(projectId: string): Promise<APIKeyResponseDto[]> {
    const project = await this.repository.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const apiKeys = project.getApiKeys();
    const responseApiKeys: APIKeyResponseDto[] = apiKeys.map((apiKey) => {
      const response: APIKeyResponseDto = {
        ...apiKey,
        created: this.convertTimestampToDate(apiKey.created),
        lastUsed: this.convertTimestampToDate(apiKey.lastUsed),
      };
      return response;
    });

    return responseApiKeys;
  }

  convertTimestampToDate(timestamp) {
    if (timestamp && timestamp._seconds != null) {
      return new Date(
        timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000,
      );
    }
    return undefined;
  }

  async updateApiKeyLastUsed(
    projectId: string,
    hashedKey: string,
    lastUsed: Date,
  ) {
    const project = await this.repository.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const apiKeys = project.getApiKeys();
    const index = apiKeys.findIndex((apiKey) => apiKey.hashedKey === hashedKey);
    if (index === -1) {
      throw new Error('API key not found');
    }

    apiKeys[index].lastUsed = lastUsed;
    await this.repository.update(projectId, project);
  }

  async removeApiKey(projectId: string, apiKeyId: string): Promise<boolean> {
    const project = await this.repository.get(projectId);
    if (!project) {
      return false; // Project not found
    }

    const apiKeys = project.getApiKeys();
    const index = apiKeys.findIndex((apiKey) => apiKey.id === apiKeyId);
    if (index === -1) {
      return false; // API key not found
    }

    apiKeys.splice(index, 1);
    await this.repository.update(projectId, project);

    return true;
  }

  async validateApiKey(
    projectId: string,
    providedApiKey: string,
  ): Promise<boolean> {
    const hashedProvidedKey = createHash('sha256')
      .update(providedApiKey)
      .digest('hex');

    const project = await this.repository.get(projectId);
    if (!project) {
      return false; // Project not found
    }

    return project
      .getApiKeys()
      .some((apiKey) => apiKey.hashedKey === hashedProvidedKey);
  }

  async addProviderKey(
    projectId: string,
    providerName: string,
    providerKey: string,
  ) {
    const project = await this.repository.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const providerKeyEncrypted = encryptProviderKey(providerName, providerKey);
    project.addProviderKey(providerName, providerKeyEncrypted, providerKey);
    await this.repository.update(projectId, project);
    return project;
  }

  async findAllProviderKeys(
    projectId: string,
  ): Promise<ProviderKeyResponseDto[]> {
    const project = await this.repository.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    const providerKeys = project.getProviderKeys();
    return providerKeys;
  }

  async removeProviderKey(projectId: string, providerKeyId: string) {
    const project = await this.repository.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    project.removeProviderKey(providerKeyId);
    await this.repository.update(projectId, project);
    return project;
  }
}
