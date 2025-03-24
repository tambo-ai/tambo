import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsModule } from "../projects/projects.module";
import { ThreadsController } from "./threads.controller";
import { ThreadsService } from "./threads.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [ThreadsController],
  providers: [
    ThreadsService,
    CorrelationLoggerService,
    {
      provide: "OPENAI_API_KEY", //todo: weird api keys don't match?
      useFactory: (configService: ConfigService) =>
        configService.get("OPENAI_API_KEY"),
      inject: [ConfigService],
    },
  ],
  exports: [ThreadsService],
})
export class ThreadsModule {}
