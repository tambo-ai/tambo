import { Inject, Injectable } from '@nestjs/common';
import { hideApiKey } from '@use-hydra-ai/core';
import { HydraTransaction, schema } from '@use-hydra-ai/db';
import { createHash, randomBytes } from 'crypto';
import { and, eq } from 'drizzle-orm';
import {
  encryptApiKey,
  encryptProviderKey,
  hashKey,
} from '../common/key.utils';
import { APIKeyResponseDto } from './dto/api-key-response.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectDto } from './dto/project.dto';
import { ProviderKeyResponseDto } from './dto/provider-key-response.dto';
import { APIKey } from './entities/api-key.entity';
import { Project } from './entities/project.entity';
import { ProviderKey } from './entities/provider-key.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraTransaction,
  ) {}

  async create(createProjectDto: ProjectDto): Promise<ProjectResponseDto> {
    if (!createProjectDto.userId) {
      throw new Error('User ID is required');
    }
    const [project] = await this.db
      .insert(schema.projects)
      .values({
        name: createProjectDto.name ?? 'New Project',
      })
      .returning();
    await this.db.insert(schema.projectMembers).values({
      projectId: project.id,
      userId: createProjectDto.userId,
      role: 'admin',
    });
    return {
      id: project.id,
      name: project.name,
      userId: createProjectDto.userId,
    };
  }

  async findAllForUser(userId: string): Promise<ProjectResponseDto[]> {
    const projects = await this.db.query.projects.findMany({
      where: (projects, { eq, inArray }) =>
        inArray(
          projects.id,
          this.db
            .select({ id: schema.projectMembers.projectId })
            .from(schema.projectMembers)
            .where(eq(schema.projectMembers.userId, userId)),
        ),
    });
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId,
    }));
  }

  async findOne(id: string): Promise<ProjectResponseDto | null> {
    const project = await this.db.query.projects.findFirst({
      where: (projects, { eq }) => eq(schema.projects.id, id),
      with: {
        members: true,
      },
    });
    if (!project) {
      return null;
    }
    return {
      id: project.id,
      name: project.name,
      userId: project.members[0].userId,
    };
  }

  async findOneWithKeys(id: string): Promise<Project | null> {
    const project = await this.db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, id),
      with: {
        members: true,
        apiKeys: true,
        providerKeys: true,
      },
    });
    if (!project) {
      return null;
    }
    const projectEntity = new Project();
    projectEntity.id = project.id;
    projectEntity.name = project.name;
    projectEntity.userId = project.members[0].userId;
    projectEntity.apiKeys = project.apiKeys.map(
      (apiKey): APIKey => ({
        id: apiKey.id,
        name: apiKey.name,
        hashedKey: apiKey.hashedKey,
        partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
        lastUsed: apiKey.lastUsedAt ?? undefined,
        created: apiKey.createdAt,
        createdByUserId: apiKey.createdByUserId,
      }),
    );
    projectEntity.providerKeys = project.providerKeys.map(
      (providerKey): ProviderKey => ({
        id: providerKey.id,
        providerName: providerKey.providerName,
        providerKeyEncrypted: providerKey.providerKeyEncrypted,
        partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
      }),
    );
    return projectEntity;
  }

  async update(
    id: string,
    updateProjectDto: ProjectDto,
  ): Promise<ProjectResponseDto | null> {
    const updatedProjects = await this.db
      .update(schema.projects)
      .set({
        name: updateProjectDto.name,
      })
      .where(eq(schema.projects.id, id))
      .returning();

    if (!updatedProjects.length) {
      return null;
    }
    return {
      id: updatedProjects[0].id,
      name: updatedProjects[0].name,
      userId: updateProjectDto.userId,
    };
  }

  async remove(id: string): Promise<boolean> {
    const row = await this.db
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning();
    return row.length > 0;
  }

  async generateApiKey(
    projectId: string,
    userId: string,
    name: string,
  ): Promise<string> {
    const apiKey = randomBytes(16).toString('hex');
    const encryptedKey = encryptApiKey(projectId, apiKey);
    const hashedKey = hashKey(encryptedKey);
    const project = await this.findOneWithKeys(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    project.addApiKey(name, encryptedKey, hashedKey, userId);
    await this.db.insert(schema.apiKeys).values({
      projectId,
      name,
      hashedKey,
      createdByUserId: userId,
      partiallyHiddenKey: hideApiKey(encryptedKey),
    });

    return encryptedKey;
  }

  async findAllApiKeys(projectId: string): Promise<APIKeyResponseDto[]> {
    const project = await this.findOneWithKeys(projectId);
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
    const apiKeys = await this.db
      .update(schema.apiKeys)
      .set({
        lastUsedAt: lastUsed,
      })
      .where(
        and(
          eq(schema.apiKeys.hashedKey, hashedKey),
          eq(schema.apiKeys.projectId, projectId),
        ),
      )
      .returning();
    if (!apiKeys.length) {
      throw new Error('API Key not found');
    }
  }

  async removeApiKey(projectId: string, apiKeyId: string): Promise<boolean> {
    const apiKeys = await this.db
      .delete(schema.apiKeys)
      .where(eq(schema.apiKeys.id, apiKeyId))
      .returning();
    if (!apiKeys.length) {
      return false;
    }
    return true;
  }

  async validateApiKey(
    projectId: string,
    providedApiKey: string,
  ): Promise<boolean> {
    const hashedProvidedKey = createHash('sha256')
      .update(providedApiKey)
      .digest('hex');

    const apiKeys = await this.db
      .select()
      .from(schema.apiKeys)
      .where(
        and(
          eq(schema.apiKeys.hashedKey, hashedProvidedKey),
          eq(schema.apiKeys.projectId, projectId),
        ),
      );
    if (!apiKeys.length) {
      return false;
    }

    return true;
  }

  async addProviderKey(
    projectId: string,
    providerName: string,
    providerKey: string,
    userId: string,
  ): Promise<ProjectResponseDto | null> {
    const providerKeyEncrypted = encryptProviderKey(providerName, providerKey);
    await this.db.insert(schema.apiKeys).values({
      projectId,
      name: providerName,
      hashedKey: providerKeyEncrypted,
      partiallyHiddenKey: hideApiKey(providerKey),
      createdByUserId: userId,
    });
    return this.findOneWithKeys(projectId);
  }

  async findAllProviderKeys(
    projectId: string,
  ): Promise<ProviderKeyResponseDto[]> {
    const project = await this.findOneWithKeys(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    const providerKeys = await this.db
      .select()
      .from(schema.providerKeys)
      .where(eq(schema.providerKeys.projectId, projectId));
    return providerKeys.map((providerKey) => ({
      id: providerKey.id,
      providerName: providerKey.providerName,
      partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
      providerKeyEncrypted: providerKey.providerKeyEncrypted,
    }));
  }

  async removeProviderKey(projectId: string, providerKeyId: string) {
    await this.db
      .delete(schema.providerKeys)
      .where(
        and(
          eq(schema.providerKeys.id, providerKeyId),
          eq(schema.providerKeys.projectId, projectId),
        ),
      );
    const project = await this.findOneWithKeys(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }
}
