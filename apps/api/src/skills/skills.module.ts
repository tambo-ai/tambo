import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProjectsModule } from "../projects/projects.module";
import { SkillsController } from "./skills.controller";
import { SkillsService } from "./skills.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
