import { Module } from "@nestjs/common";
import { MemoryController } from "./memory.controller";
import { MemoryExtractionService } from "./memory-extraction.service";

@Module({
  controllers: [MemoryController],
  providers: [MemoryExtractionService],
  exports: [MemoryExtractionService],
})
export class MemoryModule {}
