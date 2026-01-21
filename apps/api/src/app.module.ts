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
import { AnalyticsModule } from "./common/analytics.module";
import { AuthService } from "./common/services/auth.service";
import { EmailService } from "./common/services/email.service";
import { StorageConfigService } from "./common/services/storage-config.service";
import { ConfigServiceSingleton } from "./config.service";
import { OAuthModule } from "./oauth/oauth.module";
import { ProjectsModule } from "./projects/projects.module";
import { RegistryModule } from "./registry/registry.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { StorageModule } from "./storage/storage.module";
import { ThreadsModule } from "./threads/threads.module";
import { UsersModule } from "./users/users.module";
import { V1Module } from "./v1/v1.module";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TransactionProvider, DatabaseProvider, StorageConfigService],
  exports: [TRANSACTION, DATABASE, StorageConfigService],
})
export class GlobalModule {}

@Module({
  imports: [
    ConfigModule.forRoot(),
    AnalyticsModule,
    LoggerModule,
    OAuthModule,
    ProjectsModule,
    RegistryModule,
    ThreadsModule,
    AudioModule,
    GlobalModule,
    UsersModule,
    SchedulerModule,
    StorageModule,
    V1Module,
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
