import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export const SdkVersion: unique symbol = Symbol("sdkVersion");

declare module "express" {
  interface Request {
    [SdkVersion]?: string;
  }
}

@Injectable()
export class SdkVersionMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    const header = request.get("x-tambo-react-version");
    if (header) {
      request[SdkVersion] = header;
    }
    next();
  }
}
