import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import {
  type HydraDatabase,
  operations,
  ThreadNotFoundError,
} from "@tambo-ai-cloud/db";
import { type Request } from "express";
import { DATABASE } from "../../common/middleware/db-transaction-middleware";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectId } from "../../projects/guards/apikey.guard";

@Injectable()
export class ThreadInProjectGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: HydraDatabase,
    private readonly logger: CorrelationLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const projectId = request[ProjectId];
    // Support :threadId (v1 API), :thread_id (v1 API snake_case), and :id (legacy)
    const threadId =
      request.params.threadId ?? request.params.thread_id ?? request.params.id;

    if (!threadId) {
      this.logger.error("Missing thread ID in request parameters");
      return false;
    }

    if (!projectId) {
      this.logger.error(
        "Missing project ID in request: should be set by ApiKeyGuard",
      );
      return false;
    }

    try {
      // Use ANY_CONTEXT_KEY because this guard only verifies the thread belongs
      // to the project.
      await operations.ensureThreadByProjectId(
        this.db,
        threadId,
        projectId,
        operations.ANY_CONTEXT_KEY,
      );
      this.logger.log(
        `Valid thread ${threadId} access for project ${projectId}`,
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof ThreadNotFoundError) {
        this.logger.warn(
          `Thread ${threadId} not found or not in project ${projectId}`,
        );
        return false;
      }
      throw error;
    }
  }
}
