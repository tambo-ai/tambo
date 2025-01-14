import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from 'src/ai/ai.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { ComponentsController } from './components.controller';
import { ComponentsService } from './components.service';

@Module({
  imports: [ConfigModule, ProjectsModule, AIModule],
  controllers: [ComponentsController],
  providers: [ComponentsService],
})
export class ComponentsModule {}
