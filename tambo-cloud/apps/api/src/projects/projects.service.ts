import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { APIKeyResponse } from "./dto/api-key-response.dto";
import { ProjectResponse } from "./dto/project-response.dto";
import { ProviderKeyResponse } from "./dto/provider-key-response.dto";
import { Project } from "./entities/project.entity";

@Injectable()
export class ProjectsService {
  constructor(
    // @Inject(TRANSACTION)
    // private readonly tx: HydraTransaction,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly config: ConfigService,
  ) {}

  getDb() {
    // return this.tx ?? this.db;
    return this.db;
  }

  async create(createProjectDto: {
    name: string;
    userId: string;
  }): Promise<ProjectResponse> {
    if (!createProjectDto.userId) {
      throw new Error("User ID is required");
    }

    const project = await operations.createProject(this.getDb(), {
      name: createProjectDto.name ?? "New Project",
      userId: createProjectDto.userId,
    });

    return {
      id: project.id,
      name: project.name,
      userId: project.userId,
    };
  }

  async findAllForUser(userId: string): Promise<ProjectResponse[]> {
    const projects = await operations.getProjectsForUser(this.getDb(), userId);
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId,
    }));
  }

  async findOne(id: string): Promise<ProjectResponse | undefined> {
    const project = await operations.getProject(this.getDb(), id);
    if (!project || !project.members?.[0]) {
      return undefined;
    }
    return {
      id: project.id,
      name: project.name,
      userId: project.members[0].userId,
    };
  }

  async findOneWithKeys(id: string): Promise<Project | null> {
    const project = await operations.getProjectWithKeys(this.getDb(), id);
    if (!project || !project.members?.[0]) {
      return null;
    }
    if (project.id !== id) {
      console.warn(
        `[ProjectsService] Use of legacy project ID ${id} for project ${project.id}`,
      );
    }

    const projectEntity = new Project();
    projectEntity.id = project.id;
    projectEntity.name = project.name;
    projectEntity.userId = project.members[0].userId;
    projectEntity.apiKeys = (project.apiKeys ?? []).map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      hashedKey: apiKey.hashedKey,
      partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
      lastUsed: apiKey.lastUsedAt ?? undefined,
      created: apiKey.createdAt,
      createdByUserId: apiKey.createdByUserId,
    }));
    projectEntity.providerKeys = (project.providerKeys ?? []).map(
      (providerKey) => ({
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
    updateProjectDto: {
      name: string;
      userId: string;
    },
  ): Promise<ProjectResponse | undefined> {
    if (!updateProjectDto.name) {
      throw new Error("Project name is required");
    }

    const updated = await operations.updateProject(this.getDb(), id, {
      name: updateProjectDto.name,
    });
    if (!updated) {
      return undefined;
    }
    return {
      id: updated.id,
      name: updated.name,
      userId: updateProjectDto.userId,
    };
  }

  async remove(id: string): Promise<boolean> {
    return await operations.deleteProject(this.getDb(), id);
  }

  async generateApiKey(
    projectId: string,
    userId: string,
    name: string,
  ): Promise<string> {
    const apiKeySecret = this.config.getOrThrow("API_KEY_SECRET");
    return await operations.createApiKey(this.getDb(), apiKeySecret, {
      projectId,
      userId,
      name,
    });
  }

  async findAllApiKeys(projectId: string): Promise<APIKeyResponse[]> {
    const apiKeys = await operations.getApiKeys(this.getDb(), projectId);
    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      hashedKey: apiKey.hashedKey,
      partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
      created: apiKey.createdAt,
      lastUsed: apiKey.lastUsedAt ?? undefined,
      createdByUserId: apiKey.createdByUserId,
    }));
  }

  async updateApiKeyLastUsed(
    projectId: string,
    hashedKey: string,
    lastUsed: Date,
  ): Promise<void> {
    await operations.updateApiKeyLastUsed(this.getDb(), {
      projectId,
      hashedKey,
      lastUsed,
    });
  }

  async removeApiKey(projectId: string, apiKeyId: string): Promise<boolean> {
    return await operations.deleteApiKey(this.getDb(), projectId, apiKeyId);
  }

  async validateApiKey(
    projectId: string,
    providedApiKey: string,
  ): Promise<boolean> {
    return await operations.validateApiKey(
      this.getDb(),
      projectId,
      providedApiKey,
    );
  }

  async addProviderKey(
    projectId: string,
    providerName: string,
    providerKey: string,
    userId: string,
  ): Promise<ProjectResponse> {
    const providerKeySecret = this.config.getOrThrow("PROVIDER_KEY_SECRET");
    const result = await operations.addProviderKey(
      this.getDb(),
      providerKeySecret,
      {
        projectId,
        providerName,
        providerKey,
        userId,
      },
    );
    if (!result) {
      throw new Error("Failed to add provider key");
    }
    return {
      id: result.id,
      name: result.name,
      userId,
    };
  }

  async findAllProviderKeys(projectId: string): Promise<ProviderKeyResponse[]> {
    const providerKeys = await operations.getProviderKeys(
      this.getDb(),
      projectId,
    );
    return providerKeys.map((providerKey) => ({
      id: providerKey.id,
      providerName: providerKey.providerName,
      partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
      providerKeyEncrypted: providerKey.providerKeyEncrypted,
    }));
  }

  async removeProviderKey(
    projectId: string,
    providerKeyId: string,
  ): Promise<ProjectResponse> {
    await operations.deleteProviderKey(this.getDb(), projectId, providerKeyId);
    const project = await this.findOneWithKeys(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return {
      id: project.id,
      name: project.name,
      userId: project.userId,
    };
  }
}
