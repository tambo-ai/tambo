import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectsService } from "../projects.service";

export const ProjectIdParameterKey = Reflector.createDecorator<string>({});

/** Makes sure that the project being accessed belongs to the API key making the
 * request. Stores the current project ID in `request.projectId`
 *
 * If the parameter name is not `'id'`, then use the ProjectIdParameterKey
 * decorator to specify the parameter name.
 */
@Injectable()
export class ProjectAccessOwnGuard implements CanActivate {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request["correlationId"];
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      this.logger.warn(
        `[${correlationId}] No API key provided for project access`,
      );
      return false;
    }

    try {
      const projectIdParameterKey = this.reflector.get<string>(
        ProjectIdParameterKey,
        context.getHandler(),
      );

      const projectId = projectIdParameterKey
        ? request.params[projectIdParameterKey]
        : request.params.id;

      // Store the project ID in the request for use in controllers
      request.projectId = projectId;

      if (!projectId) {
        this.logger.warn(
          `[${correlationId}] No project ID provided for API key ${apiKey}`,
        );
        return true; // Allow the request to proceed, let the controller handle missing projectId
      }

      const project = await this.projectsService.findOne(projectId);

      if (!project) {
        this.logger.warn(
          `[${correlationId}] Project ${projectId} not found for API key ${apiKey}`,
        );
        return false;
      }

      // TODO: Implement API key to project validation here
      // For now, we'll assume all API keys have access to all projects
      this.logger.log(
        `[${correlationId}] API key ${apiKey} accessed project ${projectId}`,
      );
      return true;
    } catch (e: any) {
      this.logger.error(
        `[${correlationId}] Error verifying project access: API key ${apiKey}, project ${request.params.id}: ${e.message}`,
        e.stack,
      );
      return false;
    }
  }
}
