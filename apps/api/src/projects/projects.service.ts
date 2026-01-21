import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { AnalyticsService } from "../common/services/analytics.service";
import { APIKeyResponse } from "./dto/api-key-response.dto";
import {
  ProjectResponse,
  SimpleProjectResponse,
} from "./dto/project-response.dto";
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
    private readonly analytics: AnalyticsService,
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
      name: createProjectDto.name || "New Project",
      userId: createProjectDto.userId,
    });

    return {
      id: project.id,
      name: project.name,
      userId: project.userId,
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
    };
  }

  async findAllForUser(userId: string): Promise<ProjectResponse[]> {
    const projects = await operations.getProjectsForUser(this.getDb(), userId);

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId,
      defaultLlmProviderName: project.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: project.defaultLlmModelName ?? undefined,
      customLlmModelName: project.customLlmModelName ?? undefined,
      customLlmBaseURL: project.customLlmBaseURL ?? undefined,
      customInstructions: project.customInstructions ?? undefined,
      allowSystemPromptOverride: project.allowSystemPromptOverride,
      maxInputTokens: project.maxInputTokens ?? undefined,
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
      agentProviderType: project.agentProviderType,
      agentName: project.agentName ?? undefined,
      agentUrl: project.agentUrl ?? undefined,
      customLlmParameters: project.customLlmParameters ?? undefined,
    }));
  }

  async findOne(id: string): Promise<ProjectResponse | undefined> {
    const project = await operations.getProject(this.getDb(), id);
    if (!project || !project.members[0]) {
      return undefined;
    }
    return {
      id: project.id,
      name: project.name,
      userId: project.members[0].userId,
      defaultLlmProviderName: project.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: project.defaultLlmModelName ?? undefined,
      customLlmModelName: project.customLlmModelName ?? undefined,
      customLlmBaseURL: project.customLlmBaseURL ?? undefined,
      customInstructions: project.customInstructions ?? undefined,
      allowSystemPromptOverride: project.allowSystemPromptOverride,
      maxInputTokens: project.maxInputTokens ?? undefined,
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
      agentProviderType: project.agentProviderType,
      agentName: project.agentName ?? undefined,
      agentUrl: project.agentUrl ?? undefined,
      customLlmParameters: project.customLlmParameters ?? undefined,
    };
  }

  async getProjectApiKeyId(projectId: string, hashedApiKey: string) {
    const apiKeyId = await operations.getProjectApiKeyId(
      this.getDb(),
      projectId,
      hashedApiKey,
    );
    return apiKeyId;
  }
  async findOneWithKeys(id: string): Promise<Project | null> {
    const project = await operations.getProjectWithKeys(this.getDb(), id);
    if (!project || !project.members[0]) {
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
    projectEntity.isTokenRequired = project.isTokenRequired;
    projectEntity.apiKeys = project.apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      hashedKey: apiKey.hashedKey,
      partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
      lastUsed: apiKey.lastUsedAt ?? undefined,
      created: apiKey.createdAt,
      createdByUserId: apiKey.createdByUserId,
    }));
    projectEntity.providerKeys = project.providerKeys.map((providerKey) => ({
      id: providerKey.id,
      providerName: providerKey.providerName,
      providerKeyEncrypted: providerKey.providerKeyEncrypted,
      partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
    }));
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
      defaultLlmProviderName: updated.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: updated.defaultLlmModelName ?? undefined,
      customLlmModelName: updated.customLlmModelName ?? undefined,
      customLlmBaseURL: updated.customLlmBaseURL ?? undefined,
      customInstructions: updated.customInstructions ?? undefined,
      allowSystemPromptOverride: updated.allowSystemPromptOverride,
      maxInputTokens: updated.maxInputTokens ?? undefined,
      isTokenRequired: updated.isTokenRequired,
      providerType: updated.providerType,
      agentProviderType: updated.agentProviderType,
      agentName: updated.agentName ?? undefined,
      agentUrl: updated.agentUrl ?? undefined,
      customLlmParameters: updated.customLlmParameters ?? undefined,
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
    // Check if this is the first API key for the project
    const existingKeys = await operations.getApiKeys(this.getDb(), projectId);
    const isFirstKey = existingKeys.length === 0;

    const apiKeySecret = this.config.getOrThrow("API_KEY_SECRET");
    const apiKey = await operations.createApiKey(this.getDb(), apiKeySecret, {
      projectId,
      userId,
      name,
    });

    // Track API key generation
    this.analytics.capture(userId, "api_key_generated", {
      projectId,
      isFirstKey,
    });

    return apiKey;
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

  async updateApiKeyLastUsed(apiKeyId: string, lastUsed: Date): Promise<void> {
    await operations.updateApiKeyLastUsed(this.getDb(), {
      apiKeyId,
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
      defaultLlmProviderName: result.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: result.defaultLlmModelName ?? undefined,
      customLlmModelName: result.customLlmModelName ?? undefined,
      customLlmBaseURL: result.customLlmBaseURL ?? undefined,
      customInstructions: result.customInstructions ?? undefined,
      maxInputTokens: result.maxInputTokens ?? undefined,
      isTokenRequired: result.isTokenRequired,
      providerType: result.providerType,
      agentProviderType: result.agentProviderType,
      agentName: result.agentName ?? undefined,
      agentUrl: result.agentUrl ?? undefined,
      customLlmParameters: result.customLlmParameters ?? undefined,
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
  ): Promise<SimpleProjectResponse> {
    await operations.deleteProviderKey(this.getDb(), projectId, providerKeyId);
    const project = await this.findOneWithKeys(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return {
      id: project.id,
      name: project.name,
    };
  }
}
