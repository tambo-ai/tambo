import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../common/logger.module";
import { ProjectsModule } from "../projects/projects.module";
import { OAuthController } from "./oauth.controller";

@Module({
  imports: [ConfigModule, LoggerModule, ProjectsModule],
  controllers: [OAuthController],
})
export class OAuthModule {}
