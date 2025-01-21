import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CorrelationLoggerService } from '../../common/services/logger.service';
import { AuthUser } from '../../users/entities/authuser.entity';
import { UsersService } from '../../users/users.service';
import { ProjectsService } from '../projects.service';

@Injectable()
export class ProjectAccessOwnGuard implements CanActivate {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly logger: CorrelationLoggerService,
  ) {}

  //request only allowed if project being accessed belongs to user making request
  //expects that request has a param called 'id' which represents the project being accessed
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request['correlationId'];
    const authUser: AuthUser = request.authUser;
    try {
      const user = await this.usersService.findOneByAuthId(authUser.id);
      if (request.params.userId) {
        if (request.params.userId != user?.id) {
          this.logger.warn(
            `[${correlationId}] User ${user?.id} attempted to access project for user ${request.params.userId}`,
          );
          return false;
        }
      }
      const projectId = request.params.id;
      const project = await this.projectsService.findOne(projectId);
      if (!project) {
        this.logger.warn(
          `[${correlationId}] Project ${projectId} not found for user ${user?.id}`,
        );
        return false;
      }
      if (project.userId === user?.id) {
        request.userId = user?.id;
        this.logger.log(
          `[${correlationId}] User ${user?.id} accessed their project ${projectId}`,
        );
        return true;
      }
      this.logger.warn(
        `[${correlationId}] User ${user?.id} attempted to access project ${projectId} owned by ${project.userId}`,
      );
      return false;
    } catch (e: any) {
      this.logger.error(
        `[${correlationId}] Error verifying project access: auth user ${authUser.id}, project ${request.params.id}: ${e.message}`,
        e.stack,
      );
      return false;
    }
  }
}
