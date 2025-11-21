import { Module } from "@nestjs/common";
import { AIModule } from "../ai/ai.module";
import { ExtractorController } from "./extractor.controller";
@Module({
  imports: [AIModule],
  controllers: [ExtractorController],
  providers: [],
})
export class ExtractorModule {}
