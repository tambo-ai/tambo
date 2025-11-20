import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RegistryController } from "./registry.controller";
import { RegistryService } from "./registry.service";

@Module({
  imports: [ConfigModule],
  controllers: [RegistryController],
  providers: [RegistryService],
})
export class RegistryModule {}
