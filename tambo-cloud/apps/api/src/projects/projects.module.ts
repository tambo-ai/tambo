import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseRepository } from 'src/common/firebase.repository';
import { UsersModule } from 'src/users/users.module';
import { ProjectDto } from './dto/project.dto';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    {
      provide: 'ProjectsRepository',
      useFactory: () =>
        new FirebaseRepository<Project, ProjectDto>('projects', Project),
    },
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
