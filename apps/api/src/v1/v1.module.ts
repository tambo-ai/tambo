import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsModule } from "../projects/projects.module";
import { ThreadsModule } from "../threads/threads.module";

/**
 * V1 API module
 *
 * Provides a simplified, streaming-first API following AG-UI protocol patterns.
 * Routes are mounted under /v1/ prefix via RouterModule in app.module.ts.
 */
@Module({
  imports: [ConfigModule, ProjectsModule, ThreadsModule],
  controllers: [],
  providers: [CorrelationLoggerService],
  exports: [],
})
export class V1Module {}
