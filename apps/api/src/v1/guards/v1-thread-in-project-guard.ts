import {
  BadRequestException,
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
import { ContextKey } from "../../projects/guards/bearer-token.guard";

/**
 * V1-specific guard that verifies a thread belongs to the authenticated project
 * AND is scoped to the requesting user's contextKey.
 *
 * Unlike the pre-V1 ThreadInProjectGuard (which uses ANY_CONTEXT_KEY),
 * this guard requires a userKey (via query/body param or bearer token)
 * and uses it to scope the thread lookup.
 */
@Injectable()
export class V1ThreadInProjectGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: HydraDatabase,
    private readonly logger: CorrelationLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const projectId = request[ProjectId];
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

    const bearerContextKey = request[ContextKey];
    const queryUserKey =
      typeof request.query?.userKey === "string"
        ? request.query.userKey
        : undefined;
    const bodyUserKey =
      typeof request.body?.userKey === "string"
        ? request.body.userKey
        : undefined;
    const paramUserKey = queryUserKey ?? bodyUserKey;

    if (paramUserKey === "") {
      throw new BadRequestException("userKey cannot be an empty string.");
    }

    const effectiveContextKey = paramUserKey ?? bearerContextKey;

    if (!effectiveContextKey) {
      throw new BadRequestException(
        "userKey is required. Provide it as a query/body parameter or use a bearer token with a context key.",
      );
    }

    try {
      await operations.ensureThreadByProjectId(
        this.db,
        threadId,
        projectId,
        effectiveContextKey,
      );
      this.logger.log(
        `Valid thread ${threadId} access for project ${projectId} with context ${effectiveContextKey}`,
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof ThreadNotFoundError) {
        this.logger.warn(
          `Thread ${threadId} not found or not in project ${projectId} for context ${effectiveContextKey}`,
        );
        return false;
      }
      throw error;
    }
  }
}
