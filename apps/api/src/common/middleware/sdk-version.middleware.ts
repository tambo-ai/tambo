import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export const SdkVersion: unique symbol = Symbol("sdkVersion");

const SDK_VERSION_HEADER_NAME = "x-tambo-react-version";
const SDK_VERSION_MAX_LENGTH = 64;
const SDK_VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+].+)?$/;

declare module "express" {
  interface Request {
    [SdkVersion]?: string;
  }
}

@Injectable()
export class SdkVersionMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    const header = request.get(SDK_VERSION_HEADER_NAME)?.trim();

    if (
      header &&
      header.length <= SDK_VERSION_MAX_LENGTH &&
      SDK_VERSION_PATTERN.test(header)
    ) {
      request[SdkVersion] = header;
    }
    next();
  }
}
