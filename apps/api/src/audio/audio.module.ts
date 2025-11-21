import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ProjectsModule } from "src/projects/projects.module";
import { AudioController } from "./audio.controller";
import { AudioService } from "./audio.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [AudioController],
  providers: [
    AudioService,
    {
      provide: "OPENAI_API_KEY",
      useFactory: (configService: ConfigService) => {
        const userKey = configService.get("OPENAI_API_KEY");
        const fallbackKey = configService.get("FALLBACK_OPENAI_API_KEY");
        return userKey || fallbackKey;
      },
      inject: [ConfigService],
    },
  ],
  exports: [AudioService],
})
export class AudioModule {}
