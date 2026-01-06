import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StorageService } from "../common/services/storage.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
