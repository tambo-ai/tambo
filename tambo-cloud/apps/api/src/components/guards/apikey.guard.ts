import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { decryptApiKey, hashKey } from "../../common/key.utils";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectsService } from "../../projects/projects.service";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      this.logger.error("Missing API key in request");
      throw new ForbiddenException("API key is required in x-api-key header");
    }

    try {
      const { storedString: projectIdOrLegacyId } = decryptApiKey(apiKey);

      const projectId = await this.validateApiKeyWithProject(
        apiKey,
        projectIdOrLegacyId,
      );
      if (!projectId) {
        this.logger.error(`Invalid API key for project ${projectIdOrLegacyId}`);
        throw new UnauthorizedException("Invalid API key");
      }
      request.projectId = projectId;

      this.logger.log(`Valid API key used for project ${projectId}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Error validating API key: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException(error.message, {
        cause: error,
      });
    }
  }

  private async validateApiKeyWithProject(
    apiKey: string,
    projectIdOrLegacyId: string,
  ): Promise<string> {
    try {
      const project =
        await this.projectsService.findOneWithKeys(projectIdOrLegacyId);
      if (!project?.id) {
        throw new Error("Project not found");
      }

      const hashedKey = hashKey(apiKey);
      const isValid = project
        .getApiKeys()
        .some((key) => key.hashedKey === hashedKey);

      if (isValid) {
        await this.updateApiKeyLastUsed(project.id, hashedKey);
      }

      return project.id;
    } catch (error: any) {
      throw new UnauthorizedException(error.message, {
        cause: error,
      });
    }
  }

  private async updateApiKeyLastUsed(
    projectId: string,
    hashedKey: string,
  ): Promise<void> {
    await this.projectsService.updateApiKeyLastUsed(
      projectId,
      hashedKey,
      new Date(),
    );
  }
}
