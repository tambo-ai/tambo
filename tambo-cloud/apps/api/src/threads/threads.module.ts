import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDb } from '@use-hydra-ai/db';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsModule } from '../projects/projects.module';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [ThreadsController],
  providers: [
    ThreadsService,
    CorrelationLoggerService,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
    {
      provide: 'OPENAI_API_KEY', //todo: weird api keys don't match?
      useFactory: (configService: ConfigService) =>
        configService.get('OPEN_AI_API_KEY'),
      inject: [ConfigService],
    },
  ],
  exports: [ThreadsService],
})
export class ThreadsModule {}
