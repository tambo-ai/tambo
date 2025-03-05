import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { HydraDb, HydraTransaction, schema } from '@use-hydra-ai/db';
import { sql } from 'drizzle-orm';
import { Request } from 'express';
import { from } from 'rxjs';
import { decryptApiKey } from '../key.utils';

interface HydraRequest extends Request {
  tx?: HydraTransaction;
}

@Injectable()
export class TransactionInterceptor implements NestInterceptor<HydraRequest> {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDb,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request: HydraRequest = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];
    const apiKeyHeaderString = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader;
    return from(
      this.db.transaction(async (tx) => {
        const projectId = apiKeyHeaderString
          ? decryptApiKey(apiKeyHeaderString)?.storedString
          : null;

        if (!projectId) {
          throw new UnauthorizedException('Invalid API key');
        }
        request.tx = tx; // Attach transaction to request

        await tx.execute(sql`
            -- auth.jwt()
            select set_config('request.apikey.project_id', '${sql.raw(
              projectId,
            )}', TRUE);
            -- set local role
            set local role ${sql.raw(schema.projectApiKeyRole.name)};
            `);
        try {
          const result = await next.handle().toPromise();
          return result;
          // Commit transaction automatically
        } catch (error) {
          console.log('TransactionInterceptor error', error);
          // automatically rollback on unrecognized errors
          if (!(error instanceof HttpException) || error.getStatus() >= 500) {
            tx.rollback(); // Rollback transaction manually on error
          }
          throw error;
        } finally {
          console.log('TransactionInterceptor finally');
          await tx.execute(sql`
            select set_config('request.apikey.project_id', NULL, TRUE);
            reset role;
            `);
          delete request.tx;
        }
      }),
    );
  }
}
