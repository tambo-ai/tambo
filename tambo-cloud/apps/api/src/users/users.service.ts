import {
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import * as repositoryInterface from 'src/common/repository.interface';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger: LoggerService | undefined;
  constructor(
    @Inject('UsersRepository')
    private readonly repository: repositoryInterface.RepositoryInterface<
      User,
      UserDto
    >,
  ) {}

  async create(createUserDto: UserDto): Promise<User> {
    const user = await this.repository.create(createUserDto);
    return user;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.get(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  async findOneByAuthId(id: string): Promise<User | null> {
    try {
      const user = await this.repository.getByField('authId', id);
      return user;
    } catch (e) {
      this.logger?.error(e);
      throw new NotFoundException();
    }
  }
}
