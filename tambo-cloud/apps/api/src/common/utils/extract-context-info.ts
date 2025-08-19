import { BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { ProjectId } from "../../projects/guards/apikey.guard";
import { ContextKey } from "../../projects/guards/bearer-token.guard";

export interface ContextInfo {
  projectId: string;
  contextKey?: string;
}

/**
 * Extracts project ID and context key from the request.
 *
 * The project ID comes from either:
 * - API key authentication (set by ApiKeyGuard)
 * - OAuth bearer token authentication (set by BearerTokenGuard)
 *
 * The context key can come from:
 * - API query parameter (apiContextKey)
 * - OAuth bearer token (set by BearerTokenGuard)
 *
 * If both API parameter and bearer token provide a context key, an exception is thrown
 * as only one source is allowed, with bearer token taking priority.
 *
 * @param request - Express request object
 * @param apiContextKey - Optional context key from API query parameter
 * @returns Object containing projectId and contextKey
 * @throws BadRequestException if project ID is missing or both context key sources are provided
 */
export function extractContextInfo(
  request: Request,
  apiContextKey: string | undefined,
): ContextInfo {
  const projectId = request[ProjectId];
  if (!projectId) {
    throw new BadRequestException("Project ID is required");
  }

  const bearerContextKey = request[ContextKey];

  // Check if both context key sources are provided
  if (apiContextKey && bearerContextKey) {
    throw new BadRequestException(
      "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
    );
  }

  // Bearer token context key takes priority, treat empty string as falsy
  const contextKey = bearerContextKey || apiContextKey || undefined;

  return {
    projectId,
    contextKey,
  };
}
