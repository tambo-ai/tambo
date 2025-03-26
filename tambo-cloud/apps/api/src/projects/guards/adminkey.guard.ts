import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const apiKeyAny = request.headers["x-api-key"];
    const apiKey = Array.isArray(apiKeyAny) ? apiKeyAny[0] : apiKeyAny;
    if (!apiKey) {
      throw new ForbiddenException("Admin key is required in x-api-key header");
    }

    const validApiKeys =
      this.configService.get<string>("ADMIN_KEYS")?.split(",") || [];

    if (!validApiKeys.includes(apiKey)) {
      throw new ForbiddenException("Invalid Admin key");
    }

    return true;
  }
}
