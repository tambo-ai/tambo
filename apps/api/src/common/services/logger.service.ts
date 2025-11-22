import { Injectable, Logger, Scope } from "@nestjs/common";
import { RequestLog } from "../middleware/request-logger.middleware";

@Injectable({ scope: Scope.REQUEST })
export class CorrelationLoggerService extends Logger {
  private correlationId?: string;

  setCorrelationId(correlationId: string) {
    this.correlationId = correlationId;
  }

  log(message: any) {
    super.log(this.formatMessage(message));
  }

  error(message: any, trace?: string) {
    super.error(this.formatMessage(message), trace);
  }

  warn(message: any) {
    super.warn(this.formatMessage(message));
  }

  debug(message: any) {
    super.debug(this.formatMessage(message));
  }

  verbose(message: any) {
    super.verbose(this.formatMessage(message));
  }

  logRequest(log: RequestLog) {
    this.log(JSON.stringify(log));
  }

  formatMessage(message: any): string {
    if (!this.correlationId) {
      return message;
    }
    return `[correlationId: ${this.correlationId}] ${message}`;
  }
}
