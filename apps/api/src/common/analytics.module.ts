import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AnalyticsService } from "./services/analytics.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
