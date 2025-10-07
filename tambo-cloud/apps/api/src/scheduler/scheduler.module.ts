import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EmailService } from "../common/services/email.service";
import { SchedulerService } from "../common/services/scheduler.service";
import { SchedulerController } from "./scheduler.controller";

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, EmailService, ConfigService],
})
export class SchedulerModule {}
