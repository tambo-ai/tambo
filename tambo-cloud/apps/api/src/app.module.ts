import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDb } from '@use-hydra-ai/db';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { ComponentsModule } from './components/components.module';
import { ConfigServiceSingleton } from './config.service';
import { ExtractorModule } from './extractor/extractor.module';
import { ProjectsModule } from './projects/projects.module';
import { RegistryModule } from './registry/registry.module';
import { ThreadsModule } from './threads/threads.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    ComponentsModule,
    ProjectsModule,
    RegistryModule,
    ExtractorModule,
    ThreadsModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
  ],
  exports: ['DbRepository'],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    ConfigServiceSingleton.initialize(this.configService);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
