import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { HydraDb } from "@tambo-ai-cloud/db";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { Request } from "express";
import { decodeJwt, jwtVerify } from "jose";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { generateContextKey } from "../../common/utils/generate-context-key";
import { ProjectId } from "./apikey.guard";

/**
 * This is the symbol used to store the context key that the current request is
 * authorized for. It is set by the BearerTokenGuard when an OAuth token is provided.
 */
export const ContextKey = Symbol("contextKey");

declare module "express" {
  interface Request {
    [ContextKey]?: string;
  }
}

/**
 * This guard validates OAuth bearer tokens and extracts the projectId and contextKey.
 * Expects APIKeyGuard to have already run and set the projectId on the request.
 * If no Authorization header is present, it checks if the project requires tokens:
 * - If project.isTokenRequired is true, the request is rejected
 * - If project.isTokenRequired is false, the request continues
 * If a bearer token is present, it validates the token and extracts:
 * - projectId from the 'iss' claim
 * - contextKey from the 'sub' claim (formatted as 'oauth:user:${sub}')
 */
@Injectable()
export class BearerTokenGuard implements CanActivate {
  private db?: HydraDb;

  constructor(private readonly logger: CorrelationLoggerService) {}

  private getDbInstance(): HydraDb {
    if (!this.db) {
      this.db = getDb(process.env.DATABASE_URL!);
    }
    return this.db;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If no Authorization header, check if token is required for this project
    if (!authHeader) {
      // First check if projectId was already set by the API key guard (which runs before this)
      const projectId = request[ProjectId];

      if (!projectId) {
        throw new UnauthorizedException("No project ID provided");
      }

      if (projectId) {
        const db = this.getDbInstance();
        const project = await operations.getProject(db, projectId);

        if (project?.isTokenRequired) {
          this.logger.error(
            `Token required for project ${projectId} but no Authorization header provided`,
          );
          throw new UnauthorizedException("Bearer token required");
        }
      }

      return true;
    }

    // Extract bearer token
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      this.logger.error("Invalid Authorization header format");
      throw new UnauthorizedException("Invalid Authorization header format");
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const db = this.getDbInstance();

      const { projectId: verifiedProjectId, contextKey } =
        await extractProjectIdFromBearerToken(db, token, this.logger);
      // Set the projectId and contextKey on the request
      request[ProjectId] = verifiedProjectId;

      request[ContextKey] = contextKey;

      this.logger.log(
        `Valid OAuth bearer token used for project ${verifiedProjectId} with context ${contextKey}`,
      );

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error validating OAuth bearer token: ${message}`,
        stack,
      );
      throw new UnauthorizedException("Invalid bearer token");
    }
  }
}

async function extractProjectIdFromBearerToken(
  db: HydraDb,
  token: string,
  logger?: CorrelationLoggerService,
) {
  // Decode the token without verification to get the issuer (projectId)
  const payload = decodeJwt(token);

  if (!payload.iss || !payload.sub) {
    logger?.error("Bearer token missing required claims (iss or sub)");
    throw new UnauthorizedException(
      "Bearer token missing required claims (iss or sub)",
    );
  }

  const projectId = payload.iss;

  // Load the per-project signing secret from the database (reusing a shared instance)
  const bearerSecret = await operations.getBearerTokenSecret(db, projectId);
  if (!bearerSecret) {
    logger?.error(`No bearer secret configured for project ${projectId}`);
    throw new UnauthorizedException("Invalid bearer token");
  }
  const signingKey = new TextEncoder().encode(bearerSecret);

  // Validate both issuer and audience claims during verification
  const { payload: verifiedPayload } = await jwtVerify(token, signingKey, {
    issuer: projectId,
    audience: "tambo",
  });

  if (!verifiedPayload.sub || !verifiedPayload.iss) {
    logger?.error("Verified token missing required claims");
    throw new UnauthorizedException("Verified token missing required claims");
  }

  const verifiedProjectId = verifiedPayload.iss;
  // Generate unique context key to prevent cross-provider user ID collisions
  const contextKey = generateContextKey(
    verifiedPayload.original_iss,
    {
      hd: verifiedPayload.original_hd,
      tid: verifiedPayload.original_tid,
      org_id: verifiedPayload.original_org_id,
    },
    verifiedPayload.sub,
  );

  return { projectId: verifiedProjectId, contextKey };
}
