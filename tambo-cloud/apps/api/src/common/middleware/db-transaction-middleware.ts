import {
  HttpException,
  Inject,
  NestMiddleware,
  Provider,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { REQUEST } from "@nestjs/core";
import { decryptApiKey } from "@tambo-ai-cloud/core";
import {
  getDb,
  type HydraDatabase,
  HydraTransaction,
  schema,
} from "@tambo-ai-cloud/db";
import { sql } from "drizzle-orm";
import { NextFunction, Response } from "express";
import { IncomingMessage } from "http";

interface HydraRequest extends IncomingMessage {
  tx?: HydraTransaction;
}

export const TRANSACTION = Symbol("TRANSACTION");
/** Gets the active transaction that was created by the TransactionMiddleware */
export const TransactionProvider: Provider = {
  provide: TRANSACTION,
  scope: Scope.REQUEST,
  inject: [REQUEST],
  useFactory: (req: HydraRequest) => req.tx,
};

export const DATABASE = Symbol("DATABASE");
export const DatabaseProvider: Provider = {
  provide: DATABASE,
  scope: Scope.REQUEST,
  useFactory: () => getDb(process.env.DATABASE_URL!),
};

let requestSerialNumber = 0;
export class TransactionMiddleware implements NestMiddleware {
  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly configService: ConfigService,
  ) {}
  async use(req: HydraRequest, res: Response, next: NextFunction) {
    const currentRequestSerialNumber = requestSerialNumber++;
    const apiKeyHeader = req.headers["x-api-key"];
    const apiKeyHeaderString = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader;

    const apiKeySecret = this.configService.get<string>("API_KEY_SECRET");
    if (!apiKeySecret) {
      throw new UnauthorizedException("API_KEY_SECRET is not configured");
    }

    // -------------------------------------------------------------------
    // Support new "tambo_<base64>" user-facing keys while remaining
    // backward-compatible with the legacy raw encrypted format.
    // -------------------------------------------------------------------
    const projectId = apiKeyHeaderString
      ? decryptApiKey(apiKeyHeaderString, apiKeySecret).storedString
      : null;

    if (!projectId) {
      throw new UnauthorizedException("Invalid API key");
    }

    console.log(
      `[${currentRequestSerialNumber}] starting transaction ${this.db.$client.totalCount} connections (${this.db.$client.idleCount} idle) with ${req.method} ${req.url}`,
    );
    const p = this.db.transaction(async (tx) => {
      console.log(
        `[${currentRequestSerialNumber}] got transaction ${this.db.$client.totalCount} connections (${this.db.$client.idleCount} idle)`,
      );
      req.tx = tx; // Attach transaction to request
      await tx.execute(sql`
            -- auth.jwt()
            select set_config('request.apikey.project_id', '${sql.raw(
              projectId,
            )}', TRUE);
            -- set local role
            set local role ${sql.raw(schema.projectApiKeyRole.name)};
            `);

      const [finishPromise, resolveFinish, rejectFinish] =
        makeResolvablePromise<boolean>();

      // wire up the finish event to resolve the promise
      res.on("finish", async () => {
        console.log(
          `[${currentRequestSerialNumber}] finishing ${this.db.$client.totalCount} connections (${this.db.$client.idleCount} idle)`,
        );
        try {
          await tx.execute(sql`
                select set_config('request.apikey.project_id', NULL, TRUE);
                reset role;
                `);
          delete req.tx;
          resolveFinish(true);
          console.log(
            `[${currentRequestSerialNumber}] finished ${this.db.$client.totalCount} connections (${this.db.$client.idleCount} idle)`,
          );
        } catch (error) {
          rejectFinish(error);
        }
      });
      console.log(
        `[${currentRequestSerialNumber}] calling next ${this.db.$client.totalCount} connections (${this.db.$client.idleCount} idle)`,
      );

      // it is now safe to call next(), because the finish event will resolve the promise
      next();

      await finishPromise;
    });

    try {
      await p;
    } catch (error) {
      // automatically rollback on unrecognized errors
      if (!(error instanceof HttpException) || error.getStatus() >= 500) {
        // Rollback transaction manually on error
        await req.tx?.rollback(); // Access tx from request object
      }
      throw error;
    }
  }
}
function makeResolvablePromise<T>(): [
  Promise<T>,
  (value: T) => void,
  (reason?: any) => void,
] {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return [promise, resolve!, reject!];
}
