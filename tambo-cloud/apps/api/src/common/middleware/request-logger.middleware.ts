import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { CorrelationLoggerService } from "../services/logger.service";

export interface RequestLog {
  type: "request" | "response";
  method: string;
  url: string;
  bodyLength?: number;
  userAgent?: string;
  userId?: string;
  statusCode?: number;
  duration?: number;
  contentLength?: number;
  timestamp: string;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CorrelationLoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const correlationId = uuidv4();
    request["correlationId"] = correlationId;
    this.logger.setCorrelationId(correlationId);

    const { method, originalUrl, body } = request;
    const userAgent = request.get("user-agent") || "";
    const startTime = Date.now();

    const requestLog: RequestLog = {
      type: "request",
      method,
      url: originalUrl,
      bodyLength: body ? JSON.stringify(body).length : undefined,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    this.logger.logRequest(requestLog);

    response.on("finish", () => {
      const { statusCode } = response;
      const contentLength = response.get("content-length");
      const duration = Date.now() - startTime;
      const userId = request["userId"] || "unknown";

      const responseLog: RequestLog = {
        type: "response",
        method,
        url: originalUrl,
        statusCode,
        userId,
        duration,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        timestamp: new Date().toISOString(),
      };

      this.logger.logRequest(responseLog);
    });

    next();
  }
}
