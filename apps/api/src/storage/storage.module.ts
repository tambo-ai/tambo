import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProjectsModule } from "../projects/projects.module";
import { StorageController } from "./storage.controller";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [StorageController],
})
export class StorageModule {}
