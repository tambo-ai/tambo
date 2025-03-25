import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../../common/middleware/db-transaction-middleware";
import { CorrelationLoggerService } from "../../common/services/logger.service";

@Injectable()
export class ThreadInProjectGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: HydraDatabase,
    private readonly logger: CorrelationLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const threadId = request.params.id;
    const projectId = request.projectId;

    if (!threadId) {
      this.logger.error("Missing thread ID in request parameters");
      throw new BadRequestException("Thread ID is required");
    }

    if (!projectId) {
      this.logger.error("Missing project ID in request");
      throw new BadRequestException("Project ID is required");
    }

    try {
      await operations.ensureThreadByProjectId(this.db, threadId, projectId);
      this.logger.log(
        `Valid thread ${threadId} access for project ${projectId}`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(
        `Error validating thread access: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException("Invalid thread access", {
        cause: error,
      });
    }
  }
}
