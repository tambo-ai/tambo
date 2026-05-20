import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsModule } from "../projects/projects.module";
import { MemoryExtractionService } from "./memory-extraction.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  providers: [MemoryExtractionService, CorrelationLoggerService],
  exports: [MemoryExtractionService],
})
export class MemoryModule {}
