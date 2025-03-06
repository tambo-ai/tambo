import {
  Global,
  MiddlewareConsumer,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger.module';
import {
  DATABASE,
  DatabaseProvider,
  TRANSACTION,
  TransactionMiddleware,
  TransactionProvider,
} from './common/middleware/db-transaction-middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { ComponentsModule } from './components/components.module';
import { ConfigServiceSingleton } from './config.service';
import { ExtractorModule } from './extractor/extractor.module';
import { ProjectsModule } from './projects/projects.module';
import { RegistryModule } from './registry/registry.module';
import { ThreadsModule } from './threads/threads.module';

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
    ComponentsModule,
    ProjectsModule,
    RegistryModule,
    ExtractorModule,
    ThreadsModule,
    GlobalModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    ConfigServiceSingleton.initialize(this.configService);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    consumer.apply(TransactionMiddleware).forRoutes('*');
  }
}
