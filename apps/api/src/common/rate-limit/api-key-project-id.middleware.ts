import { ConfigService } from "@nestjs/config";
import { decryptApiKey } from "@tambo-ai-cloud/core";
import type { NextFunction, Request, Response } from "express";
import { ProjectId } from "../../projects/guards/apikey.guard";

export function createApiKeyProjectIdMiddleware(
  configService: ConfigService,
): (req: Request, res: Response, next: NextFunction) => void {
  const apiKeySecret = configService.get<string>("API_KEY_SECRET");

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!apiKeySecret) {
      return next();
    }

    const apiKeyAny = req.headers["x-api-key"];
    const apiKey = Array.isArray(apiKeyAny) ? apiKeyAny[0] : apiKeyAny;
    if (!apiKey || typeof apiKey !== "string") {
      return next();
    }

    try {
      const { storedString: projectId } = decryptApiKey(apiKey, apiKeySecret);
      if (typeof projectId === "string" && projectId) {
        (req as Request & { [ProjectId]?: string })[ProjectId] = projectId;
      }
    } catch {
      // Ignore invalid API keys here; authentication will handle failures later.
    }

    next();
  };
}
