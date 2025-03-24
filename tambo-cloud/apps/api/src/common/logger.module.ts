import { Global, Module } from "@nestjs/common";
import { RequestLoggerMiddleware } from "./middleware/request-logger.middleware";
import { CorrelationLoggerService } from "./services/logger.service";

@Global()
@Module({
  providers: [CorrelationLoggerService, RequestLoggerMiddleware],
  exports: [CorrelationLoggerService, RequestLoggerMiddleware],
})
export class LoggerModule {}
