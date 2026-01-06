import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { decryptApiKey, hashKey, hideApiKey } from "@tambo-ai-cloud/core";
import { Request } from "express";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectsService } from "../projects.service";

/**
 * This is the symbol used to store the project that the current request is
 * authorized for. It is set by the ApiKeyGuard and used by other guards to
 * ensure that the request is authorized for the correct project.
 */
export const ProjectId = Symbol("projectId");

declare module "express" {
  interface Request {
    [ProjectId]?: string;
  }
}

/**
 * This makes sure that the request has a valid API key, and if so, stores the
 * project ID in `request[ProjectId]`.
 *
 * Use other guards to make sure that the project ID is valid for the current
 * request.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const apiKeyAny = request.headers["x-api-key"];
    const apiKey = Array.isArray(apiKeyAny) ? apiKeyAny[0] : apiKeyAny;
    if (!apiKey) {
      this.logger.error("Missing API key in request");
      return false;
    }

    // Legacy normalization removed; pass `apiKey` directly below.

    try {
      const apiKeySecret = this.configService.get<string>("API_KEY_SECRET");
      if (!apiKeySecret) {
        throw new Error("API_KEY_SECRET is not configured");
      }

      const { storedString: projectId } = decryptApiKey(apiKey, apiKeySecret);

      await this.validateApiKeyWithProject(apiKey, projectId);
      if (!projectId) {
        this.logger.error(`Invalid API key for project ${projectId}`);
        return false;
      }
      request[ProjectId] = projectId;

      this.logger.log(`Valid API key used for project ${projectId}`);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error validating API key: ${message}`, stack);
      return false;
    }
  }

  private async validateApiKeyWithProject(
    encryptedKey: string,
    projectId: string,
  ): Promise<string | null> {
    try {
      const hashedKey = hashKey(encryptedKey);

      const apiKeyId = await this.projectsService.getProjectApiKeyId(
        projectId,
        hashedKey,
      );
      if (!apiKeyId) {
        // Do not log raw API keys. Log only a masked, non-sensitive identifier.
        this.logger.error(
          `Project not found for API key (masked: ${hideApiKey(encryptedKey, 4)})`,
        );
        return null;
      }

      await this.projectsService.updateApiKeyLastUsed(apiKeyId, new Date());

      return apiKeyId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error validating API key: ${message}`, stack);
      return null;
    }
  }
}
