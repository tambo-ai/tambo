import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CorrelationLoggerService } from 'src/common/services/logger.service';
import { AuthUser } from 'src/users/entities/authuser.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ValidUserGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: CorrelationLoggerService,
  ) {}

  //request only allowed if project being created by an authUser with a valid userId
  //assumes AuthGuard has already run and request.authUser is set based on auth token
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authUser: AuthUser = request.authUser;
    try {
      const user = await this.usersService.findOneByAuthId(authUser.id);
      request.userId = user?.id;
      this.logger.log(`Validated user ${user?.id}`);
      return true;
    } catch (e: any) {
      this.logger.error(
        `Failed to validate user with authId ${authUser.id}: ${e.message}`,
        e.stack,
      );
      return false;
    }
  }
}
