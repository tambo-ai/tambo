import {
  Global,
  MiddlewareConsumer,
  Module,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AudioModule } from "./audio/audio.module";
import { LoggerModule } from "./common/logger.module";
import {
  DATABASE,
  DatabaseProvider,
  TRANSACTION,
  TransactionProvider,
} from "./common/middleware/db-transaction-middleware";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { AuthService } from "./common/services/auth.service";
import { EmailService } from "./common/services/email.service";
import { ConfigServiceSingleton } from "./config.service";
import { ExtractorModule } from "./extractor/extractor.module";
import { OAuthModule } from "./oauth/oauth.module";
import { ProjectsModule } from "./projects/projects.module";
import { RegistryModule } from "./registry/registry.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { ThreadsModule } from "./threads/threads.module";
import { UsersModule } from "./users/users.module";

@Global()
@Module({
  providers: [TransactionProvider, DatabaseProvider],
  exports: [TRANSACTION, DATABASE],
})
export class GlobalModule {}

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    OAuthModule,
    ProjectsModule,
    RegistryModule,
    ExtractorModule,
    ThreadsModule,
    AudioModule,
    GlobalModule,
    UsersModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService, AuthService],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    ConfigServiceSingleton.initialize(this.configService);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
