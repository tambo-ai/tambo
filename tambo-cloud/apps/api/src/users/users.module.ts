import { Module } from '@nestjs/common';
import { FirebaseRepository } from 'src/common/firebase.repository';
import { LoggerModule } from 'src/common/logger.module';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [LoggerModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'UsersRepository',
      useFactory: () => new FirebaseRepository<User, UserDto>('users', User),
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
