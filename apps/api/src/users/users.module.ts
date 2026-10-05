import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [ConfigModule],
  controllers: [UsersController],
  providers: [CorrelationLoggerService],
})
export class UsersModule {}
