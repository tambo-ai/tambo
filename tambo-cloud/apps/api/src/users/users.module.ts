import { Module } from '@nestjs/common';
import { getDb } from '@use-hydra-ai/db';
import { LoggerModule } from '../common/logger.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [LoggerModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
