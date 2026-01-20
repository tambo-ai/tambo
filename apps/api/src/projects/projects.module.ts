import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AnalyticsService } from "../common/services/analytics.service";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [ConfigModule],
  controllers: [ProjectsController],
  providers: [AnalyticsService, ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
