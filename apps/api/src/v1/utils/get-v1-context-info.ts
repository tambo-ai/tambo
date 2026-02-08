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
      "V1 APIs require exactly one context identifier: provide either userKey (query/body) or an OAuth bearer token with a context key (received both).",
    );
  }

  const contextKey = trimmedUserKey ?? bearerContextKey;

  if (!contextKey) {
    throw new BadRequestException(
      "V1 APIs require exactly one context identifier: provide either userKey (query/body) or an OAuth bearer token with a context key (received neither).",
    );
  }

  return { projectId, contextKey, sdkVersion };
}
