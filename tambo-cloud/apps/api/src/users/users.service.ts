import {
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { HydraDatabase, schema } from '@use-hydra-ai/db';
import { eq } from 'drizzle-orm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger: LoggerService | undefined;
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDatabase,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.db.query.authUsers.findFirst({
      where: eq(schema.authUsers.id, id),
    });
    if (!user) {
      throw new NotFoundException();
    }
    return {
      id: user.id,
      authId: user.id,
      email: user.email ?? undefined,
    };
  }

  async findOneByAuthId(id: string): Promise<User | null> {
    try {
      const user = await this.db.query.authUsers.findFirst({
        where: eq(schema.authUsers.id, id),
      });
      if (!user) {
        throw new NotFoundException();
      }
      return {
        authId: user.id,
        id: user.id,
        email: user.email ?? undefined,
      };
    } catch (e) {
      this.logger?.error(e);
      throw new NotFoundException();
    }
  }
}
