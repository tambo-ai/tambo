import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsModule } from "../projects/projects.module";
import { ThreadsModule } from "../threads/threads.module";
import { V1Controller } from "./v1.controller";
import { V1Service } from "./v1.service";

/**
 * V1 API module
 *
 * Provides a simplified, streaming-first API following AG-UI protocol patterns.
 * Controllers use @Controller('v1/...') to mount routes under the /v1/ prefix.
 */
@Module({
  imports: [ConfigModule, ProjectsModule, ThreadsModule],
  controllers: [V1Controller],
  providers: [CorrelationLoggerService, V1Service],
  exports: [],
})
export class V1Module {}
