import {
  HttpException,
  Inject,
  NestMiddleware,
  Provider,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getDb, HydraDb, HydraTransaction, schema } from '@use-hydra-ai/db';
import { sql } from 'drizzle-orm';
import { NextFunction, Response } from 'express';
import { IncomingMessage } from 'http';
import { decryptApiKey } from '../key.utils';

interface HydraRequest extends IncomingMessage {
  tx?: HydraTransaction;
}

export const TRANSACTION = Symbol('TRANSACTION');
/** Gets the active transaction that was created by the TransactionMiddleware */
export const TransactionProvider: Provider = {
  provide: TRANSACTION,
  scope: Scope.REQUEST,
  inject: [REQUEST],
  useFactory: (req: HydraRequest) => req.tx,
};

export const DATABASE = Symbol('DATABASE');
export const DatabaseProvider: Provider = {
  provide: DATABASE,
  useFactory: () => getDb(process.env.DATABASE_URL!),
};

export class TransactionMiddleware implements NestMiddleware {
  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDb,
  ) {}
  async use(req: HydraRequest, res: Response, next: NextFunction) {
    const apiKeyHeader = req.headers['x-api-key'];
    const apiKeyHeaderString = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader;
    const projectId = apiKeyHeaderString
      ? decryptApiKey(apiKeyHeaderString)?.storedString
      : null;

    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }
    const p = this.db.transaction(async (tx) => {
      req.tx = tx; // Attach transaction to request
      await tx.execute(sql`
            -- auth.jwt()
            select set_config('request.apikey.project_id', '${sql.raw(
              projectId,
            )}', TRUE);
            -- set local role
            set local role ${sql.raw(schema.projectApiKeyRole.name)};
            `);

      return await new Promise((resolve, reject) => {
        res.on('finish', async () => {
          try {
            await tx.execute(sql`
                select set_config('request.apikey.project_id', NULL, TRUE);
                reset role;
                `);
            delete (req as HydraRequest).tx;
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });

        next();
      });
    });

    try {
      await p;
    } catch (error) {
      // automatically rollback on unrecognized errors
      if (!(error instanceof HttpException) || error.getStatus() >= 500) {
        // Rollback transaction manually on error
        await (req as HydraRequest).tx?.rollback(); // Access tx from request object
      }
      throw error;
    }
  }
}
