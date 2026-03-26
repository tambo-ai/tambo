import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SkillsController } from "./skills.controller";

@Module({
  imports: [ConfigModule],
  controllers: [SkillsController],
})
export class SkillsModule {}
