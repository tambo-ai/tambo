import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "../common/services/auth.service";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsModule } from "../projects/projects.module";
import { ThreadsController } from "./threads.controller";
import { ThreadsService } from "./threads.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [ThreadsController],
  providers: [
    ThreadsService,
    EmailService,
    AuthService,
    CorrelationLoggerService,
    {
      provide: "OPENAI_API_KEY", //todo: weird api keys don't match?
      useFactory: (configService: ConfigService) => {
        const userKey = configService.get("OPENAI_API_KEY");
        const fallbackKey = configService.get("FALLBACK_OPENAI_API_KEY");
        return userKey || fallbackKey;
      },
      inject: [ConfigService],
    },
  ],
  exports: [ThreadsService],
})
export class ThreadsModule {}
