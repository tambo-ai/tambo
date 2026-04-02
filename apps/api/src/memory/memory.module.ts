import { Module } from "@nestjs/common";
import { MemoryExtractionService } from "./memory-extraction.service";

@Module({
  providers: [MemoryExtractionService],
  exports: [MemoryExtractionService],
})
export class MemoryModule {}
