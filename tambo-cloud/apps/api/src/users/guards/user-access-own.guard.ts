import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../entities/authuser.entity';

@Injectable()
export class UserAccessOwnGuard implements CanActivate {
  private readonly logger = new Logger(UserAccessOwnGuard.name);
  constructor(private readonly usersService: UsersService) {}

  //request only allowed if user being accessed is the user making request
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request['correlationId'];
    const authUser: AuthUser = request.authUser;
    try {
      const user = await this.usersService.findOneByAuthId(authUser.id);
      const requestedUserId: string = request.params.id;
      if (user?.id == requestedUserId) {
        this.logger.log(
          `[${correlationId}] User ${user.id} accessed their own data`,
        );
        return true;
      }
      this.logger.warn(
        `[${correlationId}] User ${user?.id} attempted to access data for user ${requestedUserId}`,
      );
      return false;
    } catch (e: any) {
      this.logger.error(
        `[${correlationId}] Error verifying user access: auth user ${authUser.id}, requested user ${request.params.id}: ${e.message}`,
        e.stack,
      );
      return false;
    }
  }
}
