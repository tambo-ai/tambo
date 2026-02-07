import { BadRequestException } from "@nestjs/common";
import { type Request } from "express";
import { extractContextInfo } from "../../common/utils/extract-context-info";

export interface V1ContextInfo {
  projectId: string;
  contextKey: string;
  sdkVersion?: string;
}

export function getV1ContextInfo(
  request: Request,
  userKey: string | undefined,
): V1ContextInfo {
  const trimmedUserKey =
    typeof userKey === "string" ? userKey.trim() : undefined;
  if (trimmedUserKey === "") {
    throw new BadRequestException("userKey cannot be an empty string.");
  }

  const {
    projectId,
    contextKey: bearerContextKey,
    sdkVersion,
  } = extractContextInfo(request, undefined);

  if (trimmedUserKey && bearerContextKey) {
    throw new BadRequestException(
      "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
    );
  }

  const contextKey = trimmedUserKey ?? bearerContextKey;

  if (!contextKey) {
    throw new BadRequestException(
      "userKey is required. Provide it as a query/body parameter or use a bearer token with a context key.",
    );
  }

  return { projectId, contextKey, sdkVersion };
}
