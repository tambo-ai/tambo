import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [ConfigModule],
  controllers: [UsersController],
  providers: [EmailService, CorrelationLoggerService],
})
export class UsersModule {}
