import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getDb } from '@use-hydra-ai/db';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';

@Module({
  imports: [ConfigModule, ProjectsModule, UsersModule],
  controllers: [ThreadsController],
  providers: [
    ThreadsService,
    CorrelationLoggerService,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
  ],
  exports: [ThreadsService],
})
export class ThreadsModule {}
