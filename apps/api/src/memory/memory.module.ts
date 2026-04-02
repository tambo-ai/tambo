import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsModule } from "../projects/projects.module";
import { MemoryController } from "./memory.controller";
import { MemoryExtractionService } from "./memory-extraction.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [MemoryController],
  providers: [MemoryExtractionService, CorrelationLoggerService],
  exports: [MemoryExtractionService],
})
export class MemoryModule {}
